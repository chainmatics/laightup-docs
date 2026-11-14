import { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "@mantine/core";
import { Link, useNavigate } from "react-router-dom";
import {
  IconArrowRight,
  IconBook2,
  IconChevronRight,
  IconCornerDownLeft,
  IconRoute,
  IconSearch,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import { articles, groups, searchArticles } from "./content";
import styles from "./search.module.css";
import { kindLabels } from "./content";

function Highlight({ text, query }: { text: string; query: string }) {
  const term = query.trim();
  if (!term) return <>{text}</>;
  const index = text
    .toLocaleLowerCase("de")
    .indexOf(term.toLocaleLowerCase("de"));
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + term.length)}</mark>
      {text.slice(index + term.length)}
    </>
  );
}
export default function HelpSearch({
  opened,
  onClose,
  dark,
  motionPaused,
}: {
  opened: boolean;
  onClose: () => void;
  dark: boolean;
  motionPaused: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (opened) {
      setQuery("");
      setFilter("all");
      setActive(0);
    }
  }, [opened]);
  const allMatches = useMemo(() => searchArticles(query), [query]);
  const results = useMemo(
    () => allMatches.filter((a) => filter === "all" || a.type === filter),
    [allMatches, filter],
  );
  useEffect(() => {
    setActive(0);
  }, [query, filter]);
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);
  const choose = (slug: string) => {
    onClose();
    navigate(`/help/${slug}`);
  };
  return (
    <Modal
      opened={opened}
      transitionProps={{ duration: motionPaused ? 0 : 160, transition: "pop" }}
      onClose={onClose}
      size={760}
      centered
      padding={0}
      withCloseButton={false}
      overlayProps={{ backgroundOpacity: 0.45, blur: 5 }}
      classNames={{ content: styles.dialog, body: styles.body }}
      aria-label="Helpcenter durchsuchen"
    >
      <div className={styles.surface} data-theme={dark ? "dark" : "light"}>
        <div className={styles.searchTop}>
          <span className={styles.searchGlyph}>
            <IconSearch size={23} stroke={1.6} />
          </span>
          <div>
            <label htmlFor="help-query">WAS MÖCHTEST DU WISSEN?</label>
            <input
              id="help-query"
              data-autofocus
              role="combobox"
              aria-expanded={Boolean(query.trim())}
              aria-controls={query.trim() ? "help-search-results" : undefined}
              aria-activedescendant={
                query.trim() && results.length
                  ? `help-result-${active}`
                  : undefined
              }
              aria-autocomplete="list"
              placeholder="Zum Beispiel: Display registrieren"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) =>
                    Math.max(
                      0,
                      Math.min(
                        results.length - 1,
                        i + (e.key === "ArrowDown" ? 1 : -1),
                      ),
                    ),
                  );
                }
                if (e.key === "Enter" && results[active]) {
                  e.preventDefault();
                  choose(results[active].slug);
                }
              }}
            />
          </div>
          {query && (
            <button
              className={styles.clear}
              onClick={() => setQuery("")}
              aria-label="Suchbegriff löschen"
            >
              <IconX size={16} />
            </button>
          )}
          <button
            className={styles.escape}
            onClick={onClose}
            aria-label="Suche schließen"
          >
            esc
          </button>
        </div>
        {!query.trim() ? (
          <div className={styles.discovery}>
            <div>
              <div className={styles.discoveryLabel}>
                <IconRoute size={16} /> BELIEBTE AUFGABEN
              </div>
              {[
                "usecase-standort",
                "usecase-lokalisierung",
                "usecase-kampagne",
              ].map((slug) => {
                const a = articles.find((entry) => entry.slug === slug);
                return (
                  <Link
                    key={slug}
                    to={`/help/${slug}`}
                    onClick={onClose}
                    className={styles.discoveryTask}
                  >
                    <span>
                      <IconArrowRight size={16} />
                    </span>
                    <div>
                      <strong>
                        <Highlight text={a.title} query={query} />
                      </strong>
                      <small>{a.description}</small>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className={styles.discoveryTopics}>
              <div className={styles.discoveryLabel}>
                <IconBook2 size={16} /> DIREKT ZUM THEMA
              </div>
              {[
                "installation",
                "display-verbinden",
                "standort-anlegen",
                "parameter-platzhalter",
                "einstellungen-ueberblick",
              ].map((slug) => {
                const a = articles.find((entry) => entry.slug === slug);
                return (
                  <Link key={slug} to={`/help/${slug}`} onClick={onClose}>
                    {a.title}
                    <IconChevronRight size={14} />
                  </Link>
                );
              })}
            </div>
            <div className={styles.discoveryTip}>
              <IconSparkles size={17} />
              <span>
                Beschreibe dein Vorhaben. Die Suche findet Anleitungen auch über
                ihren Inhalt.
              </span>
            </div>
          </div>
        ) : (
          <>
            <div
              className={styles.filters}
              role="group"
              aria-label="Suchergebnisse filtern"
            >
              {[
                ["all", "Alle"],
                ["guide", "Anleitungen"],
                ["journey", "Lernpfade"],
                ["reference", "Nachschlagen"],
              ].map(([key, label]) => (
                <button
                  key={key}
                  aria-pressed={filter === key}
                  onClick={() => setFilter(key)}
                >
                  {label}
                  <span>
                    {
                      (key === "all"
                        ? allMatches
                        : allMatches.filter((a) => a.type === key)
                      ).length
                    }
                  </span>
                </button>
              ))}
            </div>
            <div className={styles.resultSummary} role="status">
              {results.length
                ? `${results.length} passende ${results.length === 1 ? "Antwort" : "Antworten"}`
                : "Keine passenden Ergebnisse"}
              <span>Suche in {articles.length} Inhalten</span>
            </div>
            <div
              id="help-search-results"
              ref={listRef}
              className={styles.results}
              role="listbox"
              aria-label="Suchergebnisse"
            >
              {results.length ? (
                results.map((a, i) => (
                  <Link
                    id={`help-result-${i}`}
                    data-index={i}
                    key={a.slug}
                    to={`/help/${a.slug}`}
                    role="option"
                    aria-selected={active === i}
                    onMouseEnter={() => setActive(i)}
                    onClick={onClose}
                    className={styles.result}
                  >
                    <span className={styles.resultIcon}>
                      {a.type === "journey" ? (
                        <IconRoute size={21} stroke={1.5} />
                      ) : (
                        <IconBook2 size={21} stroke={1.5} />
                      )}
                    </span>
                    <div className={styles.resultCopy}>
                      <div className={styles.resultMeta}>
                        {groups.find((g) => g.id === a.group)?.title}
                        <i />
                        {kindLabels[a.type]}
                      </div>
                      <strong>
                        <Highlight text={a.title} query={query} />
                      </strong>
                      <p>
                        <Highlight text={a.description} query={query} />
                      </p>
                    </div>
                    <IconCornerDownLeft className={styles.enter} size={17} />
                  </Link>
                ))
              ) : (
                <div className={styles.empty}>
                  <span>
                    <IconSearch size={31} stroke={1.2} />
                  </span>
                  <h3>Versuchen wir es anders.</h3>
                  <p>
                    Ein kurzer Begriff reicht oft aus.
                    <br />
                    Probiere „Platzhalter“, „Standort“ oder „Registrierung“.
                  </p>
                  <button
                    onClick={() => {
                      setQuery("");
                      setFilter("all");
                    }}
                  >
                    Beliebte Aufgaben ansehen <IconArrowRight size={15} />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
        <div className={styles.searchFooter}>
          <span>
            {query.trim() ? (
              <>
                <kbd>↑</kbd>
                <kbd>↓</kbd> auswählen <kbd>↵</kbd> öffnen
              </>
            ) : (
              "Wähle einen Einstieg oder starte mit einem Suchbegriff."
            )}
          </span>
          <span>
            laightup <b>Wissen</b>
          </span>
        </div>
      </div>
    </Modal>
  );
}
