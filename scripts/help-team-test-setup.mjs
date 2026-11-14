// Create only the two accounts in the isolated local acceptance database.
import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("..", import.meta.url));
const file = path.join(root, ".helpcenter-editor/team-test/credentials.json");
const c = JSON.parse(await readFile(file, "utf8"));
const postgres = createRequire(
  new URL("../apps/server/package.json", import.meta.url),
)("postgres");
const db = postgres({
  host: "127.0.0.1",
  port: 55439,
  user: "laightup_docs_test",
  password: c.databasePassword,
  database: "laightup_docs_team_test",
  max: 1,
});
async function api(route, data, cookie) {
  const response = await fetch(`http://127.0.0.1:3000/api/${route}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(data),
    signal: AbortSignal.timeout(15000),
  });
  const value = await response.json();
  if (!response.ok)
    throw new Error(
      `${route}: HTTP ${response.status} ${JSON.stringify(value.message ?? value.error ?? "Request failed")}`,
    );
  return {
    data: value.data ?? value,
    cookie:
      response.headers
        .getSetCookie()
        .find((v) => v.startsWith("authToken="))
        ?.split(";")[0] ?? cookie,
  };
}
try {
  const existing = await db`select id from workspaces limit 1`;
  const admin = existing.length
    ? await api("auth/login", {
        email: c.admin.email,
        password: c.admin.password,
      })
    : await api("auth/setup", {
        ...c.admin,
        workspaceName: "laightup Dokumentation · Teamtest",
      });
  const me = (await api("users/me", {}, admin.cookie)).data;
  c.workspaceId = me.workspace.id;
  c.admin.id = me.user.id;
  let [editor] =
    await db`select id from users where email=${c.editor.email} and workspace_id=${c.workspaceId}`;
  if (!editor) {
    await api(
      "workspace/invites/create",
      { emails: [c.editor.email], role: "member" },
      admin.cookie,
    );
    const [invite] =
      await db`select id,token from workspace_invitations where email=${c.editor.email} and workspace_id=${c.workspaceId}`;
    if (!invite) throw new Error("Local invitation not found.");
    await api("workspace/invites/accept", {
      invitationId: invite.id,
      token: invite.token,
      name: c.editor.name,
      password: c.editor.password,
    });
    [editor] =
      await db`select id from users where email=${c.editor.email} and workspace_id=${c.workspaceId}`;
  }
  c.editor.id = editor.id;
  await writeFile(file, JSON.stringify(c, null, 2) + "\n", { mode: 0o600 });
  console.log(
    "Test-Workspace und zwei lokale Konten eingerichtet. Keine E-Mail versendet (Log-Treiber).",
  );
  console.log(`Workspace: ${c.workspaceId}`);
} finally {
  await db.end();
}
