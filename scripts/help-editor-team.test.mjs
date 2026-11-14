import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHelpEditor } from "./help-editor-server.mjs";
import {
  createHelpTeam,
  requireCapability,
  roles,
} from "./help-editor-team.mjs";
const root = new URL("..", import.meta.url).pathname;
const members = [
  { id: "admin-user", name: "Admin", role: "owner" },
  { id: "writer-user", name: "Autor", role: "member" },
  { id: "review-user", name: "Prüfer", role: "member" },
  { id: "other-user", name: "Leser", role: "member" },
];
async function fixture(t, local = false) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "help-team-test-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, "docs"), { recursive: true });
  await cp(
    path.join(root, "docs/helpcenter"),
    path.join(dir, "docs/helpcenter"),
    {
      recursive: true,
      filter: (src) =>
        !src.split(path.sep).some((p) => ["qa", "video-source"].includes(p)),
    },
  );
  const services = new Map(),
    control = { failBuild: false };
  const serviceFor = (actor) => {
    if (!services.has(actor.id))
      services.set(
        actor.id,
        createHelpEditor(dir, {
          stateDirectory: path.join(dir, ".helpcenter-editor/users", actor.id),
          build: async () => {
            if (control.failBuild) throw new Error("Generator failed");
          },
        }),
      );
    return services.get(actor.id);
  };
  const team = createHelpTeam(dir, {
    ...(local
      ? {}
      : {
          origin: "http://localhost:3000",
          workspaceId: "workspace-a",
          fetchSession: async (req) => ({
            workspaceId: "workspace-a",
            user: members.find((m) => m.id === req.headers.cookie),
            members,
          }),
        }),
    serviceFor,
  });
  const actor = (id) => team.authenticate({ headers: { cookie: id } });
  return { dir, team, serviceFor, actor, control };
}
async function grant(f, admin, id, role) {
  await f.team.member(admin, {
    id,
    role,
    revision: (await f.team.access(admin)).revision,
  });
}
test("capabilities are hierarchical and unknown roles/actions fail closed", () => {
  for (const [i, role] of roles.entries()) {
    assert.doesNotThrow(() => requireCapability({ role }, "read"));
    if (i < 2) assert.throws(() => requireCapability({ role }, "edit"));
    else assert.doesNotThrow(() => requireCapability({ role }, "edit"));
  }
  assert.throws(() => requireCapability({ role: "admin" }, "unknown"));
  assert.throws(() => requireCapability({ role: "arbitrary" }, "read"));
});
test("session authentication denies missing cookies, other workspaces and unassigned members; revocation is immediate", async (t) => {
  const f = await fixture(t);
  await assert.rejects(
    f.team.authenticate({ headers: {} }),
    (e) => e.status === 401,
  );
  await assert.rejects(f.actor("writer-user"), (e) => e.status === 403);
  const admin = await f.actor("admin-user");
  await grant(f, admin, "writer-user", "editor");
  assert.equal((await f.actor("writer-user")).role, "editor");
  await grant(f, admin, "writer-user", "none");
  await assert.rejects(f.actor("writer-user"), (e) => e.status === 403);
  const other = createHelpTeam(f.dir, {
    origin: "https://example.test",
    workspaceId: "wrong",
    fetchSession: async () => ({
      workspaceId: "workspace-a",
      user: members[0],
      members,
    }),
  });
  await assert.rejects(
    other.authenticate({ headers: { cookie: "x" } }),
    (e) => e.status === 403,
  );
});
test("member changes require admin, current revision and existing workspace membership; inherited administration is protected", async (t) => {
  const f = await fixture(t),
    admin = await f.actor("admin-user");
  await grant(f, admin, "writer-user", "editor");
  await assert.rejects(
    f.team.member(await f.actor("writer-user"), {
      id: "review-user",
      role: "admin",
    }),
    (e) => e.status === 403,
  );
  await assert.rejects(
    f.team.member(admin, {
      id: "review-user",
      role: "reviewer",
      revision: "stale",
    }),
    (e) => e.status === 409,
  );
  await assert.rejects(grant(f, admin, "foreign-user", "editor"));
  await assert.rejects(grant(f, admin, "admin-user", "reader"));
});
test("submitted snapshots are immutable, authors cannot approve themselves, reviewers publish exactly the submitted version", async (t) => {
  const f = await fixture(t),
    admin = await f.actor("admin-user");
  await grant(f, admin, "writer-user", "reviewer");
  await grant(f, admin, "review-user", "reviewer");
  const writer = await f.actor("writer-user"),
    reviewer = await f.actor("review-user");
  const source = await f.serviceFor(writer).document("article", "schnellstart");
  const proposal = { ...source, title: source.title + " – eingereicht" };
  const request = await f.team.submit(writer, proposal);
  proposal.title = "Später geändert";
  await f.serviceFor(writer).saveDraft(proposal);
  const detail = await f.team.detail(reviewer, request.id);
  assert.match(detail.document.title, /eingereicht$/);
  assert.equal(
    (await f.serviceFor(reviewer).document("article", "schnellstart")).title,
    source.title,
  );
  await assert.rejects(
    f.team.decide(writer, {
      id: request.id,
      version: detail.version,
      action: "approve",
    }),
    (e) => e.status === 403,
  );
  const approved = await f.team.decide(reviewer, {
    id: request.id,
    version: detail.version,
    action: "approve",
  });
  assert.equal(approved.status, "approved");
  assert.match(
    (await f.serviceFor(reviewer).document("article", "schnellstart")).title,
    /eingereicht$/,
  );
  assert.equal(
    (await f.serviceFor(writer).readDraft("article", "schnellstart")).title,
    "Später geändert",
  );
  await assert.rejects(
    f.team.decide(reviewer, {
      id: request.id,
      version: detail.version,
      action: "approve",
    }),
    (e) => e.status === 409,
  );
  assert.ok(
    (await f.team.list(admin)).audit.some((e) => e.action === "review.approve"),
  );
});
test("stale proposals fail publication; comments and requested changes retain attribution and version checks", async (t) => {
  const f = await fixture(t),
    admin = await f.actor("admin-user");
  await grant(f, admin, "writer-user", "editor");
  await grant(f, admin, "other-user", "commenter");
  const writer = await f.actor("writer-user"),
    commenter = await f.actor("other-user");
  const source = await f.serviceFor(writer).document("article", "schnellstart");
  const request = await f.team.submit(writer, {
    ...source,
    title: "Änderung zur Prüfung",
  });
  await assert.rejects(f.team.submit(writer, source), (e) => e.status === 409);
  const commented = await f.team.decide(commenter, {
    id: request.id,
    version: 1,
    action: "comment",
    comment: "Bitte genauer erklären.",
  });
  assert.equal(commented.comments[0].actor.id, "other-user");
  await assert.rejects(
    f.team.decide(commenter, {
      id: request.id,
      version: commented.version,
      action: "approve",
    }),
    (e) => e.status === 403,
  );
  await f
    .serviceFor(admin)
    .apply({ ...source, title: "Zwischenzeitlich geändert" });
  await assert.rejects(
    f.team.decide(admin, {
      id: request.id,
      version: commented.version,
      action: "approve",
    }),
    (e) => e.status === 409,
  );
  const stale = await f.team.detail(admin, request.id);
  assert.equal(stale.stale, true);
  assert.equal(stale.status, "pending");
  const rejected = await f.team.decide(admin, {
    id: request.id,
    version: stale.version,
    action: "reject",
    comment: "Bitte aktuellen Stand verwenden.",
  });
  assert.equal(rejected.status, "rejected");
});
test("concurrent decisions publish once; failed generation leaves a pending review and source unchanged", async (t) => {
  const f = await fixture(t),
    admin = await f.actor("admin-user"),
    source = await f.serviceFor(admin).document("article", "schnellstart");
  const request = await f.team.submit(admin, {
    ...source,
    title: "Parallel freigeben",
  });
  // Local test mode is the sole explicit exception to independent approval.
  const local = await fixture(t, true),
    localActor = await local.actor("local"),
    original = await local
      .serviceFor(localActor)
      .document("article", "schnellstart");
  const r = await local.team.submit(localActor, {
    ...original,
    title: "Lokaler Vorschlag",
  });
  const results = await Promise.allSettled([
    local.team.decide(localActor, { id: r.id, version: 1, action: "approve" }),
    local.team.decide(localActor, { id: r.id, version: 1, action: "approve" }),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((await f.team.detail(admin, request.id)).status, "pending");
  await grant(f, admin, "review-user", "reviewer");
  const reviewer = await f.actor("review-user");
  f.control.failBuild = true;
  await assert.rejects(
    f.team.decide(reviewer, { id: request.id, version: 1, action: "approve" }),
    (e) => e.status === 422,
  );
  assert.equal((await f.team.detail(reviewer, request.id)).status, "pending");
  assert.equal(
    (await f.serviceFor(admin).document("article", "schnellstart")).title,
    source.title,
  );
});
test("auth configuration is explicit and never falls back to local after authentication failure", async (t) => {
  const f = await fixture(t);
  assert.throws(() =>
    createHelpTeam(f.dir, { origin: "https://example.test" }),
  );
  assert.throws(() =>
    createHelpTeam(f.dir, { origin: "http://example.test", workspaceId: "a" }),
  );
  const failed = createHelpTeam(f.dir, {
    origin: "http://localhost:3000",
    workspaceId: "a",
    fetchSession: async () => {
      throw new Error("offline");
    },
  });
  await assert.rejects(
    failed.authenticate({ headers: { cookie: "session" } }),
    (e) => e.status === 503,
  );
});

test("HTTP endpoints enforce session identity, role checks and review-only publishing", async (t) => {
  const f = await fixture(t),
    admin = await f.actor("admin-user");
  await grant(f, admin, "writer-user", "editor");
  await grant(f, admin, "other-user", "reader");
  const { helpEditorPlugin } = await import("./help-editor-server.mjs");
  let middleware;
  helpEditorPlugin(f.dir, {
    origin: "http://localhost:3000",
    workspaceId: "workspace-a",
    fetchSession: async (req) => ({
      workspaceId: "workspace-a",
      user: members.find((m) => m.id === req.headers.cookie),
      members,
    }),
  }).configureServer({
    middlewares: {
      use(fn) {
        middleware = fn;
      },
    },
  });
  async function call(actor, route, value, token) {
    let output;
    const res = {
      setHeader() {},
      end(body) {
        output = JSON.parse(body);
      },
    };
    const req = {
      url: `/__help-editor/${route}`,
      method: value === undefined ? "GET" : "POST",
      headers: {
        host: "localhost:4173",
        cookie: actor,
        ...(value === undefined
          ? {}
          : {
              "content-type": "application/json",
              "x-help-editor-token": token,
            }),
      },
      socket: { remoteAddress: "127.0.0.1" },
      async *[Symbol.asyncIterator]() {
        yield JSON.stringify(value);
      },
    };
    await middleware(req, res, () => {});
    return { status: res.statusCode, data: output };
  }
  const access = await call("writer-user", "access");
  assert.equal(access.status, 200);
  const token = access.data.token;
  assert.equal((await call("writer-user", "apply", {}, token)).status, 403);
  assert.equal((await call("writer-user", "site", {}, token)).status, 403);
  assert.equal((await call("other-user", "draft", {}, token)).status, 403);
  assert.equal(
    (await call("other-user", "review-submit", {}, token)).status,
    403,
  );
  assert.equal((await call("writer-user", "asset", {}, "wrong")).status, 403);
  await grant(f, admin, "writer-user", "none");
  assert.equal((await call("writer-user", "bootstrap")).status, 403);
});
