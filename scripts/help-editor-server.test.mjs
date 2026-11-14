import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, cp, mkdir, readFile, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { createHelpEditor, helpEditorPlugin } from "./help-editor-server.mjs";
import { compilePublished, sourceModel } from "./helpcenter-locales.mjs";
const root = fileURLToPath(new URL("..", import.meta.url));
async function fixture(t) {
  const dir = await mkdtemp(path.join(os.tmpdir(), "help-editor-test-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, "docs"), { recursive: true });
  await cp(
    path.join(root, "docs/helpcenter"),
    path.join(dir, "docs/helpcenter"),
    {
      recursive: true,
      filter: (src) =>
        !["qa", "video-source"].some((part) =>
          src.split(path.sep).includes(part),
        ),
    },
  );
  const editor = createHelpEditor(dir, {
    build: () => compilePublished(path.join(dir, "docs/helpcenter")),
  });
  return {
    dir,
    editor,
    article: path.join(
      dir,
      "docs/helpcenter/locales/de/articles/schnellstart.md",
    ),
    metadata: path.join(dir, "docs/helpcenter/locales/de/metadata.json"),
  };
}
test("drafts survive independently; apply updates authoring and generated content with a previous version", async (t) => {
  const f = await fixture(t);
  const original = await f.editor.document("article", "schnellstart");
  const bytes = await readFile(f.article, "utf8");
  const draft = { ...original, title: original.title + " – geprüft" };
  await f.editor.saveDraft(draft);
  assert.equal(await readFile(f.article, "utf8"), bytes);
  assert.equal(
    (await f.editor.readDraft("article", original.id)).title,
    draft.title,
  );
  const result = await f.editor.apply(draft);
  assert.equal(result.title, draft.title);
  assert.notEqual(result.revision, original.revision);
  assert.equal(await f.editor.readDraft("article", original.id), null);
  assert.match(await readFile(f.article, "utf8"), /^# .+ – geprüft/);
  const generated = JSON.parse(
    await readFile(path.join(f.dir, "docs/helpcenter/catalog.json"), "utf8"),
  );
  assert.equal(
    generated.articles.find((a) => a.id === original.id).title,
    draft.title,
  );
  const history = await f.editor.history("article", original.id);
  assert.equal(history[0].before.title, original.title);
});
test("a broken semantic reference rolls back source and generated files and retains the draft", async (t) => {
  const f = await fixture(t);
  const original = await f.editor.document("article", "schnellstart");
  const bytes = await readFile(f.article, "utf8"),
    metadata = await readFile(f.metadata, "utf8");
  const broken = {
    ...original,
    title: "Darf nicht übernommen werden",
    body: original.body + "\n[Defekt](doc:does-not-exist)\n",
  };
  await f.editor.saveDraft(broken);
  await assert.rejects(f.editor.apply(broken), (e) => e.status === 422);
  assert.equal(await readFile(f.article, "utf8"), bytes);
  assert.equal(await readFile(f.metadata, "utf8"), metadata);
  assert.equal(
    (await f.editor.readDraft("article", original.id)).title,
    broken.title,
  );
});
test("stale revisions cannot overwrite external edits or win a competing apply", async (t) => {
  const f = await fixture(t);
  const original = await f.editor.document("article", "schnellstart");
  await writeFile(
    f.article,
    (await readFile(f.article, "utf8")) + "\nEine externe Änderung.\n",
  );
  await assert.rejects(
    f.editor.apply({ ...original, title: "Veralteter Inhalt" }),
    (e) => e.status === 409,
  );
  assert.match(await readFile(f.article, "utf8"), /Eine externe Änderung/);
  const current = await f.editor.document("article", original.id);
  const results = await Promise.allSettled([
    f.editor.apply({ ...current, title: "Erster Entwurf" }),
    f.editor.apply({ ...current, title: "Zweiter Entwurf" }),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal(results.find((r) => r.status === "rejected").reason.status, 409);
});
test("new pages remain drafts until applied and can be discarded", async (t) => {
  const f = await fixture(t);
  const draft = await f.editor.create({
    title: "Ein neuer Einstieg",
    group: "start",
  });
  assert.equal(draft.isNew, true);
  assert.equal(
    (await f.editor.bootstrap()).documents.find((d) => d.id === draft.id)
      .hasDraft,
    true,
  );
  await f.editor.apply({
    ...draft,
    description: "Eine neue Anleitung.",
    body: draft.body + "So geht es.\n",
  });
  assert.equal((await f.editor.document("article", draft.id)).isNew, false);
  const second = await f.editor.create({
    title: "Nur ein Testentwurf",
    group: "start",
  });
  await f.editor.discard("article", second.id);
  assert.equal(
    (await f.editor.bootstrap()).documents.some((d) => d.id === second.id),
    false,
  );
});
test("release editing preserves evidence and blocks ticket details and unknown change IDs", async (t) => {
  const f = await fixture(t);
  const original = await f.editor.document("update", "2026-10-29-produkt");
  await assert.rejects(
    f.editor.apply({
      ...original,
      description: "LAI-538: interne Implementierung",
    }),
  );
  await assert.rejects(
    f.editor.apply({ ...original, changes: original.changes.slice(1) }),
  );
  const result = await f.editor.apply({
    ...original,
    title: "Easy Flow: Vorschau und Formate",
  });
  assert.equal(result.title, "Easy Flow: Vorschau und Formate");
  assert.deepEqual(result.changes, original.changes);
  const structure = JSON.parse(
    await readFile(path.join(f.dir, "docs/helpcenter/structure.json"), "utf8"),
  );
  assert.equal(
    structure.updates.find((u) => u.id === original.id).sourceUpdateId,
    "60ccedab-8b03-4395-8d87-f4514727ec87",
  );
  await assert.rejects(f.editor.document("article", "../metadata"));
  await assert.rejects(f.editor.document("unknown", "schnellstart"));
});
test("the Vite authoring API rejects remote, cross-origin and tokenless writes", async () => {
  let middleware;
  helpEditorPlugin(root).configureServer({
    middlewares: {
      use(fn) {
        middleware = fn;
      },
    },
  });
  const check = async (headers, remote = "127.0.0.1") => {
    let output;
    const res = {
      setHeader() {},
      end(body) {
        output = JSON.parse(body);
      },
    };
    await middleware(
      {
        url: "/__help-editor/apply",
        method: "POST",
        headers,
        socket: { remoteAddress: remote },
      },
      res,
      () => {},
    );
    return { status: res.statusCode, ...output };
  };
  assert.equal((await check({ host: "example.com" })).status, 403);
  assert.equal(
    (await check({ host: "127.0.0.1:4173" }, "192.168.1.5")).status,
    403,
  );
  assert.equal(
    (await check({ host: "127.0.0.1:4173", origin: "https://evil.example" }))
      .status,
    403,
  );
  assert.equal(
    (await check({ host: "127.0.0.1:4173", "sec-fetch-site": "cross-site" }))
      .status,
    403,
  );
  assert.equal(
    (
      await check({
        host: "127.0.0.1:4173",
        "content-type": "application/json",
      })
    ).status,
    403,
  );
});

test("empty descriptions do not consume the first section and uploaded images retain exact bytes", async (t) => {
  const f = await fixture(t);
  const page = await f.editor.create({
    title: "Leere Beschreibung",
    group: "start",
  });
  const result = await f.editor.apply({
    ...page,
    body: page.body + "Ein Beispiel.\n",
  });
  assert.match(result.body, /<!-- section: erste-schritte -->/);
  assert.match(result.body, /## Erste Schritte/);
  const data = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jM9sAAAAASUVORK5CYII=",
    "base64",
  );
  const image = await f.editor.asset({
    name: "../../screenshot.svg",
    data: data.toString("base64"),
  });
  assert.match(image.url, /^\/helpcenter\/images\/uploads\/[a-f0-9]{20}\.png$/);
  assert.deepEqual(
    await readFile(path.join(f.dir, "apps/client/public", image.url)),
    data,
  );
  await assert.rejects(
    f.editor.asset({
      name: "bad.svg",
      data: Buffer.from('<svg onload="alert(1)"></svg>').toString("base64"),
    }),
  );
});

test("management saves branding, renames/reorders real topics and rejects stale revisions", async (t) => {
  const f = await fixture(t);
  const site = await f.editor.site();
  const groups = [...site.groups].reverse();
  groups[0] = { ...groups[0], title: "Persönliche Einstellungen" };
  const result = await f.editor.saveSite({
    ...site,
    groups,
    config: {
      ...site.config,
      title: "laightup Dokumentation",
      showPrint: false,
    },
  });
  assert.equal(result.config.title, "laightup Dokumentation");
  assert.equal(result.config.showPrint, false);
  assert.equal(result.groups[0].title, "Persönliche Einstellungen");
  const catalog = JSON.parse(
    await readFile(path.join(f.dir, "docs/helpcenter/catalog.json"), "utf8"),
  );
  assert.equal(catalog.groups[0].id, groups[0].id);
  assert.equal(catalog.groups[0].title, groups[0].title);
  assert.equal(
    (await f.editor.document("article", "schnellstart")).slug,
    "schnellstart",
  );
  await assert.rejects(f.editor.saveSite(site), (e) => e.status === 409);
});
test("management rejects inaccessible colors, unexpected fields and incomplete or duplicate structures", async (t) => {
  const f = await fixture(t);
  const site = await f.editor.site();
  for (const config of [
    { ...site.config, accentColor: "#eeeeee" },
    { ...site.config, headerColor: "url(javascript:bad)" },
    { ...site.config, showFeedback: "false" },
    { ...site.config, title: "<script>" },
    { ...site.config, visibility: "private" },
  ])
    await assert.rejects(f.editor.saveSite({ ...site, config }));
  await assert.rejects(
    f.editor.saveSite({ ...site, groups: site.groups.slice(1) }),
  );
  await assert.rejects(
    f.editor.saveSite({
      ...site,
      groups: site.groups.map(() => site.groups[0]),
    }),
  );
  assert.deepEqual(await f.editor.site(), site);
});
test("management restores settings and structure when generation fails", async (t) => {
  const f = await fixture(t);
  const before = await f.editor.site();
  const failing = createHelpEditor(f.dir, {
    build: async () => {
      throw new Error("Generation failed");
    },
  });
  await assert.rejects(
    failing.saveSite({
      ...before,
      groups: [...before.groups].reverse(),
      config: { ...before.config, title: "Änderung" },
    }),
    (e) => e.status === 422,
  );
  assert.deepEqual(await failing.site(), before);
});

test("management creates nested drafts without publishing; editor publishes parents before children", async (t) => {
  const f = await fixture(t);
  const original = await f.editor.site();
  const groups = [
    ...original.groups,
    {
      id: "neu",
      title: "Neuer Themenbereich",
      description: "Eine echte neue Gruppe.",
    },
  ];
  const pages = [
    ...original.pages,
    {
      id: "neu-eltern",
      title: "Neue Elternseite",
      group: "neu",
      parentId: null,
      status: "draft",
    },
    {
      id: "neu-kind",
      title: "Neue Unterseite",
      group: "neu",
      parentId: "neu-eltern",
      status: "draft",
    },
  ];
  const saved = await f.editor.saveSite({ ...original, groups, pages });
  assert.equal(
    saved.pages.find((p) => p.id === "neu-kind").parentId,
    "neu-eltern",
  );
  assert.ok(
    !(
      "articleBody.neu-kind" in
      (await sourceModel(path.join(f.dir, "docs/helpcenter"))).units
    ),
  );
  let catalog = JSON.parse(
    await readFile(path.join(f.dir, "docs/helpcenter/catalog.json"), "utf8"),
  );
  assert.ok(!catalog.groups.some((g) => g.id === "neu"));
  assert.ok(
    !catalog.articles.some((p) => p.id === "neu-eltern" || p.id === "neu-kind"),
  );
  const child = await f.editor.document("article", "neu-kind");
  assert.equal(child.isDraft, true);
  assert.equal(child.parentId, "neu-eltern");
  await assert.rejects(
    f.editor.apply({ ...child, body: child.body + "Ein hilfreicher Inhalt." }),
    /Entwurfsseite/,
  );
  const parent = await f.editor.document("article", "neu-eltern");
  await assert.rejects(f.editor.apply(parent), /Inhalt/);
  await f.editor.apply({
    ...parent,
    description: "Eine neue Anleitung.",
    body: parent.body + "Der Einstieg.\n",
  });
  await f.editor.apply({
    ...child,
    description: "Ein genauer Schritt.",
    body: child.body + "Der nächste Schritt.\n",
  });
  catalog = JSON.parse(
    await readFile(path.join(f.dir, "docs/helpcenter/catalog.json"), "utf8"),
  );
  assert.equal(
    catalog.articles.find((p) => p.id === "neu-kind").parentId,
    "neu-eltern",
  );
  assert.ok(
    "articleBody.neu-kind" in
      (await sourceModel(path.join(f.dir, "docs/helpcenter"))).units,
  );
  assert.ok(catalog.groups.some((g) => g.id === "neu"));
  const edited = await f.editor.site();
  const moved = edited.pages.map((p) =>
    p.id === "neu-eltern" || p.id === "neu-kind" ? { ...p, group: "start" } : p,
  );
  await f.editor.saveSite({ ...edited, pages: moved });
  assert.equal(
    (await f.editor.document("article", "neu-kind")).slug,
    "neu-kind",
  );
  assert.equal((await f.editor.document("article", "neu-kind")).group, "start");
});
test("management rejects deleted pages, cycles, invalid parents, promotion and local draft collisions", async (t) => {
  const f = await fixture(t),
    site = await f.editor.site();
  await assert.rejects(
    f.editor.saveSite({ ...site, pages: site.pages.slice(1) }),
  );
  const first = site.pages[0],
    second = site.pages.find(
      (p) => p.group === first.group && p.id !== first.id,
    );
  await assert.rejects(
    f.editor.saveSite({
      ...site,
      pages: site.pages.map((p) =>
        p.id === first.id
          ? { ...p, parentId: second.id }
          : p.id === second.id
            ? { ...p, parentId: first.id }
            : p,
      ),
    }),
  );
  await assert.rejects(
    f.editor.saveSite({
      ...site,
      pages: [
        ...site.pages,
        {
          id: "direct-live",
          title: "Nicht freigegeben",
          group: "start",
          parentId: null,
          status: "published",
        },
      ],
    }),
  );
  const draft = await f.editor.create({
    title: "Nicht überschreiben",
    group: "start",
  });
  await assert.rejects(
    f.editor.saveSite({
      ...site,
      pages: [
        ...site.pages,
        {
          id: draft.id,
          title: draft.title,
          group: "start",
          parentId: null,
          status: "draft",
        },
      ],
    }),
    (e) => e.status === 409,
  );
  assert.equal(
    (await f.editor.readDraft("article", draft.id)).title,
    draft.title,
  );
  assert.deepEqual(await f.editor.site(), site);
});
test("failed structure creation removes new source files and restores all existing sources", async (t) => {
  const f = await fixture(t),
    site = await f.editor.site();
  const failing = createHelpEditor(f.dir, {
    build: async () => {
      throw new Error("Generator failure");
    },
  });
  await assert.rejects(
    failing.saveSite({
      ...site,
      groups: [...site.groups, { id: "rollback-topic", title: "Zurücksetzen" }],
      pages: [
        ...site.pages,
        {
          id: "rollback-page",
          title: "Nicht speichern",
          group: "rollback-topic",
          parentId: null,
          status: "draft",
        },
      ],
    }),
  );
  await assert.rejects(
    readFile(
      path.join(f.dir, "docs/helpcenter/locales/de/articles/rollback-page.md"),
    ),
    (e) => e.code === "ENOENT",
  );
  assert.deepEqual(await f.editor.site(), site);
});

test("URL management renames stable pages, preserves semantic links and rejects stale content", async (t) => {
  const f = await fixture(t);
  const linkedFile = path.join(f.dir, "docs/helpcenter/locales/de/articles/bibliothek.md");
  await writeFile(linkedFile, (await readFile(linkedFile, "utf8")) + "\n[Zum Einstieg](doc:schnellstart)\n");
  const original = await f.editor.site();
  const article = await f.editor.document("article", "schnellstart");
  const result = await f.editor.saveSite({...original, pages: original.pages.map(p => p.id === "schnellstart" ? {...p, slug: "erster-inhalt"} : p)});
  assert.equal(result.pages.find(p => p.id === "schnellstart").slug, "erster-inhalt");
  assert.deepEqual(result.redirects, [{from: "schnellstart", targetId: "schnellstart"}]);
  assert.equal((await f.editor.document("article", "schnellstart")).slug, "erster-inhalt");
  await assert.rejects(f.editor.apply(article), e => e.status === 409);
  const generated = JSON.parse(await readFile(path.join(f.dir, "docs/helpcenter/redirects.public.json"), "utf8"));
  assert.equal(generated["/help/schnellstart"], "/help/erster-inhalt");
  assert.match(await readFile(path.join(f.dir, "docs/helpcenter/content/bibliothek.md"), "utf8"), /\/help\/erster-inhalt/);
  const second = await f.editor.saveSite({...result, pages: result.pages.map(p => p.id === "schnellstart" ? {...p, slug: "einstieg"} : p)});
  assert.deepEqual(second.redirects, [{from:"schnellstart",targetId:"schnellstart"},{from:"erster-inhalt",targetId:"schnellstart"}]);
  const withManual = await f.editor.saveSite({...second, redirects: [...second.redirects, {from:"alte-hilfe",targetId:"installation"}]});
  assert.equal(withManual.redirects.length, 3);
  const removed = await f.editor.saveSite({...withManual, redirects: withManual.redirects.filter(r => r.from !== "alte-hilfe")});
  assert.equal(removed.redirects.length, 2);
});
test("URL management rejects collisions, reserved addresses and draft targets before mutating sources", async (t) => {
  const f = await fixture(t);
  const site = await f.editor.site();
  const before = await readFile(f.metadata, "utf8");
  for (const slug of ["guides", "installation", "en", "../outside", "a--b"]) {
    // Only registered language prefixes are reserved.
    if (slug === "en") continue;
    await assert.rejects(f.editor.saveSite({...site, pages: site.pages.map(p => p.id === "schnellstart" ? {...p,slug} : p)}));
  }
  await assert.rejects(f.editor.saveSite({...site,redirects:[{from:"old",targetId:"missing"}]}));
  assert.equal(await readFile(f.metadata,"utf8"), before);
  assert.deepEqual(await f.editor.site(), site);
});
test("URL changes and redirects roll back together after generator failure", async (t) => {
  const f = await fixture(t);
  const site = await f.editor.site();
  const failing = createHelpEditor(f.dir, {build: async () => {throw new Error("broken generator");}});
  await assert.rejects(failing.saveSite({...site,pages:site.pages.map(p => p.id === "schnellstart" ? {...p,slug:"neue-adresse"} : p)}), e => e.status === 422);
  assert.deepEqual(await f.editor.site(), site);
});
