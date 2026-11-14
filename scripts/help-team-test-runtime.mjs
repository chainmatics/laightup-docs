// Isolated local backend for the documentation team acceptance test.
// Credentials and process state stay in the ignored .helpcenter-editor directory.
import { readFile, writeFile, mkdir, open } from "node:fs/promises";
import { spawn, execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const root = fileURLToPath(new URL("..", import.meta.url));
const state = path.join(root, ".helpcenter-editor/team-test");
const secrets = JSON.parse(
  await readFile(path.join(state, "credentials.json"), "utf8"),
);
const env = {
  ...process.env,
  HOST: "127.0.0.1",
  PORT: "3000",
  APP_URL: "http://127.0.0.1:3000",
  APP_SECRET: secrets.appSecret,
  DATABASE_URL: `postgresql://laightup_docs_test:${secrets.databasePassword}@127.0.0.1:55439/laightup_docs_team_test`,
  REDIS_URL: "redis://127.0.0.1:16379",
  CLOUD: "false",
  DISABLE_TELEMETRY: "true",
  MAIL_DRIVER: "log",
  NODE_ENV: "development",
  STORAGE_DRIVER: "local",
};
const exec = promisify(execFile);
if (process.argv[2] === "create-database") {
  await exec(
    "/opt/homebrew/opt/postgresql@17/bin/createdb",
    [
      "-h",
      "127.0.0.1",
      "-p",
      "55439",
      "-U",
      "laightup_docs_test",
      "laightup_docs_team_test",
    ],
    { env: { ...process.env, PGPASSWORD: secrets.databasePassword } },
  );
  console.log("Isolated database created.");
} else if (process.argv[2] === "migrate") {
  const require = createRequire(
    new URL("../apps/server/package.json", import.meta.url),
  );
  const { Kysely, Migrator, FileMigrationProvider } = require("kysely");
  const { PostgresJSDialect } = require("kysely-postgres-js");
  const postgres = require("postgres");
  const fs = await import("node:fs/promises");
  const db = new Kysely({
    dialect: new PostgresJSDialect({
      postgres: postgres(env.DATABASE_URL, { max: 1 }),
    }),
  });
  try {
    const migrator = new Migrator({
      db,
      provider: new FileMigrationProvider({
        fs,
        path,
        migrationFolder: path.join(
          root,
          "apps/server/dist/database/migrations",
        ),
      }),
    });
    const { error, results } = await migrator.migrateToLatest();
    if (error) throw error;
    console.log(
      `${results?.length ?? 0} migrations applied to isolated test database.`,
    );
  } finally {
    await db.destroy();
  }
} else if (process.argv[2] === "start") {
  try {
    const pid = Number(await readFile(path.join(state, "backend.pid"), "utf8"));
    if (Number.isInteger(pid) && pid > 1) {
      process.kill(pid, 0);
      console.log(
        "Ein Prozess mit der gespeicherten Backend-PID läuft bereits. Kein zweiter Start.",
      );
      process.exit(0);
    }
  } catch (error) {
    if (!["ENOENT", "ESRCH"].includes(error.code)) throw error;
  }
  const cwd = path.join(state, "app/runtime");
  await mkdir(cwd, { recursive: true });
  const log = await open(path.join(state, "backend.log"), "a", 0o600);
  const child = spawn(
    process.execPath,
    [path.join(root, "apps/server/dist/main.js")],
    { cwd, env, detached: true, stdio: ["ignore", log.fd, log.fd] },
  );
  await writeFile(path.join(state, "backend.pid"), String(child.pid));
  child.unref();
  await log.close();
  console.log(
    "Local backend started; log: .helpcenter-editor/team-test/backend.log",
  );
} else
  throw new Error(
    "Use create-database, migrate or start. PostgreSQL :55439 and Redis :16379 must already be running.",
  );
