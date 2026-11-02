import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Modal } from "@mantine/core";
import { diffLines } from "diff";
import {
  IconArrowLeft,
  IconArrowUpRight,
  IconBook2,
  IconCheck,
  IconChevronDown,
  IconCode,
  IconDeviceDesktop,
  IconDeviceMobile,
  IconDeviceFloppy,
  IconEye,
  IconFileText,
  IconHistory,
  IconLayoutSidebarRight,
  IconListDetails,
  IconMenu2,
  IconPlus,
  IconSearch,
  IconUpload,
  IconX,
  IconGitCompare,
  IconRefresh,
  IconArrowsMaximize,
} from "@tabler/icons-react";
import { DocumentTitle } from "@/components/ui/document-title";
import { articles, renderArticle } from "../content";
import { ArticleGraphic } from "../help-visuals";
import ReleaseArtwork from "../release-artwork";
import { previewBody } from "./markdown";
import RichEditor from "./rich-editor";
import { ContentNavigation, ContentOverview } from "./content-structure";
import type {
  EditorDocument,
  EditorCatalog,
  HistoryEntry,
} from "./editor-types";
import baseStyles from "../helpcenter.module.css";
import styles from "./editor.module.css";
const snapshot = (doc: EditorDocument) =>
  JSON.stringify([
    doc?.title,
    doc?.description,
    doc?.body,
    doc?.group,
    doc?.audience,
    doc?.outcome,
    doc?.tags,
    doc?.changes,
  ]);
const fullText = (doc: EditorDocument) =>
  `# ${doc?.title ?? ""}\n\n${doc?.description ?? ""}\n\n${doc?.kind === "update" ? doc.changes.map((c) => `## ${c.title}\n\n${c.description}`).join("\n\n") : (doc?.body ?? "")}`;
export default function HelpEditor() {
  const [params, setParams] = useSearchParams();
  const [catalog, setCatalog] = useState<EditorCatalog | null>(null),
    [data, setData] = useState<EditorDocument | null>(null),
    [source, setSource] = useState<EditorDocument | null>(null),
    [filter, setFilter] = useState(""),
    [mode, setMode] = useState<"visual" | "markdown" | "preview" | "diff">(
      "visual",
    ),
    [status, setStatus] = useState("Lädt …"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [panel, setPanel] = useState<"properties" | "history" | null>("properties"),
    [history, setHistory] = useState<HistoryEntry[]>([]),
    [mobilePreview, setMobilePreview] = useState(false),
    [navOpen, setNavOpen] = useState(false),
    [creating, setCreating] = useState(false),
    [newTitle, setNewTitle] = useState(""),
    [newGroup, setNewGroup] = useState("start"),
    [editorKey, setEditorKey] = useState(0);
  const [structureOpen, setStructureOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "discard" | "source" | null
  >(null);
  const counter = useRef(0),
    mounted = useRef(true),
    applied = useRef(false);
  const canEdit =
    !catalog?.access || catalog.access.capabilities.includes("edit");
  const dirty =
    data && source && (snapshot(data) !== snapshot(source) || data.isNew);
  const request = async <T,>(path: string, value?: unknown): Promise<T> => {
    const response = await fetch(
      `/__help-editor/${path}`,
      value === undefined
        ? { cache: "no-store" }
        : {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Help-Editor-Token": catalog?.token ?? "",
            },
            body: JSON.stringify(value),
          },
    );
    let result: any;
    try {
      result = await response.json();
    } catch {
      throw new Error(
        "Der lokale Editor-Dienst ist nicht erreichbar. Bitte das Projekt im Entwicklungsmodus starten.",
      );
    }
    if (!response.ok)
      throw new Error(
        result.error || "Die Aktion konnte nicht abgeschlossen werden.",
      );
    return result;
  };
  const refresh = async () => {
    const result = await request<EditorCatalog>("bootstrap");
    setCatalog(result);
    if (result.access && !result.access.capabilities.includes("edit"))
      setMode("preview");
    return result;
  };
  const load = async (kind: string, id: string) => {
    const seq = ++counter.current;
    setError("");
    setStatus("Lädt …");
    try {
      const result = await request<{
        document: EditorDocument;
        draft: EditorDocument | null;
      }>(`document?kind=${kind}&id=${encodeURIComponent(id)}`);
      if (seq !== counter.current) return;
      setHistory([]);
      setPanel("properties");
      setSource(result.document);
      setData(result.draft ?? result.document);
      setEditorKey((key) => key + 1);
      setStatus(result.draft ? "Entwurf geladen" : "Aktueller Stand");
      if (result.draft && result.draft.revision !== result.document.revision)
        setError(
          "Die Quelle wurde seit diesem Entwurf geändert. Lade den aktuellen Stand, bevor du Inhalte übernimmst.",
        );
      setMode("visual");
      setStructureOpen(false);
      setNavOpen(false);
      setParams({ typ: kind, seite: id }, { replace: true });
    } catch (e) {
      setError(e.message);
      setStatus("Nicht geladen");
    }
  };
  useEffect(() => {
    mounted.current = true;
    refresh()
      .then((result) => {
        const id = params.get("seite") ?? "schnellstart",
          kind = params.get("typ") ?? "article";
        const item =
          result.documents.find((d) => d.id === id && d.kind === kind) ??
          result.documents[0];
        if (item) load(item.kind, item.id);
      })
      .catch((e) => setError(e.message));
    return () => {
      mounted.current = false;
    };
  }, []);
  const update = (change: Partial<EditorDocument>) => {
    if (!canEdit) return;
    setData((value) => ({ ...value, ...change }));
    setStatus("Ungesichert");
    setError("");
  };
  const persist = async (value = data) => {
    if (!value) return;
    setStatus("Speichert …");
    await request("draft", value);
    if (mounted.current) setStatus("Entwurf gesichert");
  };
  useEffect(() => {
    if (!data || !dirty || busy || !catalog || !canEdit) return;
    const timer = setTimeout(() => {
      persist(data).catch((e) => {
        if (mounted.current) {
          setError(e.message);
          setStatus("Nicht gesichert");
        }
      });
    }, 900);
    return () => clearTimeout(timer);
  }, [data, dirty, busy, catalog?.token]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (
        status === "Ungesichert" ||
        status === "Speichert …" ||
        status === "Nicht gesichert"
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [status]);
  const select = async (kind: string, id: string) => {
    try {
      if (dirty) await persist();
      await load(kind, id);
    } catch (e) {
      setError(e.message);
    }
  };
  const discard = async () => {
    if (!data) return;
    setConfirmAction(null);
    setBusy(true);
    try {
      await request("discard", { kind: data.kind, id: data.id });
      const result = await refresh();
      const item = data.isNew ? result.documents[0] : data;
      await load(item.kind, item.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const submitReview = async () => {
    if (!data) return;
    setBusy(true);
    setError("");
    try {
      await persist();
      await request("review-submit", data);
      setStatus("Zur Prüfung eingereicht");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const apply = async () => {
    if (!data) return;
    setBusy(true);
    setError("");
    try {
      await persist();
      const result = await request<EditorDocument>("apply", data);
      applied.current = true;
      setSource(result);
      setData(result);
      setStatus("Übernommen");
      await refresh();
    } catch (e) {
      setError(e.message);
      setStatus("Nicht übernommen");
    } finally {
      setBusy(false);
    }
  };
  const uploadImage = async (file: File) => {
    if (file.size > 5 * 1024 * 1024)
      throw new Error("Bitte ein Bild bis 5 MB auswählen.");
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(",")[1]);
      reader.onerror = () =>
        reject(new Error("Bild konnte nicht gelesen werden."));
      reader.readAsDataURL(file);
    });
    const result = await request<{ url: string }>("asset", {
      name: file.name,
      data: base64,
    });
    return result.url;
  };
  useEffect(() => {
    const shortcuts = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (data && !busy) persist().catch((e) => setError(e.message));
      }
      if (event.key === "Escape" && focusMode) setFocusMode(false);
    };
    window.addEventListener("keydown", shortcuts);
    return () => window.removeEventListener("keydown", shortcuts);
  }, [data, busy, focusMode, catalog?.token]);
  const openHistory = async () => {
    setPanel(panel === "history" ? null : "history");
    if (data)
      try {
        setHistory(
          await request<HistoryEntry[]>(
            `history?kind=${data.kind}&id=${data.id}`,
          ),
        );
      } catch (e) {
        setError(e.message);
      }
  };
  const create = async () => {
    setBusy(true);
    try {
      if (dirty) await persist();
      const result = await request<EditorDocument>("create", {
        title: newTitle,
        group: newGroup,
      });
      setSource(result);
      setData(result);
      setEditorKey((k) => k + 1);
      setCreating(false);
      setStructureOpen(false);
      setNavOpen(false);
      setMode("visual");
      setStatus("Entwurf angelegt");
      setParams({ typ: "article", seite: result.id }, { replace: true });
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const showCurrent = () => {
    setConfirmAction(null);
    setData(source);
    setEditorKey((k) => k + 1);
    setError("");
    setStatus("Aktueller Stand");
  };
  const links = articles.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
  }));
  const html = useMemo(
    () =>
      data?.kind === "article"
        ? renderArticle(previewBody(fullText(data), links)).html
        : "",
    [data],
  );
  const meta = articles.find((a) => a.id === data?.id);
  const starts = [...html.matchAll(/<h2\b[^>]*>/g)];
  const graphicAt = meta?.visual
    ? (starts[1]?.index ?? html.length)
    : html.length;
  const outline = [...(data?.body?.matchAll(/^## (.+)$/gm) ?? [])].map(
    (m) => m[1],
  );
  const changes = useMemo(
    () => (source && data ? diffLines(fullText(source), fullText(data)) : []),
    [source, data],
  );
  const totalAdded = changes
      .filter((c) => c.added)
      .reduce((n, c) => n + (c.count ?? 0), 0),
    totalRemoved = changes
      .filter((c) => c.removed)
      .reduce((n, c) => n + (c.count ?? 0), 0);
  const groups = catalog?.groups ?? [];
  const noService = !catalog && error;
  return (
    <div
      className={`${baseStyles.root} ${styles.app} ${focusMode ? styles.focusMode : ""}`}
      data-theme="light"
    >
      <DocumentTitle
        title="Redaktion · laightup Hilfebereich"
        withAppName={false}
      >
        <meta name="robots" content="noindex,nofollow" />
      </DocumentTitle>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <Link to="/help" aria-label="Zum Hilfebereich">
            <img src="/helpcenter/logo.svg" alt="laightup" />
          </Link>
          <span />
          <strong>Redaktion</strong>
          <small>Nur lokal</small>
        </div>
        {!structureOpen && (
          <div className={styles.topActions}>
            <Link to="/help/verwalten?bereich=freigaben">
              Prüfung & Freigabe
            </Link>
            {catalog?.access?.mode !== "session" && (
              <button
                disabled={!dirty || busy || !canEdit}
                onClick={submitReview}
              >
                Zur Prüfung einreichen
              </button>
            )}

            <button
              aria-label="Fokusmodus"
              aria-pressed={focusMode}
              title="Fokusmodus · Escape zum Beenden"
              onClick={() => setFocusMode(!focusMode)}
            >
              <IconArrowsMaximize size={16} />
            </button>
            <span className={styles.saveStatus} role="status">
              {status === "Entwurf gesichert" || status === "Übernommen" ? (
                <IconCheck size={14} />
              ) : (
                <i />
              )}
              {status}
            </span>
            <button
              disabled={!data || busy || !canEdit}
              onClick={() => persist().catch((e) => setError(e.message))}
            >
              <IconDeviceFloppy size={15} />
              <span>Entwurf sichern</span>
            </button>
            <button
              className={styles.primary}
              disabled={!dirty || busy || !canEdit}
              onClick={
                catalog?.access?.mode === "session" ? submitReview : apply
              }
            >
              <IconUpload size={15} />
              {busy
                ? "Prüft …"
                : catalog?.access?.mode === "session"
                  ? "Zur Prüfung einreichen"
                  : "Übernehmen"}
            </button>
          </div>
        )}
      </header>
      <div className={styles.workspace}>
        <aside
          className={`${styles.sidebar} ${navOpen ? styles.navOpen : ""}`}
          inert={busy}
        >
          <div className={styles.sidebarTitle}>
            <span>LAIGHTUP HILFEBEREICH</span>
            <button
              onClick={() => setNavOpen(false)}
              aria-label="Navigation schließen"
            >
              <IconX size={16} />
            </button>
          </div>
          <div className={styles.find}>
            <IconSearch size={15} />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              aria-label="Seiten suchen"
              placeholder="Seite suchen …"
            />
            <kbd>⌕</kbd>
          </div>
          <button
            className={styles.newPage}
            onClick={() => {
              setCreating(true);
              setNewTitle("");
            }}
          >
            <IconPlus size={16} />
            Neue Seite
          </button>
          <ContentNavigation
            catalog={catalog}
            selected={data}
            filter={filter}
            overview={structureOpen}
            onSelect={select}
            onOverview={() => {
              setStructureOpen(true);
              setNavOpen(false);
            }}
            onCreate={(group) => {
              setNewGroup(group);
              setNewTitle("");
              setCreating(true);
            }}
          />
          <Link className={styles.backLink} to="/help/verwalten">
            <IconLayoutSidebarRight size={14} />
            Website verwalten
          </Link>
          <Link className={styles.backLink} to="/help">
            <IconArrowLeft size={14} />
            Zum Hilfebereich
          </Link>
        </aside>
        <main className={styles.main} inert={busy}>
          <div className={styles.documentBar}>
            <button
              className={styles.mobileNav}
              onClick={() => setNavOpen(!navOpen)}
              aria-label="Seiten öffnen"
            >
              <IconMenu2 size={18} />
            </button>
            <div className={styles.crumb}>
              <button
                onClick={() => setStructureOpen(true)}
                aria-label="Inhaltsübersicht öffnen"
              >
                {structureOpen
                  ? "Dokumentation"
                  : data?.kind === "update"
                    ? "Was ist neu?"
                    : (groups.find((g) => g.id === data?.group)?.title ??
                      "Dokumentation")}
              </button>
              <IconChevronDown size={12} />
              <strong>
                {structureOpen
                  ? "Inhaltsübersicht"
                  : (data?.title ?? "Redaktion laden")}
              </strong>
            </div>
            {!structureOpen && (
              <>
                <button
                  onClick={openHistory}
                  aria-label="Versionshistorie"
                  title="Versionshistorie"
                >
                  <IconHistory size={17} />
                </button>
                <button
                  onClick={() =>
                    setPanel(panel === "properties" ? null : "properties")
                  }
                  aria-label="Seiteneinstellungen"
                  title="Seiteneinstellungen"
                >
                  <IconLayoutSidebarRight size={17} />
                </button>
              </>
            )}
          </div>
          {error && (
            <div className={styles.error} role="alert">
              <span>{error}</span>
              {catalog && (
                <button
                  onClick={() =>
                    dirty ? setConfirmAction("source") : showCurrent()
                  }
                >
                  <IconRefresh size={14} />
                  Quelle laden
                </button>
              )}
            </div>
          )}
          {structureOpen && catalog ? (
            <ContentOverview
              catalog={catalog}
              onSelect={select}
              onCreate={(group) => {
                setNewGroup(group);
                setNewTitle("");
                setCreating(true);
              }}
            />
          ) : noService ? (
            <div className={styles.unavailable}>
              <IconBook2 size={32} />
              <h1>Redaktion lokal öffnen</h1>
              <p>
                Dieses Werkzeug arbeitet mit den Inhaltsquellen auf deinem
                Rechner. Starte die lokale Entwicklungsumgebung und öffne diese
                Seite dort erneut.
              </p>
              <Link to="/help">Zur Dokumentation</Link>
            </div>
          ) : (
            data && (
              <>
                <div className={styles.modebar}>
                  <div role="tablist" aria-label="Editoransicht">
                    <button
                      role="tab"
                      aria-selected={mode === "visual"}
                      onClick={() => {
                        setMode("visual");
                        setEditorKey((k) => k + 1);
                      }}
                    >
                      <IconFileText size={15} />
                      Bearbeiten
                    </button>
                    {data.kind === "article" && (
                      <button
                        role="tab"
                        aria-selected={mode === "markdown"}
                        onClick={() => setMode("markdown")}
                      >
                        <IconCode size={15} />
                        Markdown
                      </button>
                    )}
                    <button
                      role="tab"
                      aria-selected={mode === "preview"}
                      onClick={() => setMode("preview")}
                    >
                      <IconEye size={15} />
                      Vorschau
                    </button>
                    <button
                      role="tab"
                      aria-selected={mode === "diff"}
                      onClick={() => setMode("diff")}
                    >
                      <IconGitCompare size={15} />
                      Änderungen{dirty && <i />}
                    </button>
                  </div>
                  {mode === "preview" ? (
                    <div className={styles.devices}>
                      <button
                        aria-label="Desktop-Vorschau"
                        aria-pressed={!mobilePreview}
                        onClick={() => setMobilePreview(false)}
                      >
                        <IconDeviceDesktop size={16} />
                      </button>
                      <button
                        aria-label="Mobile Vorschau"
                        aria-pressed={mobilePreview}
                        onClick={() => setMobilePreview(true)}
                      >
                        <IconDeviceMobile size={16} />
                      </button>
                    </div>
                  ) : (
                    <span className={styles.locale}>
                      Deutsch <i /> Ausgangssprache
                    </span>
                  )}
                </div>
                <div className={styles.canvas} data-editor-scroll>
                  {(mode === "visual" || mode === "markdown") && (
                    <div className={styles.editPage}>
                      <div className={styles.pageLabel}>
                        <IconFileText size={15} />
                        {data.isNew
                          ? "NEUE ANLEITUNG"
                          : data.kind === "update"
                            ? "PRODUKTMELDUNG"
                            : data.isDraft
                              ? "UNVERÖFFENTLICHTER ENTWURF"
                              : "ANLEITUNG"}
                      </div>
                      <input
                        className={styles.titleInput}
                        aria-label="Seitentitel"
                        placeholder="Dein Seitentitel"
                        value={data.title}
                        onChange={(e) =>
                          update({
                            title: e.target.value.replace(/[\r\n]/g, " "),
                          })
                        }
                      />
                      <textarea
                        className={styles.descriptionInput}
                        aria-label="Kurzbeschreibung"
                        placeholder="Worum geht es auf dieser Seite?"
                        value={data.description}
                        onChange={(e) =>
                          update({ description: e.target.value })
                        }
                      />
                      {data.kind === "article" ? (
                        mode === "visual" ? (
                          <RichEditor
                            key={`${data.id}-${editorKey}`}
                            value={data.body}
                            onChange={(body) => update({ body })}
                            links={links}
                            onUpload={uploadImage}
                          />
                        ) : (
                          <textarea
                            className={styles.markdown}
                            aria-label="Markdown-Inhalt"
                            value={data.body}
                            spellCheck={false}
                            onChange={(e) => update({ body: e.target.value })}
                          />
                        )
                      ) : (
                        <div className={styles.newsEditor}>
                          <p className={styles.newsHint}>
                            Bearbeite die fachliche Übersicht und die
                            Anleitungsabschnitte. Die belegten Produktänderungen
                            bleiben erhalten.
                          </p>
                          {data.changes.map((change, i) => (
                            <section key={change.id}>
                              <span>ABSCHNITT {i + 1}</span>
                              <input
                                aria-label={`Abschnitt ${i + 1}: Titel`}
                                value={change.title}
                                onChange={(e) =>
                                  update({
                                    changes: data.changes.map((c, n) =>
                                      n === i
                                        ? { ...c, title: e.target.value }
                                        : c,
                                    ),
                                  })
                                }
                              />
                              <textarea
                                aria-label={`Abschnitt ${i + 1}: Beschreibung`}
                                value={change.description}
                                onChange={(e) =>
                                  update({
                                    changes: data.changes.map((c, n) =>
                                      n === i
                                        ? { ...c, description: e.target.value }
                                        : c,
                                    ),
                                  })
                                }
                              />
                              <small>
                                {Object.values(change.linkLabels).map(
                                  (label, j) => (
                                    <span key={j}>
                                      <IconArrowUpRight size={12} />
                                      {label}
                                    </span>
                                  ),
                                )}
                              </small>
                            </section>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {mode === "preview" && (
                    <article
                      className={`${styles.preview} ${mobilePreview ? styles.phone : ""}`}
                    >
                      <span className={styles.previewLabel}>
                        VORSCHAU ·{" "}
                        {dirty || data.isDraft ? "ENTWURF" : "AKTUELLER STAND"}
                      </span>
                      <h1>{data.title}</h1>
                      <p className={styles.previewLead}>{data.description}</p>
                      {data.kind === "article" ? (
                        <>
                          <div
                            className={baseStyles.prose}
                            dangerouslySetInnerHTML={{
                              __html: html.slice(0, graphicAt),
                            }}
                          />
                          {meta?.visual && (
                            <ArticleGraphic variant={meta.visual} />
                          )}
                          <div
                            className={baseStyles.prose}
                            dangerouslySetInnerHTML={{
                              __html: html.slice(graphicAt),
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <ReleaseArtwork entryId={data.id} />
                          {data.changes.map((c) => (
                            <section
                              className={styles.previewChange}
                              key={c.id}
                            >
                              <h2>{c.title}</h2>
                              <p>{c.description}</p>
                              {Object.entries(c.linkLabels).map(
                                ([id, label]) => (
                                  <Link
                                    key={id}
                                    to={`/help/${articles.find((a) => a.id === id)?.slug ?? id}`}
                                    target="_blank"
                                  >
                                    {label} ↗
                                  </Link>
                                ),
                              )}
                            </section>
                          ))}
                        </>
                      )}
                    </article>
                  )}
                  {mode === "diff" && (
                    <div className={styles.diff}>
                      <div className={styles.diffHeading}>
                        <h1>Deine Änderungen</h1>
                        <span>
                          <b>+{totalAdded}</b>
                          <em>−{totalRemoved}</em>
                        </span>
                      </div>
                      <p>Aktueller Inhalt im Vergleich zu deinem Entwurf.</p>
                      {!dirty ? (
                        <div className={styles.noChanges}>
                          <IconCheck size={24} />
                          <strong>Alles auf dem aktuellen Stand</strong>
                          <span>
                            Sobald du etwas bearbeitest, siehst du hier die
                            Unterschiede.
                          </span>
                        </div>
                      ) : (
                        <pre>
                          {changes.map((part, i) => (
                            <span
                              key={i}
                              className={
                                part.added
                                  ? styles.added
                                  : part.removed
                                    ? styles.removed
                                    : ""
                              }
                            >
                              {part.value}
                            </span>
                          ))}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </>
            )
          )}
        </main>
        {panel && data && !structureOpen && (
          <aside className={styles.inspector} inert={busy}>
            <div className={styles.inspectorTitle}>
              <strong>
                {panel === "history"
                  ? "Versionshistorie"
                  : "Seiteneinstellungen"}
              </strong>
              <button
                onClick={() => setPanel(null)}
                aria-label="Seitenpanel schließen"
              >
                <IconX size={16} />
              </button>
            </div>
            {panel === "properties" ? (
              <>
                <span className={styles.inspectorEyebrow}>ORGANISATION</span>
                {data.kind === "article" && (
                  <>
                    <label>
                      Themenbereich
                      <select
                        value={data.group}
                        onChange={(e) => update({ group: e.target.value })}
                      >
                        {groups.map((g) => (
                          <option value={g.id} key={g.id}>
                            {g.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Für wen?
                      <input
                        value={data.audience}
                        onChange={(e) => update({ audience: e.target.value })}
                      />
                    </label>
                    <label>
                      Lernziel
                      <textarea
                        value={data.outcome}
                        onChange={(e) => update({ outcome: e.target.value })}
                      />
                    </label>
                    <label>
                      Suchbegriffe
                      <input
                        placeholder="Mit Komma trennen"
                        value={data.tags.join(", ")}
                        onChange={(e) =>
                          update({
                            tags: e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                      />
                    </label>
                  </>
                )}
                <div className={styles.languageNote}>
                  <span>DE</span>
                  <div>
                    <strong>Deutsch</strong>
                    <small>Ausgangssprache</small>
                  </div>
                  <IconCheck size={15} />
                </div>
                {dirty && (
                  <button
                    className={styles.discard}
                    disabled={busy}
                    onClick={() => setConfirmAction("discard")}
                  >
                    Entwurf verwerfen
                  </button>
                )}
                <p className={styles.info}>
                  {catalog?.access?.mode === "session"
                    ? "Entwürfe sind deiner Anmeldung zugeordnet. Reiche Änderungen zur Prüfung ein; eine andere Person gibt den eingereichten Stand frei."
                    : "Entwürfe werden lokal gesichert. Übernimm Änderungen direkt oder reiche sie als Vorschlag zur Prüfung ein."}
                </p>
                <span className={styles.inspectorEyebrow}>
                  AUF DIESER SEITE
                </span>
                <div className={styles.outline}>
                  {(data.kind === "update"
                    ? data.changes.map((c) => c.title)
                    : outline
                  ).map((title, i) => (
                    <span key={i}>
                      <IconListDetails size={12} />
                      {title}
                    </span>
                  ))}
                </div>
                {!data.isNew && !data.isDraft && (
                  <a
                    className={styles.liveLink}
                    href={
                      data.kind === "update"
                        ? `/help/was-ist-neu#${data.id}`
                        : `/help/${data.slug}`
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Im Hilfebereich öffnen
                    <IconArrowUpRight size={14} />
                  </a>
                )}
              </>
            ) : (
              <div className={styles.history}>
                <p>
                  Vor jeder Übernahme wird der vorherige Stand lokal aufbewahrt.
                </p>
                {!history.length && (
                  <div className={styles.emptyHistory}>
                    <IconHistory size={27} />
                    <strong>Noch keine früheren Versionen</strong>
                    <span>Die erste Sicherung entsteht beim Übernehmen.</span>
                  </div>
                )}
                {history.map((entry) => (
                  <div key={entry.id}>
                    <time>
                      {new Intl.DateTimeFormat("de-DE", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(entry.at))}
                    </time>
                    <strong>{entry.before.title}</strong>
                    <button
                      onClick={() => {
                        update({
                          ...entry.before,
                          revision: source.revision,
                          isNew: source.isNew,
                        });
                        setEditorKey((k) => k + 1);
                        setMode("visual");
                      }}
                    >
                      Als Entwurf laden
                    </button>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>
      <Modal
        opened={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction === "discard"
            ? "Entwurf verwerfen?"
            : "Aktuellen Stand laden?"
        }
        centered
        withinPortal={false}
        radius="lg"
        classNames={{ title: styles.dialogTitle, body: styles.dialogBody }}
      >
        <p className={styles.confirmText}>
          {confirmAction === "discard"
            ? "Nur dein lokaler Entwurf wird entfernt. Der übernommene Inhalt bleibt erhalten."
            : "Dein gespeicherter Entwurf bleibt auf diesem Rechner erhalten. Im Editor wird der aktuelle Quellenstand geladen."}
        </p>
        <div className={styles.confirmButtons}>
          <button onClick={() => setConfirmAction(null)}>Abbrechen</button>
          <button
            className={styles.primary}
            onClick={() =>
              confirmAction === "discard" ? discard() : showCurrent()
            }
          >
            {confirmAction === "discard"
              ? "Verwerfen"
              : "Aktuellen Stand laden"}
          </button>
        </div>
      </Modal>
      {creating && (
        <Modal
          opened={creating}
          onClose={() => setCreating(false)}
          title="Eine neue Anleitung"
          centered
          withinPortal={false}
          radius="lg"
          classNames={{ title: styles.dialogTitle, body: styles.dialogBody }}
        >
          <form
            className={styles.newDialog}
            onSubmit={(e) => {
              e.preventDefault();
              create();
            }}
          >
            <p>
              Starte mit einer Aufgabe, bei der du deinen Nutzern helfen
              möchtest.
            </p>
            <label>
              Seitentitel
              <input
                autoFocus
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Zum Beispiel: Ein Display verbinden"
              />
            </label>
            <label>
              Themenbereich
              <select
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
              >
                {groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </label>
            <button
              className={styles.primary}
              disabled={!newTitle.trim() || busy}
            >
              Entwurf anlegen
              <IconArrowUpRight size={16} />
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
