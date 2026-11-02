import { readFile, writeFile, mkdir, rename } from "node:fs/promises";
import { randomUUID, createHash } from "node:crypto";
import path from "node:path";
import { EditorError } from "./help-editor-server.mjs";

export const roles = [
  "reader",
  "commenter",
  "editor",
  "reviewer",
  "creator",
  "admin",
];
const minimum = {
  read: "reader",
  comment: "commenter",
  edit: "editor",
  review: "reviewer",
  structure: "creator",
  settings: "admin",
  members: "admin",
};
export function requireCapability(actor, action) {
  if (
    !minimum[action] ||
    roles.indexOf(actor.role) < roles.indexOf(minimum[action])
  )
    throw new EditorError("Für diese Aktion fehlen dir die Rechte.", 403);
}
const hash = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const idPattern = /^[a-zA-Z0-9-]{1,100}$/;
const identity = (actor) => ({ id: actor.id, name: actor.name });
const atomic = async (file, value) => {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(temp, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });
  await rename(temp, file);
};
export function createHelpTeam(
  root,
  { origin, workspaceId, fetchSession, serviceFor } = {},
) {
  if (!!origin !== !!workspaceId)
    throw new Error(
      "HELP_EDITOR_AUTH_ORIGIN und HELP_EDITOR_WORKSPACE_ID gemeinsam konfigurieren.",
    );
  if (origin) {
    const url = new URL(origin);
    if (
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      (url.protocol !== "https:" &&
        !(
          url.protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
        ))
    )
      throw new Error(
        "Die Anmeldung benötigt eine HTTPS- oder lokale Backend-Origin.",
      );
    if (!idPattern.test(workspaceId)) throw new Error("Ungültiger Workspace.");
  }
  const mode = origin ? "session" : "local";
  const file = path.join(
    root,
    ".helpcenter-editor",
    "team",
    `${workspaceId ?? "local"}.json`,
  );
  let queue = Promise.resolve();
  const serial = (work) => {
    const next = queue.then(work);
    queue = next.catch(() => {});
    return next;
  };
  async function read() {
    try {
      return JSON.parse(await readFile(file, "utf8"));
    } catch (e) {
      if (e.code === "ENOENT") return { members: {}, requests: [], audit: [] };
      throw e;
    }
  }
  const event = (state, actor, action, target) =>
    state.audit.push({
      id: randomUUID(),
      at: new Date().toISOString(),
      actor: identity(actor),
      action,
      target,
    });
  async function authenticate(req) {
    if (mode === "local")
      return {
        id: "local",
        name: "Lokale Redaktion",
        role: "admin",
        workspaceId: "local",
        members: [],
        mode,
      };
    if (!req.headers.cookie)
      throw new EditorError("Bitte zuerst anmelden.", 401);
    let data;
    try {
      if (fetchSession) data = await fetchSession(req);
      else {
        const response = await fetch(
          `${new URL(origin).origin}/api/help-authoring/session`,
          {
            headers: { cookie: req.headers.cookie },
            redirect: "error",
            signal: AbortSignal.timeout(5000),
          },
        );
        if ([401, 403].includes(response.status))
          throw new EditorError("Bitte erneut anmelden.", 401);
        if (!response.ok) throw new Error("Backend nicht verfügbar");
        data = await response.json();
        // Supports the existing global API response interceptor.
        data = data.data ?? data;
      }
    } catch (e) {
      if (e instanceof EditorError) throw e;
      throw new EditorError(
        "Der Anmeldedienst ist nicht erreichbar. Es wird kein lokaler Zugriff freigeschaltet.",
        503,
      );
    }
    if (
      data.workspaceId !== workspaceId ||
      !idPattern.test(data.user?.id) ||
      !Array.isArray(data.members)
    )
      throw new EditorError(
        "Kein Zugriff auf diesen Dokumentations-Workspace.",
        403,
      );
    const state = await read();
    const role = ["owner", "admin"].includes(data.user.role)
      ? "admin"
      : (state.members[data.user.id] ?? null);
    const actor = {
      ...data.user,
      workspaceId,
      role,
      members: data.members,
      mode,
    };
    requireCapability(actor, "read");
    return actor;
  }
  async function access(actor) {
    const state = await read();
    return {
      mode,
      actor: { ...identity(actor), role: actor.role },
      capabilities: Object.keys(minimum).filter(
        (action) => roles.indexOf(actor.role) >= roles.indexOf(minimum[action]),
      ),
      revision: hash(state.members),
      members:
        actor.role === "admin"
          ? actor.members.map((m) => ({
              id: m.id,
              name: m.name,
              email: m.email,
              inherited: ["owner", "admin"].includes(m.role),
              role: ["owner", "admin"].includes(m.role)
                ? "admin"
                : (state.members[m.id] ?? "none"),
            }))
          : [],
    };
  }
  async function member(actor, data) {
    requireCapability(actor, "members");
    if (mode !== "session")
      throw new EditorError(
        "Teamrechte erfordern die Workspace-Anmeldung.",
        409,
      );
    return serial(async () => {
      const state = await read();
      if (data.revision !== hash(state.members))
        throw new EditorError(
          "Die Teamrechte wurden geändert. Bitte neu laden.",
          409,
        );
      const user = actor.members.find((m) => m.id === data.id);
      if (
        !user ||
        ["owner", "admin"].includes(user.role) ||
        user.id === actor.id ||
        ![...roles, "none"].includes(data.role)
      )
        throw new EditorError(
          "Diese Mitgliedschaft kann nicht geändert werden.",
        );
      if (data.role === "none") delete state.members[user.id];
      else state.members[user.id] = data.role;
      event(state, actor, `member.${data.role}`, user.id);
      await atomic(file, state);
      return access(actor);
    });
  }
  async function list(actor) {
    requireCapability(actor, "read");
    const state = await read();
    return {
      requests: state.requests.map(({ document, before, ...request }) => ({
        ...request,
        title: document.title,
        kind: document.kind,
        pageId: document.id,
      })),
      audit: actor.role === "admin" ? state.audit.slice(-100).reverse() : [],
    };
  }
  async function submit(actor, data) {
    requireCapability(actor, "edit");
    return serial(async () => {
      const service = serviceFor(actor);
      const before = await service.document(data.kind, data.id);
      // Private new editor drafts cannot be loaded in a different author's service.
      if (before.isNew)
        throw new EditorError(
          "Lege die Seite zuerst in der Inhaltsstruktur an. Danach kannst du sie zur Prüfung einreichen.",
        );
      await service.saveDraft(data);
      const state = await read();
      if (
        state.requests.some(
          (r) =>
            r.status === "pending" &&
            r.author.id === actor.id &&
            r.document.kind === data.kind &&
            r.document.id === data.id,
        )
      )
        throw new EditorError(
          "Für diese Seite wartet bereits ein Vorschlag von dir auf Prüfung.",
          409,
        );
      const request = {
        id: randomUUID(),
        author: identity(actor),
        at: new Date().toISOString(),
        status: "pending",
        version: 1,
        document: structuredClone(data),
        before,
        comments: [],
      };
      state.requests.push(request);
      event(state, actor, "review.submitted", request.id);
      await atomic(file, state);
      return { id: request.id };
    });
  }
  async function detail(actor, id) {
    requireCapability(actor, "read");
    const state = await read(),
      request = state.requests.find((r) => r.id === id);
    if (!request)
      throw new EditorError("Änderungsvorschlag nicht gefunden.", 404);
    const current = await serviceFor(actor).document(
      request.document.kind,
      request.document.id,
    );
    return {
      ...request,
      stale: current.revision !== request.document.revision,
      localSelfReview: mode === "local",
    };
  }
  async function decide(actor, data) {
    requireCapability(actor, data.action === "comment" ? "comment" : "review");
    return serial(async () => {
      const state = await read(),
        request = state.requests.find((r) => r.id === data.id);
      if (!request)
        throw new EditorError("Änderungsvorschlag nicht gefunden.", 404);
      if (request.status !== "pending" || request.version !== data.version)
        throw new EditorError(
          "Der Vorschlag wurde inzwischen geändert. Bitte neu laden.",
          409,
        );
      if (!["comment", "approve", "reject"].includes(data.action))
        throw new EditorError("Ungültige Entscheidung.");
      const comment =
        typeof data.comment === "string" ? data.comment.trim() : "";
      if (comment.length > 5000 || (data.action !== "approve" && !comment))
        throw new EditorError(
          "Bitte eine Begründung mit höchstens 5.000 Zeichen eingeben.",
        );
      if (data.action === "approve") {
        if (mode !== "local" && request.author.id === actor.id)
          throw new EditorError(
            "Eigene Vorschläge müssen von einer anderen Person freigegeben werden.",
            403,
          );
        // Persist the intent before mutating sources. A crash leaves an explicit recovery state,
        // never a request that can silently be approved a second time.
        request.status = "applying";
        request.version++;
        request.decision = {
          actor: identity(actor),
          at: new Date().toISOString(),
          comment,
        };
        event(state, actor, "review.applying", request.id);
        await atomic(file, state);
        try {
          await serviceFor(actor).apply(request.document);
        } catch (error) {
          request.status = "pending";
          request.version++;
          event(state, actor, "review.failed", request.id);
          await atomic(file, state);
          throw error;
        }
        request.status = "approved";
      } else if (data.action === "reject") {
        request.status = "rejected";
        request.decision = {
          actor: identity(actor),
          at: new Date().toISOString(),
          comment,
        };
      } else
        request.comments.push({
          actor: identity(actor),
          at: new Date().toISOString(),
          text: comment,
        });
      request.version++;
      event(state, actor, `review.${data.action}`, request.id);
      await atomic(file, state);
      return detail(actor, request.id);
    });
  }
  return { authenticate, access, member, list, submit, detail, decide, mode };
}
