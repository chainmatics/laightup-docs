import { useState } from "react";
import { Link } from "react-router-dom";
import {
  IconArrowRight,
  IconArrowUpRight,
  IconBuildingStore,
  IconBulb,
  IconLifebuoy,
  IconSearch,
  IconSparkles,
  IconUsers,
} from "@tabler/icons-react";
import {
  referenceGroups,
  topicArticles,
  helpMessages,
  guides,
} from "./content";
import { NetworkGraphic } from "./help-visuals";
import { CardArtwork, TopicArtwork } from "./card-artwork";
import styles from "./experience.module.css";

const tasks = [
  {
    slug: "usecase-standort",
    label: helpMessages.home.tasks["usecase-standort"].label,
    role: helpMessages.home.tasks["usecase-standort"].role,
    description: helpMessages.home.tasks["usecase-standort"].description,
    icon: IconBuildingStore,
    accent: "teal",
    time: helpMessages.home.tasks["usecase-standort"].time,
    art: "site" as const,
  },
  {
    slug: "usecase-kampagne",
    label: helpMessages.home.tasks["usecase-kampagne"].label,
    role: helpMessages.home.tasks["usecase-kampagne"].role,
    description: helpMessages.home.tasks["usecase-kampagne"].description,
    icon: IconSparkles,
    accent: "purple",
    time: helpMessages.home.tasks["usecase-kampagne"].time,
    art: "campaign" as const,
  },
  {
    slug: "usecase-lokalisierung",
    label: helpMessages.home.tasks["usecase-lokalisierung"].label,
    role: helpMessages.home.tasks["usecase-lokalisierung"].role,
    description: helpMessages.home.tasks["usecase-lokalisierung"].description,
    icon: IconBulb,
    accent: "blue",
    time: helpMessages.home.tasks["usecase-lokalisierung"].time,
    art: "local" as const,
  },
  {
    slug: "usecase-team",
    label: helpMessages.home.tasks["usecase-team"].label,
    role: helpMessages.home.tasks["usecase-team"].role,
    description: helpMessages.home.tasks["usecase-team"].description,
    icon: IconUsers,
    accent: "rose",
    time: helpMessages.home.tasks["usecase-team"].time,
    art: "team" as const,
  },
];
const sections = [
  {
    title: "Guides",
    description:
      "Ein Vorhaben umsetzen – vom ersten Display bis zur Kampagne in allen Filialen.",
    to: "/help/guides",
    topic: "start",
    action: "Guides entdecken",
  },
  {
    title: "Nachschlagen",
    description:
      "Funktionen, Begriffe und Einstellungen von laightup im Detail verstehen.",
    to: "/help/nachschlagen",
    topic: "inhalte",
    action: "Themen durchstöbern",
  },
  {
    title: "Probleme lösen",
    description:
      "Fehler bei der Ausspielung eingrenzen und Antworten auf häufige Fragen finden.",
    to: "/help/themen/hilfe",
    topic: "hilfe",
    action: "Antworten finden",
  },
  {
    title: "Was ist neu?",
    description:
      "Neuerungen und Verbesserungen kennenlernen – mit den passenden Anleitungen.",
    to: "/help/was-ist-neu",
    topic: "ki",
    action: "Neuerungen ansehen",
  },
];

export default function HelpHome({
  onSearch,
  view = "home",
}: {
  onSearch: () => void;
  view?: "home" | "guides" | "reference";
}) {
  const [audience, setAudience] = useState("Alle Aufgaben");
  const visible = tasks
    .map((task) => ({
      ...task,
      slug:
        guides.find((article) => article.id === task.slug)?.slug ?? task.slug,
    }))
    .filter((task) => audience === "Alle Aufgaben" || task.role === audience);
  const SectionHeading = view === "home" ? "h2" : "h1";
  return (
    <main id="help-main" className={styles.experienceHome}>
      {view === "home" && (
        <section className={styles.heroStage} aria-labelledby="welcome-title">
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <span className={styles.overline}>DEIN LAIGHTUP HELPCENTER</span>
              <h1 id="welcome-title">
                Was hast du
                <br />
                <em>heute vor?</em>
              </h1>
              <p>
                Vom ersten Display bis zur Kampagne in allen Filialen. Hier
                findest du den passenden Weg.
              </p>
              <button className={styles.largeSearch} onClick={onSearch}>
                <IconSearch size={21} />
                <span>Anleitungen, Aufgaben und Antworten finden</span>
                <span className={styles.searchEnter}>
                  <IconArrowRight size={18} />
                </span>
              </button>
              <div className={styles.heroSuggestions}>
                <span>Direkt zu</span>
                <Link to="/help/installation">Installation</Link>
                <Link to="/help/parameter-platzhalter">Parameter</Link>
                <Link to="/help/inhalt-fehlt">Fehlersuche</Link>
              </div>
            </div>
            <NetworkGraphic />
          </div>
        </section>
      )}
      {view === "home" && (
        <section
          className={styles.categoryHub}
          aria-labelledby="help-categories"
        >
          <div className={styles.sectionIntro}>
            <div>
              <h2 id="help-categories">Wie können wir dir helfen?</h2>
              <p>Wähle den Bereich, der zu deinem Anliegen passt.</p>
            </div>
          </div>
          <div className={styles.categoryGrid}>
            {sections.map((section) => (
              <Link key={section.to} to={section.to}>
                <TopicArtwork topic={section.topic} />
                <div>
                  <h3>{section.title}</h3>
                  <p>{section.description}</p>
                  <span>
                    {section.action} <IconArrowRight size={17} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      {view === "guides" && (
        <section
          id="guides"
          className={styles.taskSection}
          aria-labelledby="task-title"
        >
          <div className={styles.sectionIntro}>
            <div>
              <span className={styles.eyebrow}>LOSLEGEN</span>
              <Link to="/help" className={styles.backToHome}>
                Helpcenter
              </Link>
              <SectionHeading id="task-title">Guides</SectionHeading>
              <p>
                Schritt für Schritt zum Ziel: Wähle dein Vorhaben und folge
                einem Guide.
              </p>
            </div>
          </div>
          <div
            className={styles.audienceFilters}
            role="group"
            aria-label="Aufgaben nach Team filtern"
          >
            {[
              "Alle Aufgaben",
              "Standortbetrieb",
              "Content-Team",
              "Administration",
            ].map((label) => (
              <button
                key={label}
                aria-pressed={audience === label}
                onClick={() => setAudience(label)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className={styles.taskGrid} data-count={visible.length}>
            {visible.map((task, i) => {
              return (
                <Link
                  key={task.slug}
                  to={`/help/${task.slug}`}
                  className={styles.taskCard}
                  data-accent={task.accent}
                >
                  <CardArtwork kind={task.art} />
                  <div className={styles.taskCardBody}>
                    <div className={styles.taskCardTop}>
                      <span>{task.role}</span>
                      <IconArrowUpRight size={19} />
                    </div>
                    <h3>{task.label}</h3>
                    <p>{task.description}</p>
                    <div className={styles.taskCardBottom}>
                      <span>{task.time}</span>
                      <span>
                        Guide öffnen <IconArrowRight size={15} />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <span className={styles.srOnly} role="status">
            {visible.length} passende Guides
          </span>
        </section>
      )}
      {view === "reference" && (
        <section
          id="themen"
          className={styles.topicSection}
          aria-labelledby="library-title"
        >
          <div className={styles.sectionIntro}>
            <div>
              <span className={styles.eyebrow}>GEZIELT NACHSCHLAGEN</span>
              <Link to="/help" className={styles.backToHome}>
                Helpcenter
              </Link>
              <SectionHeading id="library-title">Nachschlagen</SectionHeading>
              <p>
                Funktionen und Einstellungen im Detail – nach Themen geordnet.
              </p>
            </div>
          </div>
          <div className={styles.topicGrid}>
            {referenceGroups.map((group) => (
              <Link to={`/help/themen/${group.id}`} key={group.id}>
                <TopicArtwork topic={group.id} />
                <div className={styles.topicCopy}>
                  <h3>{group.title}</h3>
                  <p>{group.description}</p>
                  <div className={styles.topicMeta}>
                    <span>
                      {topicArticles(group.id).length}{" "}
                      {topicArticles(group.id).length === 1
                        ? "Beitrag"
                        : "Beiträge"}
                    </span>
                    <IconArrowRight size={16} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      {view !== "home" && (
        <section className={styles.supportBand}>
          <div className={styles.supportOrb}>
            <IconLifebuoy size={36} stroke={1.3} />
          </div>
          <div>
            <span className={styles.overline}>WENN ES MAL HAKT</span>
            <h2>Probleme lösen</h2>
            <p>Fehler eingrenzen und Antworten auf häufige Fragen finden.</p>
          </div>
          <Link to="/help/themen/hilfe">
            Hilfe finden <IconArrowRight size={18} />
          </Link>
        </section>
      )}
    </main>
  );
}
