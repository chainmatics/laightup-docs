import UrlManagement, { type UrlRedirect } from "./url-management";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowDown as IconArrowDown,
  ArrowUp as IconArrowUp,
  ArrowUpRight as IconArrowUpRight,
  Check as IconCheck,
  FileText as IconFileText,
  Folder as IconFolder,
  LockKeyhole as IconLock,
  Menu as IconMenu2,
  Palette as IconPalette,
  Route as IconRoute,
  Settings as IconSettings,
  ShieldCheck as IconShieldCheck,
} from "lucide-react";
import { DocumentTitle } from "@/components/ui/document-title";
import initialConfig from "../../../../../../docs/helpcenter/site.json";
import type { EditorCatalog } from "../editor/editor-types";
import base from "../helpcenter.module.css";
import styles from "./site-management.module.css";
import TeamWorkflow from "./team-workflow";
import StructureEditor, {
  type StructureGroup,
  type StructurePage,
} from "./structure-editor";
import {
  GlassSettingsPageHeader,
  GlassSettingsSection,
  GlassSettingsRow,
  GlassSettingsNav,
  GlassSettingsNavGroup,
  GlassSettingsNavItem,
  GlassInput,
  GlassTextarea,
  GlassButton,
  GlassIconButton,
  GlassSwitch,
  GlassCard,
  GlassSelect,
  GlassTooltipProvider,
} from "./laightup-ui";
type Site = {
  config: typeof initialConfig;
  groups: StructureGroup[];
  pages: StructurePage[];
  revision: string;
  redirects: UrlRedirect[];
};
const areas = [
  { id: "allgemein", label: "Allgemein", icon: IconSettings },
  { id: "struktur", label: "Inhaltsstruktur", icon: IconFolder },
  { id: "urls", label: "URLs & Weiterleitungen", icon: IconRoute },
  { id: "gestaltung", label: "Gestaltung", icon: IconPalette },
  { id: "freigaben", label: "Prüfung & Freigabe", icon: IconCheck },
  { id: "berechtigungen", label: "Berechtigungen", icon: IconShieldCheck },
  { id: "ausbau", label: "Roadmap", icon: IconRoute },
];
const phases = [
  [
    "01",
    "Verwaltung & Konfiguration",
    "Jetzt umgesetzt",
    "Gespeicherte Website-Einstellungen, Themen benennen und sortieren, Gestaltung mit Vorschau und sichtbare Lesefunktionen.",
  ],
  [
    "02",
    "Hierarchie & Varianten",
    "Hierarchie umgesetzt",
    "Themen, Seiten und Unterseiten anlegen, verschieben und sortieren. Seitenadressen und Weiterleitungen sind verwaltbar. Sprach- und Versionsvarianten folgen.",
  ],
  [
    "03",
    "Team & Freigaben",
    "Lokal mit zwei Konten geprüft",
    "Workspace-Anmeldung, Rollenprüfung, persönliche Entwürfe und unabhängige Freigabe sind lokal mit zwei echten Konten geprüft. Gruppenrechte und produktiver Betrieb folgen.",
  ],
  [
    "04",
    "Veröffentlichung & Betrieb",
    "Geplant",
    "Getrennte Entwurfs- und Live-Stände, Vorschau-Links, Veröffentlichung und Rücknahme, Domains, Backups sowie Betriebs- und Zugriffsprüfungen.",
  ],
];
export default function SiteManagement() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const area = areas.some((a) => a.id === params.get("bereich"))
    ? params.get("bereich")!
    : "allgemein";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [site, setSite] = useState<Site | null>(null),
    [saved, setSaved] = useState<Site | null>(null),
    [catalog, setCatalog] = useState<EditorCatalog | null>(null),
    [token, setToken] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const canEditArea =
    !catalog?.access ||
    catalog.access.capabilities.includes(
      ["struktur", "urls"].includes(area) ? "structure" : "settings",
    );
  const readOnlyArea =
    ["allgemein", "struktur", "gestaltung", "urls"].includes(area) &&
    !canEditArea;
  const dirty =
    !!site && !!saved && JSON.stringify(site) !== JSON.stringify(saved);
  const update = (patch: Partial<Site["config"]>) => {
    if (site) setSite({ ...site, config: { ...site.config, ...patch } });
    setNotice("");
    setError("");
  };
  async function load() {
    setError("");
    setBusy(true);
    try {
      const [response, catalogResponse] = await Promise.all([
        fetch("/__help-editor/site"),
        fetch("/__help-editor/bootstrap"),
      ]);
      if (!response.ok || !catalogResponse.ok) {
        const failed = await (!response.ok ? response : catalogResponse).json();
        throw new Error(
          failed.error || "Die lokale Verwaltung konnte nicht geladen werden.",
        );
      }
      const value = await response.json();
      setToken(value.token);
      const next = {
        config: value.config,
        groups: value.groups,
        pages: value.pages,
        redirects: value.redirects ?? [],
        revision: value.revision,
      };
      setSite(next);
      setSaved(next);
      setCatalog(await catalogResponse.json());
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  async function save() {
    if (!site) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/__help-editor/site", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Help-Editor-Token": token,
        },
        body: JSON.stringify(site),
      });
      const value = await response.json();
      if (!response.ok) throw new Error(value.error);
      setSite(value);
      setSaved(value);
      setNotice("Gespeichert. Die lokale Dokumentation ist aktualisiert.");
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  function reorder(index: number, delta: number) {
    if (!site) return;
    const groups = [...site.groups];
    [groups[index], groups[index + delta]] = [
      groups[index + delta],
      groups[index],
    ];
    setSite({ ...site, groups });
    setNotice("");
  }
  const section = (title: string, description: string, children: ReactNode) => (
    <GlassSettingsSection
      title={title}
      description={description}
      bodyPadding
      className={styles.settingsSection}
    >
      {children}
    </GlassSettingsSection>
  );
  const field = (
    label: string,
    key: "title" | "description" | "footerText",
    help: string,
  ) => (
    <GlassSettingsRow
      label={label}
      description={help}
      htmlFor={`site-${key}`}
      control={
        key !== "description" ? (
          <GlassInput
            id={`site-${key}`}
            className={styles.controlField}
            value={site?.config[key] ?? ""}
            maxLength={key === "title" ? 100 : 200}
            onChange={(e) => update({ [key]: e.target.value })}
          />
        ) : undefined
      }
    >
      {key === "description" && (
        <GlassTextarea
          id={`site-${key}`}
          value={site?.config.description ?? ""}
          rows={3}
          maxLength={500}
          onChange={(e) =>
            update({ description: e.target.value.replace(/[\r\n]+/g, " ") })
          }
        />
      )}
    </GlassSettingsRow>
  );
  return (
    <GlassTooltipProvider>
      <div
        className={`${base.root} ${styles.app} laightup-management`}
        data-mode="day"
        data-theme="light"
        onClickCapture={(event) => {
          const link = (event.target as HTMLElement).closest("a");
          if (dirty && link && !link.target && !busy) {
            event.preventDefault();
            setError(
              "Bitte die Änderungen zuerst speichern oder verwerfen, bevor du die Verwaltung verlässt.",
            );
          }
        }}
      >
        <DocumentTitle
          title="Verwaltung · laightup Hilfebereich"
          withAppName={false}
        >
          <meta name="robots" content="noindex,nofollow" />
          <link
            rel="icon"
            type="image/svg+xml"
            href="/helpcenter/favicon.svg"
          />
        </DocumentTitle>
        <aside className={styles.sidebar}>
          <Link to="/help" className={styles.brand}>
            <img src="/helpcenter/logo.svg" alt="laightup" />
          </Link>
          <div className={styles.scope}>
            <strong>Hilfebereich</strong>
            <span>Website verwalten</span>
          </div>
          <GlassSettingsNav
            aria-label="Website verwalten"
            className={styles.productNav}
          >
            <ul className={styles.mobileNav}>
              <GlassSettingsNavItem
                icon={IconMenu2}
                label={areas.find((a) => a.id === area)?.label}
                aria-label="Verwaltungsnavigation öffnen"
                aria-expanded={mobileNavOpen}
                onClick={() => setMobileNavOpen(!mobileNavOpen)}
              />
            </ul>
            <GlassSettingsNavGroup
              label="Website"
              className={`${styles.navGroup} ${mobileNavOpen ? styles.navGroupOpen : ""}`}
            >
              {areas.map(({ id, label, icon }) => (
                <GlassSettingsNavItem
                  key={id}
                  label={label}
                  icon={icon}
                  active={area === id}
                  onClick={() => {
                    setParams({ bereich: id });
                    setMobileNavOpen(false);
                    setNotice("");
                  }}
                />
              ))}
            </GlassSettingsNavGroup>
          </GlassSettingsNav>
          <div className={styles.sidebarBottom}>
            <Link to="/help/bearbeiten">
              <IconFileText size={16} />
              Zur Redaktion
            </Link>
            <Link to="/help">
              <IconArrowUpRight size={16} />
              Hilfebereich öffnen
            </Link>
            <p>
              <IconLock size={13} />
              Lokale Arbeitsumgebung
            </p>
          </div>
        </aside>
        <main className={styles.main}>
          <div className={styles.breadcrumb}>
            laightup Hilfebereich <span>/</span> Verwaltung
          </div>
          <GlassSettingsPageHeader
            className={`${styles.header} ${area === "struktur" ? styles.structureHeader : ""}`}
            title={areas.find((a) => a.id === area)?.label}
            description={
              {
                allgemein:
                  "Name, Lesefunktionen und Angaben deiner Dokumentation.",
                struktur:
                  "Lege Themen und Seiten an und ordne sie zu einer klaren Hierarchie.",
                urls: "Seitenadressen ändern und bestehende Links erhalten.",
                gestaltung:
                  "Markenfarben und Lesedarstellung deiner Dokumentation.",
                freigaben:
                  "Prüfe eingereichte Änderungen und gib den geprüften Stand frei.",
                berechtigungen:
                  "Zugriff auf die Redaktion und den Hilfebereich.",
                ausbau: "Die nächsten Schritte zur Dokumentationsplattform.",
              }[area]
            }
            actions={
              <>
                {" "}
                {site &&
                  (dirty ||
                    !["berechtigungen", "freigaben", "ausbau"].includes(
                      area,
                    )) && (
                    <div className={styles.save}>
                      <span role="status">
                        {busy
                          ? "Wird gespeichert …"
                          : dirty
                            ? "Ungespeicherte Änderungen"
                            : "Aktueller Stand"}
                      </span>
                      {dirty && (
                        <GlassButton
                          variant="secondary"
                          className={styles.discard}
                          disabled={busy}
                          onClick={() => {
                            setSite(saved);
                            setError("");
                            setNotice("");
                          }}
                        >
                          Verwerfen
                        </GlassButton>
                      )}
                      <GlassButton
                        type="button"
                        disabled={!dirty || busy || !canEditArea}
                        onClick={save}
                      >
                        {busy ? "Prüft …" : "Änderungen speichern"}
                      </GlassButton>
                    </div>
                  )}
              </>
            }
          />
          {error && (
            <div className={styles.error} role="alert">
              {error}{" "}
              <Link
                to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`}
              >
                Zur Anmeldung
              </Link>
              {!site && (
                <GlassButton onClick={load}>Erneut versuchen</GlassButton>
              )}
            </div>
          )}
          {notice && (
            <p className={styles.notice} role="status">
              <IconCheck size={16} />
              {notice}
            </p>
          )}
          {!site ? (
            <p className={styles.loading}>
              {busy
                ? "Einstellungen werden geladen …"
                : error
                  ? ""
                  : "Die Verwaltung benötigt den lokalen Entwicklungsserver."}
            </p>
          ) : (
            <div inert={busy}>
              {readOnlyArea && (
                <p className={styles.intro}>
                  Du kannst diesen Bereich lesen. Deine Rolle erlaubt hier keine
                  Änderungen.
                </p>
              )}
              <fieldset
                disabled={readOnlyArea}
                className={styles.accessFieldset}
              >
                {area === "allgemein" && (
                  <>
                    <p className={styles.intro}>
                      Name, Beschreibung und Lesefunktionen deiner
                      Dokumentation.
                    </p>
                    {section(
                      "Website",
                      "Diese Angaben erscheinen im Browser, in den Metadaten und im Footer.",
                      <>
                        {field(
                          "Website-Titel",
                          "title",
                          "Wird als Titel im Browser-Tab angezeigt.",
                        )}
                        {field(
                          "Beschreibung",
                          "description",
                          "Beschreibung für die Übersicht und Suchmaschinen.",
                        )}
                        {field(
                          "Footer-Text",
                          "footerText",
                          "Die Abschlusszeile unter deiner Dokumentation.",
                        )}
                      </>,
                    )}
                    {section(
                      "Lesefunktionen",
                      "Wähle, welche Werkzeuge deinen Lesern in Anleitungen zur Verfügung stehen.",
                      <>
                        {(
                          [
                            [
                              "showPrint",
                              "Drucken & PDF",
                              "Öffnet den Druckdialog des Browsers.",
                            ],
                            [
                              "showMarkdown",
                              "Markdown-Download",
                              "Bietet die Anleitung als Datei an.",
                            ],
                            [
                              "showFeedback",
                              "Artikelbewertung",
                              "Merkt die Bewertung lokal auf dem Gerät vor; keine zentrale Auswertung.",
                            ],
                          ] as const
                        ).map(([key, label, help]) => (
                          <GlassSettingsRow
                            key={key}
                            label={label}
                            description={help}
                            htmlFor={`setting-${key}`}
                            inline
                            control={
                              <GlassSwitch
                                id={`setting-${key}`}
                                checked={site.config[key]}
                                onCheckedChange={(checked) =>
                                  update({ [key]: checked })
                                }
                              />
                            }
                          />
                        ))}
                      </>,
                    )}
                    <div className={styles.environment}>
                      <IconLock size={17} />
                      <div>
                        <strong>
                          Lokal bearbeiten, bewusst veröffentlichen
                        </strong>
                        <p>
                          Speichern aktualisiert die Projektdateien auf diesem
                          Rechner. Es führt keinen Commit und kein Deployment
                          aus. Der öffentliche Hilfebereich bleibt lesbar; die
                          Verwaltung wird nicht im Produktionsbuild
                          ausgeliefert.
                        </p>
                      </div>
                    </div>
                  </>
                )}
                {area === "urls" && (
                  <UrlManagement
                    key={saved?.revision}
                    pages={site.pages}
                    redirects={site.redirects}
                    onChange={(pages, redirects) => {
                      setSite({ ...site, pages, redirects });
                      setError("");
                      setNotice("");
                    }}
                  />
                )}
                {area === "struktur" && (
                  <>
                    <p className={styles.intro}>
                      Themen benennen und ihre Reihenfolge für die Navigation
                      festlegen. Seiten bearbeiten und zuordnen kannst du in der
                      Redaktion.
                    </p>
                    <StructureEditor
                      groups={site.groups}
                      pages={site.pages}
                      dirty={dirty}
                      onChange={(groups, pages) => {
                        setSite({ ...site, groups, pages });
                        setError("");
                        setNotice("");
                      }}
                      onEdit={async (id) => {
                        if (dirty && !(await save())) return;
                        navigate(`/help/bearbeiten?typ=article&seite=${id}`);
                      }}
                    />
                    <div className={styles.structureSummary}>
                      <strong>Was ist neu?</strong>
                      <span>
                        {catalog?.documents.filter((d) => d.kind === "update")
                          .length ?? 0}{" "}
                        Produktupdates
                      </span>
                      <Link
                        to={`/help/bearbeiten?typ=update&seite=${catalog?.documents.find((d) => d.kind === "update")?.id ?? ""}`}
                      >
                        Zur Redaktion <IconArrowUpRight size={14} />
                      </Link>
                    </div>
                    <p className={styles.footnote}>
                      Produktupdates werden weiterhin ausschließlich aus
                      belegten Releases gepflegt.
                    </p>
                  </>
                )}
                {area === "gestaltung" && (
                  <>
                    <p className={styles.intro}>
                      Markenfarben und Lesedarstellung. Änderungen siehst du in
                      der Vorschau, bevor du sie speicherst.
                    </p>
                    <div className={styles.appearance}>
                      <div className={styles.appearanceForm}>
                        <label>
                          Akzentfarbe
                          <div className={styles.color}>
                            <GlassInput
                              type="color"
                              aria-label="Akzentfarbe wählen"
                              value={site.config.accentColor}
                              onChange={(e) =>
                                update({ accentColor: e.target.value })
                              }
                            />
                            <GlassInput
                              aria-label="Akzentfarbe als Hex-Wert"
                              value={site.config.accentColor}
                              maxLength={7}
                              onChange={(e) =>
                                update({ accentColor: e.target.value })
                              }
                            />
                          </div>
                        </label>
                        <label>
                          Kopfzeilenfarbe
                          <div className={styles.color}>
                            <GlassInput
                              type="color"
                              aria-label="Kopfzeilenfarbe wählen"
                              value={site.config.headerColor}
                              onChange={(e) =>
                                update({ headerColor: e.target.value })
                              }
                            />
                            <GlassInput
                              aria-label="Kopfzeilenfarbe als Hex-Wert"
                              value={site.config.headerColor}
                              maxLength={7}
                              onChange={(e) =>
                                update({ headerColor: e.target.value })
                              }
                            />
                          </div>
                          <small>
                            Beide Farben brauchen mindestens 4,5:1 Kontrast zu
                            Weiß.
                          </small>
                        </label>
                        <label>
                          Schrift
                          <GlassSelect
                            aria-label="Schrift"
                            value={site.config.font}
                            onValueChange={(font) => update({ font })}
                            options={[
                              { value: "geist", label: "Geist · laightup" },
                              { value: "system", label: "Systemschrift" },
                            ]}
                          />
                        </label>
                        <label>
                          Artikelbreite
                          <GlassSelect
                            aria-label="Artikelbreite"
                            value={site.config.contentWidth}
                            onValueChange={(contentWidth) =>
                              update({ contentWidth })
                            }
                            options={[
                              { value: "comfortable", label: "Fokussiert" },
                              { value: "wide", label: "Breit" },
                            ]}
                          />
                        </label>
                        <p className={styles.footnote}>
                          Das laightup-Logo, das Favicon und die Illustrationen
                          bleiben Teil der Markenassets. Die Farbauswahl
                          verändert Navigation und Kopfzeile, keine
                          Originalscreenshots.
                        </p>
                      </div>
                      <div className={styles.previewWrap}>
                        <div className={styles.previewCaption}>
                          Darstellungsvorschau{" "}
                          <span>
                            {dirty
                              ? "Vorschau deiner Änderungen"
                              : "Gespeicherter Stand"}
                          </span>
                        </div>
                        <GlassCard
                          className={styles.preview}
                          style={
                            {
                              "--site-accent": site.config.accentColor,
                              "--site-header": site.config.headerColor,
                              fontFamily:
                                site.config.font === "system"
                                  ? "system-ui, sans-serif"
                                  : "GeistHelp, sans-serif",
                            } as CSSProperties
                          }
                        >
                          <header>
                            <img src="/helpcenter/logo.svg" alt="laightup" />
                            <span>Hilfebereich</span>
                          </header>
                          <nav>
                            <span>Erste Schritte</span>
                            <span>Was ist neu?</span>
                          </nav>
                          <div
                            className={`${styles.previewBody} ${site.config.contentWidth === "wide" ? styles.previewWide : ""}`}
                          >
                            <small>Displays & Standorte</small>
                            <h2>Ein Display mit laightup verbinden</h2>
                            <p>
                              Verbinde deinen Bildschirm und bringe den ersten
                              Inhalt live.
                            </p>
                            <h3>Den Player koppeln</h3>
                            <p>
                              Öffne laightup auf deinem Gerät und verwende den
                              angezeigten Kopplungscode.
                            </p>
                            <a
                              href="/help/display-verbinden"
                              target="_blank"
                              rel="noreferrer"
                            >
                              Vollständige Anleitung öffnen →
                            </a>
                          </div>
                          <footer>{site.config.footerText}</footer>
                        </GlassCard>
                        <Link to="/help/display-verbinden" target="_blank">
                          Gespeicherte Darstellung öffnen
                          <IconArrowUpRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </>
                )}
                {area === "berechtigungen" && <TeamWorkflow view="access" />}
                {area === "freigaben" && <TeamWorkflow view="reviews" />}
                {area === "ausbau" && (
                  <>
                    <p className={styles.intro}>
                      Der Weg vom lokalen Hilfebereich zur eigenständig
                      betriebenen Dokumentationsplattform.
                    </p>
                    <div className={styles.phases}>
                      {phases.map(([n, title, status, description]) => (
                        <section key={n}>
                          <span>{n}</span>
                          <div>
                            <h2>{title}</h2>
                            <p>{description}</p>
                          </div>
                          <strong>{status}</strong>
                        </section>
                      ))}
                    </div>
                  </>
                )}
              </fieldset>
            </div>
          )}
        </main>
      </div>
    </GlassTooltipProvider>
  );
}
