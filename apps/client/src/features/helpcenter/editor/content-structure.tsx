import { useEffect, useState } from "react";
import {
  IconArrowUpRight,
  IconBook2,
  IconChevronDown,
  IconFileText,
  IconFolder,
  IconLayoutGrid,
  IconPlus,
  IconSparkles,
} from "@tabler/icons-react";
import type { EditorCatalog, EditorDocument } from "./editor-types";
import styles from "./editor.module.css";

type Props = {
  catalog: EditorCatalog | null;
  selected: EditorDocument | null;
  filter: string;
  overview: boolean;
  onOverview: () => void;
  onSelect: (kind: "article" | "update", id: string) => void;
  onCreate: (group: string) => void;
};
export function ContentNavigation({
  catalog,
  selected,
  filter,
  overview,
  onOverview,
  onSelect,
  onCreate,
}: Props) {
  const [section, setSection] = useState<"article" | "update">("article");
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["start"]));
  useEffect(() => {
    if (!selected) return;
    setSection(selected.kind);
    setExpanded((old) => new Set([...old, selected.group]));
  }, [selected?.id, selected?.kind, selected?.group]);
  const all = catalog?.documents ?? [];
  const query = filter.trim().toLocaleLowerCase("de");
  const entries = all.filter((d) =>
    d.title.toLocaleLowerCase("de").includes(query),
  );
  const visible = entries.filter((d) => query || d.kind === section);
  const page = (d: EditorCatalog["documents"][number]) => (
    <button
      key={`${d.kind}-${d.id}`}
      className={
        !overview && selected?.id === d.id && selected?.kind === d.kind
          ? styles.current
          : ""
      }
      aria-current={
        !overview && selected?.id === d.id && selected?.kind === d.kind
          ? "page"
          : undefined
      }
      style={{
        paddingLeft:
          12 +
          (() => {
            let depth = 0,
              id = d.parentId;
            while (id && depth < 3) {
              depth++;
              id = all.find((p) => p.id === id)?.parentId;
            }
            return depth;
          })() *
            16,
      }}
      onClick={() => onSelect(d.kind, d.id)}
    >
      <IconFileText size={14} />
      <span>{d.title}</span>
      {d.hasDraft && <i title="Gespeicherter Entwurf" />}
      {d.isNew && <small>Neu</small>}
      {d.isDraft && <small>Entwurf</small>}
    </button>
  );
  return (
    <nav aria-label="Seiten bearbeiten" className={styles.structureNav}>
      <button
        className={`${styles.overviewLink} ${overview ? styles.overviewSelected : ""}`}
        onClick={onOverview}
        aria-current={overview ? "page" : undefined}
      >
        <IconLayoutGrid size={16} />
        Inhaltsübersicht
      </button>
      <div
        className={styles.sectionSwitch}
        role="tablist"
        aria-label="Inhaltsbereich"
      >
        <button
          role="tab"
          aria-selected={section === "article"}
          onClick={() => setSection("article")}
        >
          <IconBook2 size={14} />
          Anleitungen
          <span>{all.filter((d) => d.kind === "article").length}</span>
        </button>
        <button
          role="tab"
          aria-selected={section === "update"}
          onClick={() => setSection("update")}
        >
          <IconSparkles size={14} />
          Produktnews
          <span>{all.filter((d) => d.kind === "update").length}</span>
        </button>
      </div>
      {(section === "article" || query) &&
        catalog?.groups.map((group) => {
          const pages = visible.filter(
            (d) => d.kind === "article" && d.group === group.id,
          );
          if (!pages.length) return null;
          const open = !!query || expanded.has(group.id);
          return (
            <div className={styles.navGroup} key={group.id}>
              <div className={styles.groupRow}>
                <button
                  className={styles.groupToggle}
                  aria-expanded={open}
                  aria-controls={`editor-group-${group.id}`}
                  onClick={() =>
                    setExpanded((old) => {
                      const next = new Set(old);
                      next.has(group.id)
                        ? next.delete(group.id)
                        : next.add(group.id);
                      return next;
                    })
                  }
                >
                  <IconChevronDown size={13} />
                  <IconFolder size={14} />
                  <span>{group.title}</span>
                  <small>{pages.length}</small>
                </button>
                <button
                  className={styles.groupAdd}
                  aria-label={`Neue Seite in ${group.title}`}
                  title="Neue Anleitung in diesem Thema"
                  onClick={() => onCreate(group.id)}
                >
                  <IconPlus size={13} />
                </button>
              </div>
              {open && (
                <div
                  className={styles.pageBranch}
                  id={`editor-group-${group.id}`}
                >
                  {pages.map(page)}
                </div>
              )}
            </div>
          );
        })}
      {(section === "update" || query) &&
        visible.some((d) => d.kind === "update") && (
          <div className={styles.navGroup}>
            {query && <p>Produktnews</p>}
            {visible.filter((d) => d.kind === "update").map(page)}
          </div>
        )}
      {!visible.length && (
        <p className={styles.structureEmpty}>
          Keine Seite gefunden. Probiere einen anderen Suchbegriff.
        </p>
      )}
    </nav>
  );
}
export function ContentOverview({
  catalog,
  onSelect,
  onCreate,
}: Pick<Props, "catalog" | "onSelect" | "onCreate">) {
  const docs = catalog?.documents ?? [];
  return (
    <div className={styles.structureCanvas}>
      <header className={styles.structureHeader}>
        <span>LAIGHTUP HILFEBEREICH</span>
        <h1>Deine Dokumentation</h1>
        <p>
          Vom ersten Display bis zum fertigen Sendeplan. Hier findest du alle
          Themen und die passenden Anleitungen an einem Ort.
        </p>
        <div>
          <span>
            <IconBook2 size={15} />
            {docs.filter((d) => d.kind === "article").length} Anleitungen
          </span>
          <span>
            <IconFolder size={15} />
            {catalog?.groups.length ?? 0} Themen
          </span>
          <span>
            <IconSparkles size={15} />
            {docs.filter((d) => d.kind === "update").length} Produktupdates
          </span>
        </div>
      </header>
      <div className={styles.structureGrid}>
        {catalog?.groups.map((group) => {
          const pages = docs.filter(
            (d) => d.kind === "article" && d.group === group.id,
          );
          return (
            <section
              className={styles.structureCard}
              key={group.id}
              aria-label={group.title}
            >
              <header>
                <span className={styles.folderIcon}>
                  <IconFolder size={20} stroke={1.4} />
                </span>
                <span>
                  {pages.length}{" "}
                  {pages.length === 1 ? "Anleitung" : "Anleitungen"}
                </span>
                <button
                  aria-label={`Neue Seite in ${group.title}`}
                  title="Anleitung hinzufügen"
                  onClick={() => onCreate(group.id)}
                >
                  <IconPlus size={16} />
                </button>
              </header>
              <h2>{group.title}</h2>
              <ul>
                {pages.map((d) => (
                  <li key={d.id}>
                    <button onClick={() => onSelect(d.kind, d.id)}>
                      <span>{d.title}</span>
                      {d.hasDraft && <i title="Gespeicherter Entwurf" />}
                      <IconArrowUpRight size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <section className={styles.newsIndex}>
        <header>
          <IconSparkles size={18} />
          <h2>Was ist neu?</h2>
          <span>Produktupdates</span>
        </header>
        <p>
          Neue Funktionen und Verbesserungen, die bei deinen Nutzern ankommen.
        </p>
        <div>
          {docs
            .filter((d) => d.kind === "update")
            .map((d) => (
              <button key={d.id} onClick={() => onSelect(d.kind, d.id)}>
                <span>{d.title}</span>
                <IconArrowUpRight size={15} />
              </button>
            ))}
        </div>
      </section>
    </div>
  );
}
