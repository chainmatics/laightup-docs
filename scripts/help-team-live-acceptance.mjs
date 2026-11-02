// Real backend sessions, real HTTP middleware and generator; disposable authoring copy.
// Never publish test changes into the actual documentation sources.
import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, cp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { helpEditorPlugin } from "./help-editor-server.mjs";
const root = fileURLToPath(new URL("..", import.meta.url));
const state = path.join(root, ".helpcenter-editor/team-test");
const c = JSON.parse(
  await readFile(path.join(state, "credentials.json"), "utf8"),
);
const checks = [];
async function auth(route, data, cookie) {
  const res = await fetch(`http://127.0.0.1:3000/api/${route}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(data ?? {}),
    signal: AbortSignal.timeout(10000),
  });
  assert.equal(res.status, 200, `Backend ${route} must succeed`);
  return (
    res.headers
      .getSetCookie()
      .find((v) => v.startsWith("authToken="))
      ?.split(";")[0] ?? cookie
  );
}
const admin = await auth("auth/login", {
  email: c.admin.email,
  password: c.admin.password,
});
let editor = await auth("auth/login", {
  email: c.editor.email,
  password: c.editor.password,
});
const sandbox = path.join(state, "acceptance");
await rm(sandbox, { recursive: true, force: true });
await mkdir(path.join(sandbox, "docs"), { recursive: true });
await cp(
  path.join(root, "docs/helpcenter"),
  path.join(sandbox, "docs/helpcenter"),
  {
    recursive: true,
    filter: (src) =>
      !src.split(path.sep).some((p) => ["qa", "video-source"].includes(p)),
  },
);
await cp(path.join(root, "scripts"), path.join(sandbox, "scripts"), {
  recursive: true,
});
let middleware;
helpEditorPlugin(sandbox, {
  origin: "http://127.0.0.1:3000",
  workspaceId: c.workspaceId,
}).configureServer({
  middlewares: {
    use(fn) {
      middleware = fn;
    },
  },
});
const server = createServer((req, res) =>
  middleware(req, res, () => {
    res.statusCode = 404;
    res.end();
  }),
);
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
async function call(cookie, route, data, token, expected = 200) {
  const response = await fetch(`${origin}/__help-editor/${route}`, {
    method: data === undefined ? "GET" : "POST",
    headers: {
      ...(cookie ? { cookie } : {}),
      origin,
      ...(data === undefined
        ? {}
        : {
            "Content-Type": "application/json",
            "X-Help-Editor-Token": token ?? "",
          }),
    },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
    signal: AbortSignal.timeout(40000),
  });
  const value = await response.json();
  assert.equal(
    response.status,
    expected,
    `${route}: ${value.error ?? "unexpected HTTP response"}`,
  );
  return value;
}
let aa, ea;
async function role(value) {
  aa = await call(
    admin,
    "member",
    { id: c.editor.id, role: value, revision: aa.revision },
    aa.token,
  );
  aa.token ??= ea?.token;
}
try {
  await call(null, "site", undefined, undefined, 401);
  await call(editor, "bootstrap", undefined, undefined, 403);
  checks.push("Unangemeldete und unzugewiesene Benutzer sind gesperrt.");
  aa = await call(admin, "access");
  const token = aa.token;
  assert.equal(aa.mode, "session");
  assert.equal(aa.members.length, 2);
  await role("editor");
  aa.token = token;
  ea = await call(editor, "access");
  assert.equal(ea.actor.role, "editor");
  checks.push(
    "Zwei echte Workspace-Konten; Administrator weist die Redakteursrolle zu.",
  );
  await call(editor, "site", {}, token, 403);
  await call(editor, "member", {}, token, 403);
  await call(editor, "apply", {}, token, 403);
  checks.push(
    "Direkte API-Aufrufe umgehen weder Struktur-/Mitgliederrechte noch den Freigabeprozess.",
  );
  const sourceFile = path.join(
    sandbox,
    "docs/helpcenter/locales/de/articles/bibliothek.md",
  );
  const originalBytes = await readFile(sourceFile, "utf8");
  const source = (await call(editor, "document?kind=article&id=bibliothek"))
    .document;
  const proposed = { ...source, title: source.title + " · Teamprüfung" };
  await call(editor, "draft", proposed, token);
  assert.equal(
    (await call(admin, "document?kind=article&id=bibliothek")).draft,
    null,
  );
  assert.equal(
    (await call(editor, "document?kind=article&id=bibliothek")).draft.title,
    proposed.title,
  );
  checks.push(
    "Persönliche Entwürfe bleiben zwischen den beiden Sitzungen getrennt.",
  );
  const request = await call(editor, "review-submit", proposed, token);
  assert.equal(await readFile(sourceFile, "utf8"), originalBytes);
  await call(
    editor,
    "draft",
    { ...proposed, title: "Spätere, nicht eingereichte Änderung" },
    token,
  );
  let detail = await call(admin, `review?id=${request.id}`);
  assert.equal(detail.document.title, proposed.title);
  detail = await call(
    admin,
    "review-decide",
    {
      id: detail.id,
      version: detail.version,
      action: "comment",
      comment: "Den eingereichten Stand geprüft.",
    },
    token,
  );
  assert.equal(detail.comments[0].actor.id, c.admin.id);
  await role("reviewer");
  aa.token = token;
  await call(
    editor,
    "review-decide",
    { id: detail.id, version: detail.version, action: "approve" },
    token,
    403,
  );
  await role("editor");
  aa.token = token;
  checks.push(
    "Vorschlag bleibt unverändert; Kommentar ist zugeordnet; eigene Freigabe ist auch mit Prüferrolle gesperrt.",
  );
  detail = await call(
    admin,
    "review-decide",
    { id: detail.id, version: detail.version, action: "approve" },
    token,
  );
  assert.equal(detail.status, "approved");
  const catalog = JSON.parse(
    await readFile(path.join(sandbox, "docs/helpcenter/catalog.json"), "utf8"),
  );
  assert.equal(
    catalog.articles.find((a) => a.id === "bibliothek").title,
    proposed.title,
  );
  assert.equal(
    (await call(editor, "document?kind=article&id=bibliothek")).draft.title,
    "Spätere, nicht eingereichte Änderung",
  );
  checks.push(
    "Unabhängige Freigabe aktualisiert den generierten Katalog exakt mit dem eingereichten Stand.",
  );
  const current = (await call(editor, "document?kind=article&id=bibliothek"))
    .document;
  const stale = await call(
    editor,
    "review-submit",
    { ...current, title: "Überholter Vorschlag" },
    token,
  );
  await writeFile(
    sourceFile,
    (await readFile(sourceFile, "utf8")) +
      "\nEine zwischenzeitliche Änderung im isolierten Test.\n",
  );
  const beforeStale = await readFile(sourceFile, "utf8");
  await call(
    admin,
    "review-decide",
    { id: stale.id, version: 1, action: "approve" },
    token,
    409,
  );
  assert.equal(await readFile(sourceFile, "utf8"), beforeStale);
  detail = await call(admin, `review?id=${stale.id}`);
  assert.equal(detail.stale, true);
  detail = await call(
    admin,
    "review-decide",
    {
      id: stale.id,
      version: detail.version,
      action: "reject",
      comment: "Bitte auf aktueller Quelle neu einreichen.",
    },
    token,
  );
  assert.equal(detail.status, "rejected");
  checks.push(
    "Veraltete Quellen werden nicht überschrieben; begründete Rückgabe funktioniert.",
  );
  await role("none");
  aa.token = token;
  await call(editor, "bootstrap", undefined, undefined, 403);
  await call(editor, "draft", proposed, token, 403);
  await role("editor");
  aa.token = token;
  await auth("auth/logout", {}, editor);
  await call(editor, "access", undefined, undefined, 401);
  checks.push(
    "Rechteentzug wirkt bei der nächsten Anfrage; eine abgemeldete Sitzung wird abgewiesen.",
  );
  const report = {
    at: new Date().toISOString(),
    workspaceId: c.workspaceId,
    backend: "http://127.0.0.1:3000",
    checks,
    passed: checks.length,
    isolatedSources: true,
  };
  await writeFile(
    path.join(state, "acceptance-result.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(
    `${checks.length} echte Team-Prüfungen erfolgreich. Originaldokumentation unverändert.`,
  );
  for (const check of checks) console.log(`✓ ${check}`);
} finally {
  await auth("auth/logout", {}, admin).catch(() => {});
  await new Promise((resolve) => server.close(resolve));
}
