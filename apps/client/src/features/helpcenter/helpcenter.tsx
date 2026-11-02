import redirects from "../../../../../docs/helpcenter/redirects.public.json";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { Link, Navigate, useLocation, useParams } from "react-router-dom";
import { Drawer } from "@mantine/core";
import { useReducedMotion } from "@mantine/hooks";
import {
  IconArrowRight,
  IconPencil,
  IconArrowLeft,
  IconSearch,
  IconMenu2,
  IconSun,
  IconMoon,
  IconCopy,
  IconCheck,
  IconDownload,
  IconPrinter,
  IconRocket,
  IconPalette,
  IconSparkles,
  IconPlaylist,
  IconCalendar,
  IconDeviceTv,
  IconShieldCheck,
  IconLifebuoy,
  IconChevronRight,
  IconSettings,
  IconBraces,
  IconUsers,
  IconBook2,
  IconPlayerPause,
  IconPlayerPlay,
} from "@tabler/icons-react";
import { DocumentTitle } from "@/components/ui/document-title";
import {
  articles,
  groups,
  renderArticle,
  kindLabels,
  helpMessages,
  articleParents,
  guides,
  topicArticles,
} from "./content";
import styles from "./helpcenter.module.css";
import HelpPageTree from "./help-page-tree";
import HelpHome from "./help-home";
import HelpSearch from "./help-search";
import HelpUpdates from "./help-updates";
import LanguageSwitcher from "./language-switcher";
import siteConfig from "../../../../../docs/helpcenter/site.json";
import helpUpdates from "../../../../../docs/helpcenter/updates.json";
import { ArticleGraphic } from "./help-visuals";

const groupIcons = {
  rocket: IconRocket,
  design: IconPalette,
  spark: IconSparkles,
  playlist: IconPlaylist,
  calendar: IconCalendar,
  monitor: IconDeviceTv,
  check: IconShieldCheck,
  help: IconLifebuoy,
  install: IconDownload,
  parameters: IconBraces,
  team: IconUsers,
  settings: IconSettings,
};
const home = "/help";
function safeRead(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeWrite(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Storage may be disabled. */
  }
}

export default function Helpcenter() {
  const { slug, category } = useParams();
  const reducedMotion = useReducedMotion();
  const { pathname, hash, search } = useLocation();
  const redirectTarget = (redirects as Record<string, string>)[
    pathname.replace(/\/$/, "")
  ];
  const isUpdates = slug === "was-ist-neu";
  const isGuides = slug === "guides";
  const isReference = slug === "nachschlagen";
  const article = articles.find((item) => item.slug === slug);
  const group = groups.find((item) => item.id === (category ?? article?.group));
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(
    () => safeRead("laightup-help-theme") === "dark",
  );
  const [motionPaused, setMotionPaused] = useState(
    () => safeRead("laightup-help-motion") === "paused",
  );
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const rendered = useMemo(
    () => (article ? renderArticle(article.markdown) : null),
    [article],
  );
  const sectionStarts = rendered
    ? [...rendered.html.matchAll(/<h2\b[^>]*>/g)]
    : [];
  const visualPosition = article?.visual
    ? (sectionStarts[1]?.index ?? rendered.html.length)
    : rendered?.html.length;
  const articleOpening = rendered?.html.slice(0, visualPosition);
  const articleRemainder = rendered?.html.slice(visualPosition);
  const isGuideArticle = article?.type === "journey";
  const sectionHome = isGuideArticle
    ? "/help/guides"
    : article?.group === "hilfe"
      ? "/help/themen/hilfe"
      : "/help/nachschlagen";
  const sectionTitle = isGuideArticle
    ? "Guides"
    : article?.group === "hilfe"
      ? "Probleme lösen"
      : "Nachschlagen";
  const siblings = isGuideArticle
    ? guides
    : topicArticles(article?.group ?? "");
  const index = siblings.findIndex((item) => item.slug === slug);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
    setCopied(false);
    setCopyError(false);
    setFeedback(slug ? safeRead(`laightup-help-vote-${slug}`) : null);
    if (!hash) window.scrollTo(0, 0);
    else
      requestAnimationFrame(() =>
        document
          .getElementById(decodeURIComponent(hash.slice(1)))
          ?.scrollIntoView(),
      );
  }, [pathname, hash, slug]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const openSearch = () => setSearchOpen(true);
  const sectionLinks = (
    <>
      <Link
        onClick={() => setMenuOpen(false)}
        to={home}
        aria-current={!slug && !category && !hash ? "page" : undefined}
      >
        Übersicht
      </Link>
      <Link
        onClick={() => setMenuOpen(false)}
        to="/help/guides"
        aria-current={
          isGuides || article?.type === "journey" ? "location" : undefined
        }
      >
        Guides
      </Link>
      <Link
        onClick={() => setMenuOpen(false)}
        to="/help/nachschlagen"
        aria-current={
          isReference ||
          (category && category !== "hilfe") ||
          (article &&
            article.type !== "journey" &&
            article.group !== "hilfe") ||
          hash === "#themen"
            ? "location"
            : undefined
        }
      >
        Nachschlagen
      </Link>
      <Link
        onClick={() => setMenuOpen(false)}
        to="/help/themen/hilfe"
        aria-current={
          category === "hilfe" || article?.group === "hilfe"
            ? "page"
            : undefined
        }
      >
        Probleme lösen
      </Link>
      <Link
        onClick={() => setMenuOpen(false)}
        to="/help/was-ist-neu"
        aria-current={isUpdates ? "page" : undefined}
      >
        Was ist neu?
      </Link>
    </>
  );
  const tree = (
    <nav aria-label="Kapitel" className={styles.tree}>
      <div className={styles.sectionLinks}>{sectionLinks}</div>
      <details open={isGuides || isGuideArticle}>
        <summary>
          <IconBook2 size={17} />
          Guides
          <IconChevronRight size={14} />
        </summary>
        <HelpPageTree
          pages={guides}
          currentSlug={slug}
          onNavigate={() => setMenuOpen(false)}
        />
      </details>
      <p className={styles.treeLabel}>Themen zum Nachschlagen</p>
      {groups.map((item, i) => {
        const Icon = groupIcons[item.icon] ?? IconBook2;
        return (
          <details
            key={item.id}
            open={!isGuideArticle && item.id === (category ?? article?.group)}
          >
            <summary>
              <Icon size={17} />
              {item.title}
              <IconChevronRight size={14} />
            </summary>
            <HelpPageTree
              pages={topicArticles(item.id)}
              currentSlug={slug}
              onNavigate={() => setMenuOpen(false)}
            />
          </details>
        );
      })}
    </nav>
  );

  async function copyPage() {
    try {
      await navigator.clipboard.writeText(article.markdown);
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <div
      className={styles.root}
      data-theme={dark ? "dark" : "light"}
      data-content-width={siteConfig.contentWidth}
      style={
        {
          "--violet": dark ? "#b8a5ff" : siteConfig.accentColor,
          "--deep": siteConfig.headerColor,
          fontFamily:
            siteConfig.font === "system"
              ? "system-ui, sans-serif"
              : "GeistHelp, sans-serif",
        } as CSSProperties
      }
      data-motion={motionPaused || reducedMotion ? "paused" : "on"}
    >
      <DocumentTitle title={siteConfig.title} withAppName={false}>
        <link rel="icon" type="image/svg+xml" href="/helpcenter/favicon.svg" />
        <meta
          name="description"
          content={
            isUpdates
              ? "Neuerungen und Verbesserungen in laightup – mit Datum und passenden Anleitungen."
              : (article?.description ?? siteConfig.description)
          }
        />
        <html lang="de" />
        <script type="application/ld+json">
          {JSON.stringify(
            article
              ? {
                  "@context": "https://schema.org",
                  "@type": "TechArticle",
                  headline: article.title,
                  description: article.description,
                  inLanguage: "de",
                  audience: {
                    "@type": "Audience",
                    audienceType: article.audience,
                  },
                  about: group?.title,
                }
              : {
                  "@context": "https://schema.org",
                  "@type": "CollectionPage",
                  name: isUpdates
                    ? "Was ist neu?"
                    : isGuides
                      ? "Guides"
                      : isReference
                        ? "Nachschlagen"
                        : (group?.title ?? "laightup Helpcenter"),
                  inLanguage: "de",
                },
          ).replace(/</g, "\\u003c")}
        </script>
      </DocumentTitle>
      <a href="#help-main" className={styles.skip}>
        Zum Inhalt springen
      </a>
      <header className={styles.header}>
        <div className={styles.topbar}>
          <Link
            to={home}
            className={styles.brand}
            aria-label="laightup Helpcenter Startseite"
          >
            <img src="/helpcenter/logo.svg" alt="laightup" />
            <span>Helpcenter</span>
          </Link>
          <button
            className={styles.headerSearch}
            onClick={openSearch}
            aria-label="Dokumentation durchsuchen"
          >
            <IconSearch size={18} />
            <span>Dokumentation durchsuchen</span>
            <kbd>⌘ K</kbd>
          </button>
          <div className={styles.actions}>
            {import.meta.env.DEV && (
              <Link
                to={`/help/bearbeiten?typ=${isUpdates ? "update" : "article"}&seite=${isUpdates ? helpUpdates[0]?.id : (article?.id ?? "schnellstart")}`}
                className={styles.iconButton}
                aria-label="Dokumentation bearbeiten"
                title="Dokumentation bearbeiten"
              >
                <IconPencil size={18} />
              </Link>
            )}
            <button
              className={styles.iconButton}
              onClick={() => {
                safeWrite(
                  "laightup-help-motion",
                  motionPaused ? "on" : "paused",
                );
                setMotionPaused(!motionPaused);
              }}
              aria-label={
                motionPaused
                  ? "Animationen aktivieren"
                  : "Animationen pausieren"
              }
              aria-pressed={motionPaused}
              title={
                motionPaused
                  ? "Animationen aktivieren"
                  : "Animationen pausieren"
              }
            >
              {motionPaused ? (
                <IconPlayerPlay size={18} />
              ) : (
                <IconPlayerPause size={18} />
              )}
            </button>
            <LanguageSwitcher
              dark={dark}
              motionPaused={motionPaused || reducedMotion}
            />
            <button
              className={styles.iconButton}
              onClick={() => {
                safeWrite("laightup-help-theme", !dark ? "dark" : "light");
                setDark(!dark);
              }}
              aria-label={
                dark ? "Helles Design aktivieren" : "Dunkles Design aktivieren"
              }
            >
              {dark ? <IconSun size={19} /> : <IconMoon size={19} />}
            </button>
            <a href="https://laightup.com" className={styles.website}>
              Zu laightup <IconArrowRight size={15} />
            </a>
            <button
              className={`${styles.iconButton} ${styles.mobileMenu}`}
              onClick={() => setMenuOpen(true)}
              aria-label="Navigation öffnen"
            >
              <IconMenu2 size={21} />
            </button>
          </div>
        </div>
        <nav className={styles.tabs} aria-label="Hilfebereiche">
          {sectionLinks}
        </nav>
      </header>

      {redirectTarget ? (
        <Navigate replace to={`${redirectTarget}${search}${hash}`} />
      ) : !slug && !category && (hash === "#guides" || hash === "#themen") ? (
        <Navigate
          replace
          to={hash === "#guides" ? "/help/guides" : "/help/nachschlagen"}
        />
      ) : isUpdates ? (
        <HelpUpdates />
      ) : isGuides || isReference ? (
        <HelpHome
          key={slug}
          onSearch={openSearch}
          view={isGuides ? "guides" : "reference"}
        />
      ) : !slug && !category ? (
        <HelpHome onSearch={openSearch} />
      ) : category && group ? (
        <div className={styles.articleLayout}>
          <aside className={styles.sidebar}>{tree}</aside>
          <main id="help-main" className={styles.article}>
            <nav
              className={styles.breadcrumbs}
              aria-label="Brotkrümelnavigation"
            >
              <Link to={home}>Helpcenter</Link>
              <IconChevronRight size={13} />
              {group.id !== "hilfe" && (
                <>
                  <Link to="/help/nachschlagen">Nachschlagen</Link>
                  <IconChevronRight size={13} />
                </>
              )}
              <span>{group.title}</span>
            </nav>
            <span className={styles.kicker}>THEMENBEREICH</span>
            <h1>{group.title}</h1>
            <p className={styles.lead}>{group.description}</p>
            <div className={styles.categoryArticles}>
              {topicArticles(group.id).map((entry, i) => (
                <Link key={entry.slug} to={`${home}/${entry.slug}`}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <small className={styles.categoryKind}>
                      {kindLabels[entry.type]}
                    </small>
                    <h2>{entry.title}</h2>
                    <p>{entry.description}</p>
                  </div>
                  <IconArrowRight size={20} />
                </Link>
              ))}
            </div>
            <Link className={styles.categoryBack} to="/help/nachschlagen">
              <IconArrowLeft size={16} /> Zum Nachschlagen
            </Link>
          </main>
          <aside className={styles.toc}>
            <div>
              <IconLifebuoy size={21} />
              <strong>Du suchst etwas Bestimmtes?</strong>
              <button className={styles.categorySearch} onClick={openSearch}>
                Alle Anleitungen durchsuchen
              </button>
            </div>
          </aside>
        </div>
      ) : article ? (
        <div className={styles.articleLayout}>
          <aside className={styles.sidebar}>{tree}</aside>
          <main id="help-main" className={styles.article}>
            <article aria-labelledby="article-title">
              <nav
                className={styles.breadcrumbs}
                aria-label="Brotkrümelnavigation"
              >
                <Link to={home}>Helpcenter</Link>
                <IconChevronRight size={13} />
                <Link to={sectionHome}>{sectionTitle}</Link>
                {!isGuideArticle && article.group !== "hilfe" && (
                  <>
                    <IconChevronRight size={13} />
                    <Link to={`${home}/themen/${group.id}`}>{group.title}</Link>
                  </>
                )}
                {articleParents(article).map((parent) => (
                  <span className={styles.parentCrumb} key={parent.id}>
                    <IconChevronRight size={13} />
                    <Link to={`${home}/${parent.slug}`}>{parent.title}</Link>
                  </span>
                ))}
              </nav>
              <div className={styles.articleToolbar}>
                <span className={styles.articleType}>
                  {kindLabels[article.type].toLocaleUpperCase("de")} ·{" "}
                  {Math.max(
                    1,
                    Math.ceil(article.markdown.split(/\s+/).length / 180),
                  )}{" "}
                  MIN LESEZEIT
                </span>
                <div>
                  <button
                    onClick={copyPage}
                    aria-label="Seite als Markdown kopieren"
                    title="Als Markdown kopieren"
                  >
                    {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                  </button>
                  {siteConfig.showMarkdown && (
                    <a
                      href={`/helpcenter/markdown/${article.slug}.md`}
                      download
                      aria-label="Markdown herunterladen"
                      title="Markdown herunterladen"
                    >
                      <IconDownload size={18} />
                    </a>
                  )}
                  {siteConfig.showPrint && (
                    <button
                      onClick={() => window.print()}
                      aria-label="Seite drucken"
                      title="Drucken"
                    >
                      <IconPrinter size={18} />
                    </button>
                  )}
                </div>
              </div>
              <h1 id="article-title">{article.title}</h1>
              <p className={styles.lead}>{article.description}</p>
              <div className={styles.articleAudience}>
                {article.audience}
                <span>•</span>
                {article.type === "journey"
                  ? `${article.steps.length} aufeinander aufbauende Schritte`
                  : kindLabels[article.type]}
              </div>
              <span className={styles.status} role="status">
                {copied
                  ? "Markdown kopiert."
                  : copyError
                    ? "Kopieren nicht möglich. Nutze den Markdown-Download."
                    : ""}
              </span>
              <div
                className={styles.prose}
                dangerouslySetInnerHTML={{ __html: articleOpening }}
              />
              {article.visual && <ArticleGraphic variant={article.visual} />}
              {articleRemainder && (
                <div
                  className={styles.prose}
                  dangerouslySetInnerHTML={{ __html: articleRemainder }}
                />
              )}
              {articles.some((p) => p.parentId === article.id) && (
                <nav className={styles.childPages} aria-label="Unterseiten">
                  <h2>In diesem Abschnitt</h2>
                  {articles
                    .filter((p) => p.parentId === article.id)
                    .map((child) => (
                      <Link key={child.id} to={`${home}/${child.slug}`}>
                        <div>
                          <strong>{child.title}</strong>
                          <p>{child.description}</p>
                        </div>
                        <IconArrowRight size={18} />
                      </Link>
                    ))}
                </nav>
              )}
              {siteConfig.showFeedback && (
                <div className={styles.feedback}>
                  <span>Hat dir diese Anleitung geholfen?</span>
                  <div>
                    {["Ja", "Teilweise", "Nein"].map((value) => (
                      <button
                        key={value}
                        aria-pressed={feedback === value}
                        onClick={() => {
                          setFeedback(value);
                          safeWrite(`laightup-help-vote-${slug}`, value);
                        }}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                  <small role="status">
                    {feedback
                      ? "Deine Auswahl ist auf diesem Gerät vorgemerkt."
                      : ""}
                  </small>
                </div>
              )}
              <nav className={styles.pageNav} aria-label="Weitere Anleitungen">
                {index > 0 ? (
                  <Link to={`${home}/${siblings[index - 1].slug}`}>
                    <span>
                      <IconArrowLeft size={15} /> Zurück
                    </span>
                    {siblings[index - 1].title}
                  </Link>
                ) : (
                  <Link to={sectionHome}>
                    <span>
                      <IconArrowLeft size={15} /> Zur Übersicht
                    </span>
                    {sectionTitle}
                  </Link>
                )}
                {index < siblings.length - 1 && (
                  <Link to={`${home}/${siblings[index + 1].slug}`}>
                    <span>
                      Weiter <IconArrowRight size={15} />
                    </span>
                    {siblings[index + 1].title}
                  </Link>
                )}
              </nav>
              <p className={styles.contentNote}>
                Aus der laightup-Produktdokumentation abgeleitet · Inhaltsstand
                1. November 2026
              </p>
            </article>
          </main>
          <aside className={styles.toc}>
            <span>AUF DIESER SEITE</span>
            {rendered.headings.map((heading) => (
              <a key={heading.id} href={`#${heading.id}`}>
                {heading.text}
              </a>
            ))}
            <div>
              <IconLifebuoy size={21} />
              <strong>Noch Fragen?</strong>
              <Link to={`${home}/faq`}>
                Häufige Fragen <IconArrowRight size={14} />
              </Link>
            </div>
          </aside>
        </div>
      ) : (
        <main id="help-main" className={styles.notFound}>
          <span>404</span>
          <h1>Diese Anleitung gibt es nicht.</h1>
          <p>
            Über die Übersicht oder die Suche findest du den passenden Einstieg.
          </p>
          <Link to={home}>
            Zur Helpcenter-Übersicht <IconArrowRight size={18} />
          </Link>
          <button onClick={openSearch}>Dokumentation durchsuchen</button>
        </main>
      )}

      <footer className={styles.footer}>
        <Link to={home}>
          laightup <span>Helpcenter</span>
        </Link>
        <span>{siteConfig.footerText}</span>
        <a href="/helpcenter/llms.txt">Für AI-Tools</a>
        <a href="https://laightup.com">
          laightup.com <IconArrowRight size={14} />
        </a>
      </footer>
      <HelpSearch
        opened={searchOpen}
        onClose={() => setSearchOpen(false)}
        dark={dark}
        motionPaused={motionPaused || reducedMotion}
      />

      <Drawer
        opened={menuOpen}
        onClose={() => setMenuOpen(false)}
        title="laightup Helpcenter"
        closeButtonProps={{ "aria-label": "Navigation schließen" }}
        classNames={{
          content: dark ? styles.portalDark : styles.portalLight,
          header: styles.portalHeader,
        }}
        size={320}
        transitionProps={{ duration: motionPaused || reducedMotion ? 0 : 180 }}
      >
        <div
          className={`${styles.root} ${styles.drawerSurface}`}
          data-theme={dark ? "dark" : "light"}
          data-content-width={siteConfig.contentWidth}
          style={
            {
              "--violet": dark ? "#b8a5ff" : siteConfig.accentColor,
              "--deep": siteConfig.headerColor,
              fontFamily:
                siteConfig.font === "system"
                  ? "system-ui, sans-serif"
                  : "GeistHelp, sans-serif",
            } as CSSProperties
          }
        >
          {tree}
        </div>
      </Drawer>
    </div>
  );
}
