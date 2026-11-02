import { updateUrls } from "../docs/helpcenter/lib/urls.mjs";
import { createHelpTeam, requireCapability } from "./help-editor-team.mjs";
import {
  readFile,
  writeFile,
  mkdir,
  rename,
  readdir,
  unlink,
} from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import path from "node:path";
import {
  validateStructure,
  orderedPages,
  movePage,
  pageStatus,
} from "../docs/helpcenter/lib/structure.mjs";
const run = promisify(execFile);
const queues = new Map();
const json = async (file) => JSON.parse(await readFile(file, "utf8"));
const hash = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
const idPattern = /^[a-z0-9][a-z0-9-]{0,100}$/;
const slug = (value) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "neue-seite";
export class EditorError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
const atomic = async (file, data) => {
  await mkdir(path.dirname(file), { recursive: true });
  const temp = `${file}.${randomUUID()}.tmp`;
  await writeFile(
    temp,
    typeof data === "string" || Buffer.isBuffer(data)
      ? data
      : JSON.stringify(data, null, 2) + "\n",
  );
  await rename(temp, file);
};
export function createHelpEditor(
  root,
  {
    stateDirectory,
    build = () =>
      run(process.execPath, [path.join(root, "scripts/build-helpcenter.mjs")], {
        cwd: root,
        timeout: 30000,
        maxBuffer: 1024 * 1024,
      }),
  } = {},
) {
  const content = path.join(root, "docs/helpcenter"),
    state = stateDirectory ?? path.join(root, ".helpcenter-editor");
  const metadataFile = path.join(content, "locales/de/metadata.json"),
    structureFile = path.join(content, "structure.json");
  const serial = (work) => {
    const next = (queues.get(root) ?? Promise.resolve()).then(work);
    queues.set(
      root,
      next.catch(() => {}),
    );
    return next;
  };
  const key = (kind, id) => {
    if (!["article", "update"].includes(kind) || !idPattern.test(id))
      throw new EditorError("Ungültige Seite.");
    return `${kind}-${id}`;
  };
  const draftFile = (kind, id) =>
    path.join(state, "drafts", key(kind, id) + ".json");
  async function readDraft(kind, id) {
    try {
      return await json(draftFile(kind, id));
    } catch (e) {
      if (e.code === "ENOENT") return null;
      throw e;
    }
  }
  async function document(kind, id) {
    key(kind, id);
    const [metadata, structure] = await Promise.all([
      json(metadataFile),
      json(structureFile),
    ]);
    const collection = kind === "article" ? "articles" : "updates";
    const item = structure[collection].find((item) => item.id === id);
    if (!item) {
      const draft = await readDraft(kind, id);
      if (draft?.isNew) return draft;
      throw new EditorError("Seite nicht gefunden.", 404);
    }
    const meta = metadata[collection][id];
    let body = "";
    if (kind === "article") {
      const raw = await readFile(
        path.join(content, "locales/de/articles", id + ".md"),
        "utf8",
      );
      const prefix = `# ${meta.title}\n\n${meta.description}\n\n`;
      const withoutTitle = raw.replace(/^# [^\n]*\n(?:[ \t]*\n)*/, "");
      body = raw.startsWith(prefix)
        ? raw.slice(prefix.length)
        : meta.description && withoutTitle.startsWith(meta.description)
          ? withoutTitle.slice(meta.description.length).replace(/^\n+/, "")
          : withoutTitle;
    }
    const value = {
      kind,
      id,
      group: item.group ?? "",
      title: meta.title,
      description: meta.description,
      body,
      audience: meta.audience ?? "",
      outcome: meta.outcome ?? "",
      tags: meta.tags ?? [],
      slug: meta.slug ?? "was-ist-neu",
      changes:
        kind === "update"
          ? item.changes.map((change) => ({
              id: change.id,
              ...meta.changes[change.id],
            }))
          : [],
      highlights: meta.highlights ?? [],
      isNew: false,
      ...(item.parentId ? { parentId: item.parentId } : {}),
      ...(item.status === "draft" ? { isDraft: true } : {}),
    };
    return { ...value, revision: hash(value) };
  }
  function validate(data) {
    key(data.kind, data.id);
    for (const field of [
      "title",
      "description",
      "body",
      "group",
      "audience",
      "outcome",
    ])
      if (typeof data[field] !== "string")
        throw new EditorError("Ungültiges Textfeld: " + field);
    if (
      !data.title.trim() ||
      /[\r\n]/.test(data.title) ||
      data.title.length > 180 ||
      data.description.length > 5000 ||
      data.body.length > 500000
    )
      throw new EditorError("Titel fehlt oder der Inhalt ist zu lang.");
    if (
      !Array.isArray(data.tags) ||
      data.tags.some((tag) => typeof tag !== "string" || tag.length > 80) ||
      data.tags.length > 30
    )
      throw new EditorError("Ungültige Suchbegriffe.");
    if (typeof data.revision !== "string")
      throw new EditorError(
        "Der Ausgangsstand fehlt. Bitte die Seite neu laden.",
      );
    if (data.kind === "update") {
      if (
        !Array.isArray(data.changes) ||
        data.changes.some(
          (change) =>
            !change ||
            typeof change.id !== "string" ||
            typeof change.title !== "string" ||
            typeof change.description !== "string" ||
            !change.title.trim() ||
            change.title.length > 180 ||
            change.description.length > 10000,
        )
      )
        throw new EditorError("Ungültiger Produktabschnitt.");
      const publicText = [
        data.title,
        data.description,
        ...data.changes.flatMap((c) => [c.title, c.description]),
      ].join("\n");
      if (
        /\bLAI-\d+\b|Technische Details|linear\.app|github\.com|\d+ Commits/i.test(
          publicText,
        )
      )
        throw new EditorError(
          "Produktmeldungen dürfen keine Ticketdetails oder internen Quellen enthalten.",
        );
    }
  }
  async function saveDraft(data) {
    validate(data);
    return serial(async () => {
      const current = await document(data.kind, data.id);
      if (current.revision !== data.revision)
        throw new EditorError(
          "Die Quelle wurde inzwischen geändert. Bitte vergleiche deinen Entwurf mit dem aktuellen Stand.",
          409,
        );
      const saved = {
        ...data,
        isNew: current.isNew,
        savedAt: new Date().toISOString(),
      };
      await atomic(draftFile(data.kind, data.id), saved);
      return saved;
    });
  }
  async function apply(data) {
    validate(data);
    return serial(async () => {
      const current = await document(data.kind, data.id);
      if (current.revision !== data.revision)
        throw new EditorError(
          "Die Quelle wurde inzwischen geändert. Dein Entwurf bleibt erhalten. Bitte den aktuellen Stand neu laden.",
          409,
        );
      const [metadata, structure, oldMetadata, oldStructure] =
        await Promise.all([
          json(metadataFile),
          json(structureFile),
          readFile(metadataFile, "utf8"),
          readFile(structureFile, "utf8"),
        ]);
      const articleFile = path.join(
        content,
        "locales/de/articles",
        data.id + ".md",
      );
      const oldArticle =
        data.kind === "article" && !current.isNew
          ? await readFile(articleFile, "utf8")
          : null;
      if (data.kind === "article") {
        if (!structure.groups.some((group) => group.id === data.group))
          throw new EditorError(
            "Bitte einen vorhandenen Themenbereich wählen.",
          );
        if (current.isNew) {
          if (structure.articles.some((a) => a.id === data.id))
            throw new EditorError("Diese Adresse ist bereits vergeben.", 409);
          structure.articles.push({
            id: data.id,
            group: data.group,
            type: "guide",
            visual: null,
            steps: [],
          });
          metadata.articles[data.id] = { slug: data.id };
        }
        if (
          current.isDraft &&
          !data.body
            .replace(/<!--[^]*?-->/g, "")
            .replace(/^#+ .*$/gm, "")
            .trim()
        )
          throw new EditorError(
            "Füge einen Inhalt hinzu, bevor du die Seite übernimmst.",
          );
        const node = structure.articles.find((a) => a.id === data.id);
        if (node.group !== data.group)
          structure.articles = movePage(
            structure.groups,
            structure.articles,
            data.id,
            { group: data.group, parentId: null },
          );
        delete structure.articles.find((a) => a.id === data.id).status;
        try {
          validateStructure(structure.groups, structure.articles);
        } catch (error) {
          throw new EditorError(error.message);
        }
        Object.assign(metadata.articles[data.id], {
          title: data.title.trim(),
          description: data.description,
          audience: data.audience,
          outcome: data.outcome,
          tags: data.tags,
        });
      } else {
        const original = metadata.updates[data.id];
        const ids = Object.keys(original.changes);
        if (
          data.changes.length !== ids.length ||
          new Set(data.changes.map((c) => c.id)).size !== ids.length ||
          data.changes.some((c) => !ids.includes(c.id))
        )
          throw new EditorError(
            "Die belegten Produktabschnitte und ihre IDs müssen erhalten bleiben.",
          );
        original.title = data.title.trim();
        original.description = data.description;
        for (const change of data.changes)
          Object.assign(original.changes[change.id], {
            title: change.title,
            description: change.description,
          });
      }
      const revision = {
        id: randomUUID(),
        at: new Date().toISOString(),
        before: current,
      };
      // Preserve the previous state even if the build or subsequent write is interrupted.
      await atomic(
        path.join(
          state,
          "history",
          key(data.kind, data.id),
          revision.id + ".json",
        ),
        revision,
      );
      try {
        await atomic(metadataFile, metadata);
        await atomic(structureFile, structure);
        if (data.kind === "article")
          await atomic(
            articleFile,
            `# ${data.title.trim()}\n\n${data.description}\n\n${data.body.trim()}\n`,
          );
        await build();
      } catch (error) {
        await atomic(metadataFile, oldMetadata);
        await atomic(structureFile, oldStructure);
        if (data.kind === "article") {
          if (oldArticle !== null) await atomic(articleFile, oldArticle);
          else await unlink(articleFile).catch(() => {});
        }
        await build().catch(() => {});
        throw new EditorError(
          "Nicht übernommen: " + (error.stderr || error.message).slice(0, 1800),
          422,
        );
      }
      await unlink(draftFile(data.kind, data.id)).catch(() => {});
      return document(data.kind, data.id);
    });
  }
  async function bootstrap() {
    const [metadata, structure] = await Promise.all([
      json(metadataFile),
      json(structureFile),
    ]);
    const documents = [];
    for (const kind of ["article", "update"])
      for (const item of structure[kind === "article" ? "articles" : "updates"])
        documents.push({
          kind,
          id: item.id,
          title:
            metadata[kind === "article" ? "articles" : "updates"][item.id]
              .title,
          group: item.group ?? "",
          parentId: item.parentId ?? null,
          isDraft: item.status === "draft",
          date: item.date ?? "",
          hasDraft:
            item.status === "draft" || Boolean(await readDraft(kind, item.id)),
        });
    const drafts = await readdir(path.join(state, "drafts")).catch(() => []);
    for (const name of drafts) {
      const draft = await json(path.join(state, "drafts", name));
      if (draft.isNew && !documents.some((d) => d.id === draft.id))
        documents.push({
          kind: "article",
          id: draft.id,
          title: draft.title,
          group: draft.group,
          hasDraft: true,
          isNew: true,
        });
    }
    return {
      groups: structure.groups.map((group) => ({
        id: group.id,
        title: metadata.groups[group.id].title,
      })),
      documents,
    };
  }
  async function create(data) {
    return serial(async () => {
      if (
        typeof data.title !== "string" ||
        !data.title.trim() ||
        /[\r\n]/.test(data.title) ||
        data.title.length > 180
      )
        throw new EditorError("Bitte einen Seitentitel eingeben.");
      const catalog = await bootstrap();
      if (!catalog.groups.some((g) => g.id === data.group))
        throw new EditorError("Unbekannter Themenbereich.");
      const base = slug(data.title).slice(0, 70);
      let id = base;
      for (let n = 2; catalog.documents.some((d) => d.id === id); n++)
        id = `${base}-${n}`;
      const draft = {
        kind: "article",
        id,
        group: data.group,
        title: data.title.trim(),
        description: "",
        audience: "Alle Teams",
        outcome: "",
        tags: [],
        slug: id,
        body: "<!-- section: erste-schritte -->\n## Erste Schritte\n\n",
        changes: [],
        isNew: true,
        revision: randomUUID(),
      };
      await atomic(draftFile("article", id), draft);
      return draft;
    });
  }
  async function history(kind, id) {
    const folder = path.join(state, "history", key(kind, id));
    const files = await readdir(folder).catch(() => []);
    const entries = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map((f) => json(path.join(folder, f))),
    );
    return entries.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 30);
  }
  async function asset(data) {
    if (
      typeof data.name !== "string" ||
      typeof data.data !== "string" ||
      data.data.length > 7 * 1024 * 1024
    )
      throw new EditorError("Bitte ein Bild bis 5 MB auswählen.");
    const bytes = Buffer.from(data.data, "base64");
    if (bytes.length > 5 * 1024 * 1024 || bytes.length < 12)
      throw new EditorError("Ungültige Bilddatei.");
    const ext = bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? "png"
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        ? "jpg"
        : bytes.toString("ascii", 0, 4) === "RIFF" &&
            bytes.toString("ascii", 8, 12) === "WEBP"
          ? "webp"
          : null;
    if (!ext) throw new EditorError("Bitte PNG, JPG oder WebP verwenden.");
    const name =
      createHash("sha256").update(bytes).digest("hex").slice(0, 20) + "." + ext;
    await atomic(
      path.join(root, "apps/client/public/helpcenter/images/uploads", name),
      bytes,
    );
    return { url: "/helpcenter/images/uploads/" + name };
  }
  const siteFile = path.join(content, "site.json");
  async function site() {
    const [config, structure, metadata] = await Promise.all([
      json(siteFile),
      json(structureFile),
      json(metadataFile),
    ]);
    return {
      config,
      redirects: structure.urlRedirects?.de ?? [],
      groups: structure.groups.map((g) => ({
        id: g.id,
        title: metadata.groups[g.id].title,
        description: metadata.groups[g.id].description ?? "",
      })),
      pages: orderedPages(structure.groups, structure.articles).map(
        ({ depth, ...p }) => ({
          id: p.id,
          group: p.group,
          parentId: p.parentId ?? null,
          status: pageStatus(p),
          title: metadata.articles[p.id].title,
          slug: metadata.articles[p.id].slug,
        }),
      ),
      revision: hash([config, structure, metadata.groups, metadata.articles]),
    };
  }
  async function saveSite(data) {
    return serial(async () => {
      const current = await site();
      if (data.revision !== current.revision)
        throw new EditorError(
          "Die Verwaltung wurde zwischenzeitlich geändert. Bitte neu laden.",
          409,
        );
      const c = data.config;
      if (
        !c ||
        Object.keys(c).sort().join() !==
          Object.keys(current.config).sort().join()
      )
        throw new EditorError("Ungültige Einstellungen.");
      for (const [field, max] of [
        ["title", 100],
        ["description", 500],
        ["footerText", 200],
      ])
        if (
          typeof c[field] !== "string" ||
          !c[field].trim() ||
          c[field].length > max ||
          /[\r\n<>]/.test(c[field])
        )
          throw new EditorError("Ungültiger Wert für " + field);
      for (const field of ["accentColor", "headerColor"]) {
        if (typeof c[field] !== "string" || !/^#[0-9a-f]{6}$/i.test(c[field]))
          throw new EditorError("Bitte eine vollständige Hex-Farbe verwenden.");
        const rgb = c[field]
          .slice(1)
          .match(/../g)
          .map((v) => parseInt(v, 16) / 255)
          .map((v) =>
            v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4,
          );
        const contrast =
          1.05 / (rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 + 0.05);
        if (contrast < 4.5)
          throw new EditorError(
            "Die Farbe braucht mindestens 4,5:1 Kontrast zu Weiß.",
          );
      }
      if (
        !["comfortable", "wide"].includes(c.contentWidth) ||
        !["geist", "system"].includes(c.font) ||
        ["showFeedback", "showPrint", "showMarkdown"].some(
          (k) => typeof c[k] !== "boolean",
        )
      )
        throw new EditorError("Ungültige Darstellung.");
      const titleValid = (value, max) =>
        typeof value === "string" &&
        value.trim() &&
        value.length <= max &&
        !/[\r\n<>]/.test(value);
      if (
        !Array.isArray(data.groups) ||
        current.groups.some(
          (old) => !data.groups.some((g) => g.id === old.id),
        ) ||
        data.groups.some(
          (g) =>
            !titleValid(g.title, 80) ||
            (g.description != null &&
              (typeof g.description !== "string" ||
                g.description.length > 500)),
        )
      )
        throw new EditorError(
          "Alle bestehenden Themen müssen erhalten bleiben; jedes Thema braucht einen Namen.",
        );
      const pages = data.pages ?? current.pages;
      if (
        !Array.isArray(pages) ||
        current.pages.some((old) => !pages.some((p) => p.id === old.id))
      )
        throw new EditorError("Bestehende Seiten müssen erhalten bleiben.");
      for (const page of pages) {
        const old = current.pages.find((p) => p.id === page.id);
        if (
          !titleValid(page.title, 180) ||
          (old && (page.title !== old.title || page.status !== old.status)) ||
          (!old && page.status !== "draft")
        )
          throw new EditorError(
            "Seitentitel und Freigabe bestehender Seiten werden in der Redaktion bearbeitet. Neue Seiten beginnen als Entwurf.",
          );
        if (!old && (await readDraft("article", page.id)))
          throw new EditorError(
            "Diese Kennung wird bereits von einem lokalen Entwurf verwendet.",
            409,
          );
      }
      try {
        validateStructure(data.groups, pages);
      } catch (error) {
        throw new EditorError(error.message);
      }
      const urlPages = pages.map(page => ({ ...page, slug: page.slug ?? current.pages.find(p => p.id === page.id)?.slug ?? page.id }));
      let redirects;
      try {
        const locales = await json(path.join(content, "locales.json"));
        redirects = updateUrls(current.pages, urlPages, data.redirects ?? current.redirects, [...Object.keys(locales.locales), ...Object.values(locales.locales).map(locale => locale.pathPrefix?.split("/")[2]).filter(Boolean)]);
      } catch (error) { throw new EditorError(error.message); }
      for (const page of pages.filter(
        (p) => !current.pages.some((old) => old.id === p.id),
      )) {
        try {
          await readFile(
            path.join(content, "locales/de/articles", page.id + ".md"),
          );
          throw new EditorError(
            "Für diese Kennung existiert bereits eine Quelldatei.",
            409,
          );
        } catch (error) {
          if (error.code !== "ENOENT") throw error;
        }
      }
      const [structure, metadata] = await Promise.all([
        json(structureFile),
        json(metadataFile),
      ]);
      const before = await Promise.all(
        [siteFile, structureFile, metadataFile].map((file) =>
          readFile(file, "utf8"),
        ),
      );
      await atomic(
        path.join(
          state,
          "site-history",
          Date.now() + "-" + randomUUID() + ".json",
        ),
        {
          at: new Date().toISOString(),
          before: {
            config: current.config,
            structure,
            groups: metadata.groups,
            articles: metadata.articles,
          },
        },
      );
      structure.schemaVersion = 2;
      structure.groups = data.groups.map(
        (g) =>
          structure.groups.find((old) => old.id === g.id) ?? {
            id: g.id,
            icon: "book",
          },
      );
      for (const g of data.groups)
        metadata.groups[g.id] = {
          ...metadata.groups[g.id],
          title: g.title.trim(),
          description:
            g.description ?? metadata.groups[g.id]?.description ?? "",
        };
      structure.urlRedirects = { ...structure.urlRedirects, de: redirects };
      for (const page of urlPages) {
        if (metadata.articles[page.id]) metadata.articles[page.id].slug = page.slug;
      }
      const newFiles = [];
      structure.articles = orderedPages(data.groups, pages).map(
        ({ depth, ...page }) => {
          const old = structure.articles.find((p) => p.id === page.id);
          if (!old) {
            metadata.articles[page.id] = {
              title: page.title.trim(),
              slug: urlPages.find(p => p.id === page.id).slug,
              description: "",
              audience: "Alle Teams",
              outcome: "",
              tags: [],
            };
            newFiles.push({
              file: path.join(content, "locales/de/articles", page.id + ".md"),
              text: `# ${page.title.trim()}\n\n\n\n<!-- section: erste-schritte -->\n## Erste Schritte\n\n`,
            });
          }
          const value = {
            ...(old ?? {
              id: page.id,
              type: "guide",
              visual: null,
              steps: [],
              source: "Redaktion",
            }),
            group: page.group,
          };
          if (page.parentId) value.parentId = page.parentId;
          else delete value.parentId;
          if (page.status === "draft") value.status = "draft";
          else delete value.status;
          return value;
        },
      );
      try {
        for (const entry of newFiles) await atomic(entry.file, entry.text);
        await atomic(siteFile, c);
        await atomic(structureFile, structure);
        await atomic(metadataFile, metadata);
        await build();
      } catch (error) {
        for (const [index, file] of [
          siteFile,
          structureFile,
          metadataFile,
        ].entries())
          await atomic(file, before[index]);
        for (const entry of newFiles) await unlink(entry.file).catch(() => {});
        await build().catch(() => {});
        throw new EditorError(
          "Nicht gespeichert: " +
            (error.stderr || error.message).slice(0, 1000),
          422,
        );
      }
      return site();
    });
  }
  async function discard(kind, id) {
    key(kind, id);
    return serial(async () => {
      await unlink(draftFile(kind, id)).catch((e) => {
        if (e.code !== "ENOENT") throw e;
      });
      return { ok: true };
    });
  }
  return {
    bootstrap,
    site,
    saveSite,
    document,
    readDraft,
    saveDraft,
    apply,
    create,
    history,
    discard,
    asset,
  };
}
export function helpEditorPlugin(root, options = {}) {
  const token = randomUUID();
  const services = new Map();
  const serviceFor = (actor) => {
    const key = `${actor.workspaceId}/${actor.id}`;
    if (!services.has(key))
      services.set(
        key,
        createHelpEditor(root, {
          stateDirectory:
            actor.mode === "session"
              ? path.join(
                  root,
                  ".helpcenter-editor",
                  "workspaces",
                  actor.workspaceId,
                  "users",
                  actor.id,
                )
              : undefined,
        }),
      );
    return services.get(key);
  };
  const team = createHelpTeam(root, { ...options, serviceFor });
  return {
    name: "local-help-editor",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/__help-editor/")) return next();
        const send = (status, data) => {
          res.statusCode = status;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.setHeader("Cache-Control", "no-store");
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.end(JSON.stringify(data));
        };
        const host = req.headers.host ?? "",
          remote = req.socket.remoteAddress;
        if (
          !/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(host) ||
          !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(remote) ||
          req.headers["sec-fetch-site"] === "cross-site"
        )
          return send(403, { error: "Der Editor ist nur lokal erreichbar." });
        if (req.headers.origin && req.headers.origin !== `http://${host}`)
          return send(403, { error: "Unzulässiger Ursprung." });
        const url = new URL(req.url, `http://${host}`);
        try {
          const actor = await team.authenticate(req);
          const service = serviceFor(actor);
          if (req.method === "GET") {
            if (url.pathname === "/__help-editor/access")
              return send(200, { ...(await team.access(actor)), token });
            if (url.pathname === "/__help-editor/reviews")
              return send(200, await team.list(actor));
            if (url.pathname === "/__help-editor/review")
              return send(
                200,
                await team.detail(actor, url.searchParams.get("id")),
              );
            if (url.pathname === "/__help-editor/site")
              return send(200, { ...(await service.site()), token });
            if (url.pathname.endsWith("/bootstrap"))
              return send(200, {
                ...(await service.bootstrap()),
                token,
                access: await team.access(actor),
              });
            const kind = url.searchParams.get("kind"),
              id = url.searchParams.get("id");
            if (url.pathname.endsWith("/document"))
              return send(200, {
                document: await service.document(kind, id),
                draft: await service.readDraft(kind, id),
              });
            if (url.pathname.endsWith("/history"))
              return send(200, await service.history(kind, id));
          }
          if (req.method === "POST") {
            if (
              req.headers["x-help-editor-token"] !== token ||
              !req.headers["content-type"]?.startsWith("application/json")
            )
              return send(403, { error: "Bitte den Editor neu laden." });
            let body = "";
            for await (const chunk of req) {
              body += chunk;
              if (
                Buffer.byteLength(body) >
                (url.pathname.endsWith("/asset") ? 8 : 1) * 1024 * 1024
              )
                throw new EditorError("Der Inhalt ist zu groß.", 413);
            }
            const data = JSON.parse(body);
            if (url.pathname === "/__help-editor/member")
              return send(200, await team.member(actor, data));
            if (url.pathname === "/__help-editor/review-submit")
              return send(200, await team.submit(actor, data));
            if (url.pathname === "/__help-editor/review-decide")
              return send(200, await team.decide(actor, data));
            if (url.pathname === "/__help-editor/site") {
              requireCapability(actor, "structure");
              if (
                JSON.stringify(data.config) !==
                JSON.stringify((await service.site()).config)
              )
                requireCapability(actor, "settings");
              return send(200, await service.saveSite(data));
            }
            requireCapability(actor, "edit");
            if (url.pathname.endsWith("/apply") && team.mode === "session")
              throw new EditorError(
                "Bitte den Inhalt als Änderungsvorschlag einreichen und freigeben lassen.",
                403,
              );
            if (url.pathname.endsWith("/draft"))
              return send(200, await service.saveDraft(data));
            if (url.pathname.endsWith("/apply"))
              return send(200, await service.apply(data));
            if (url.pathname.endsWith("/create"))
              return send(200, await service.create(data));
            if (url.pathname.endsWith("/asset"))
              return send(200, await service.asset(data));
            if (url.pathname.endsWith("/discard"))
              return send(200, await service.discard(data.kind, data.id));
          }
          send(404, { error: "Unbekannte Editor-Aktion." });
        } catch (error) {
          send(error.status ?? 500, {
            error: error.message ?? "Speichern fehlgeschlagen.",
          });
        }
      });
    },
  };
}
