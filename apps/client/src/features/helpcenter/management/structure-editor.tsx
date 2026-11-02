import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ArrowDown,
  ArrowUp,
  CornerDownRight,
  FileText,
  Folder,
  FolderPlus,
  Pencil,
  Plus,
  X,
  MoveRight,
} from "lucide-react";
import {
  descendants,
  movePage,
  orderedPages,
  shiftPage,
  validateStructure,
} from "../../../../../../docs/helpcenter/lib/structure.mjs";
import {
  GlassButton,
  GlassCard,
  GlassIconButton,
  GlassInput,
  GlassSelect,
  GlassTextarea,
} from "./laightup-ui";
import styles from "./structure-editor.module.css";
export type StructureGroup = {
  id: string;
  title: string;
  description?: string;
};
export type StructurePage = {
  slug?: string;
  id: string;
  title: string;
  group: string;
  parentId: string | null;
  status: "draft" | "published";
};
type Props = {
  groups: StructureGroup[];
  pages: StructurePage[];
  onChange: (groups: StructureGroup[], pages: StructurePage[]) => void;
  onEdit: (id: string) => void;
  dirty: boolean;
};
type Form = {
  kind: "group" | "page" | "move";
  title: string;
  description: string;
  group: string;
  parentId: string | null;
  id?: string;
  beforeId: string | null;
};
const makeId = (title: string) =>
  `${
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ß/g, "ss")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 45) || "seite"
  }-${crypto.randomUUID().slice(0, 8)}`;
export default function StructureEditor({
  groups,
  pages,
  onChange,
  onEdit,
  dirty,
}: Props) {
  const formRef = useRef<HTMLDivElement>(null);
  const [openVersion, setOpenVersion] = useState(0);
  useEffect(() => {
    if (!formRef.current) return;
    formRef.current.scrollIntoView({ block: "start" });
    formRef.current
      .querySelector<HTMLElement>("input,button[aria-haspopup]")
      ?.focus({ preventScroll: true });
  }, [openVersion]);
  const [form, setForm] = useState<Form | null>(null),
    [error, setError] = useState("");
  const ordered = orderedPages(groups, pages) as (StructurePage & {
    depth: number;
  })[];
  function open(
    kind: Form["kind"],
    group = groups[0]?.id ?? "",
    parentId: string | null = null,
    id?: string,
  ) {
    const page = pages.find((p) => p.id === id);
    setError("");
    setOpenVersion((value) => value + 1);
    setForm({
      kind,
      title: page?.title ?? "",
      description: "",
      group: page?.group ?? group,
      parentId: page?.parentId ?? parentId,
      id,
      beforeId: null,
    });
  }
  function change(next: StructurePage[], nextGroups = groups) {
    try {
      validateStructure(nextGroups, next);
      onChange(nextGroups, next);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!form) return;
    try {
      if (form.kind === "group") {
        const next = [
          ...groups,
          {
            id: makeId(form.title),
            title: form.title.trim(),
            description: form.description.trim(),
          },
        ];
        validateStructure(next, pages);
        onChange(next, pages);
      } else if (form.kind === "page") {
        const page: StructurePage = {
          id: makeId(form.title),
          title: form.title.trim(),
          group: form.group,
          parentId: form.parentId,
          status: "draft",
        };
        const next = orderedPages(groups, [...pages, page]).map(
          ({ depth, ...p }) => p,
        );
        onChange(groups, next);
      } else
        onChange(
          groups,
          movePage(groups, pages, form.id, {
            group: form.group,
            parentId: form.parentId,
            beforeId: form.beforeId,
          }),
        );
      setForm(null);
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  const moving = pages.find((p) => p.id === form?.id);
  const branch = form?.id
    ? new Set([form.id, ...descendants(pages, form.id)])
    : new Set();
  const movingDepth = ordered.find((p) => p.id === moving?.id)?.depth ?? 0;
  const branchHeight = Math.max(
    0,
    ...ordered
      .filter((p) => branch.has(p.id))
      .map((p) => p.depth - movingDepth),
  );
  const parentOptions = form
    ? ordered.filter(
        (p) =>
          p.group === form.group &&
          !branch.has(p.id) &&
          p.depth + 1 + branchHeight <= 2 &&
          (moving?.status !== "published" || p.status === "published"),
      )
    : [];
  const siblingOptions = form
    ? pages.filter(
        (p) =>
          p.group === form.group &&
          p.parentId === form.parentId &&
          !branch.has(p.id),
      )
    : [];
  function row(page: StructurePage & { depth: number }) {
    const siblings = ordered.filter(
      (p) => p.group === page.group && p.parentId === page.parentId,
    );
    const index = siblings.findIndex((p) => p.id === page.id);
    return (
      <li
        key={page.id}
        className={styles.page}
        style={{ "--page-depth": page.depth } as React.CSSProperties}
      >
        <div className={styles.pageRow}>
          <FileText size={16} className={styles.pageIcon} />
          <div className={styles.pageTitle}>
            <span>{page.title}</span>
            {page.status === "draft" && <small>Entwurf</small>}
          </div>
          <div className={styles.pageActions}>
            <GlassIconButton
              size="sm"
              aria-label={`${page.title} nach oben`}
              disabled={index === 0}
              onClick={() => change(shiftPage(groups, pages, page.id, -1))}
            >
              <ArrowUp size={14} />
            </GlassIconButton>
            <GlassIconButton
              size="sm"
              aria-label={`${page.title} nach unten`}
              disabled={index === siblings.length - 1}
              onClick={() => change(shiftPage(groups, pages, page.id, 1))}
            >
              <ArrowDown size={14} />
            </GlassIconButton>
            <GlassIconButton
              size="sm"
              aria-label={`${page.title} verschieben`}
              title="Seite mit Unterseiten verschieben"
              onClick={() => open("move", page.group, page.parentId, page.id)}
            >
              <MoveRight size={15} />
            </GlassIconButton>
            <GlassIconButton
              size="sm"
              aria-label={`Unterseite zu ${page.title} anlegen`}
              disabled={page.depth >= 2}
              title={
                page.depth >= 2 ? "Maximal drei Ebenen" : "Unterseite anlegen"
              }
              onClick={() => open("page", page.group, page.id)}
            >
              <CornerDownRight size={15} />
            </GlassIconButton>
            <GlassIconButton
              size="sm"
              aria-label={`${dirty ? "Speichern und bearbeiten: " : "Bearbeiten: "}${page.title}`}
              title={
                dirty
                  ? "Struktur speichern und Inhalt bearbeiten"
                  : "Inhalt bearbeiten"
              }
              onClick={() => onEdit(page.id)}
            >
              <Pencil size={14} />
            </GlassIconButton>
          </div>
        </div>
      </li>
    );
  }
  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <div>
          <strong>Inhaltsstruktur</strong>
          <span>
            {groups.length} Themen · {pages.length} Seiten ·{" "}
            {pages.filter((p) => p.status === "draft").length} unveröffentlicht
          </span>
        </div>
        <GlassButton
          variant="secondary"
          size="sm"
          onClick={() => open("group")}
        >
          <FolderPlus size={15} />
          Neues Thema
        </GlassButton>
        <GlassButton
          size="sm"
          disabled={!groups.length}
          onClick={() => open("page")}
        >
          <Plus size={15} />
          Neue Seite
        </GlassButton>
      </div>
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}
      {form && (
        <GlassCard
          className={styles.formCard}
          ref={formRef}
          role="region"
          aria-label={
            form.kind === "group"
              ? "Thema anlegen"
              : form.kind === "page"
                ? "Seite anlegen"
                : "Seite verschieben"
          }
        >
          <form
            onSubmit={submit}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setForm(null);
                setError("");
              }
            }}
          >
            <header>
              <h2>
                {form.kind === "group"
                  ? "Neues Thema"
                  : form.kind === "page"
                    ? form.parentId
                      ? "Neue Unterseite"
                      : "Neue Seite"
                    : `„${form.title}“ verschieben`}
              </h2>
              <GlassIconButton
                aria-label="Strukturformular schließen"
                onClick={() => {
                  setForm(null);
                  setError("");
                }}
                type="button"
              >
                <X size={16} />
              </GlassIconButton>
            </header>
            {form.kind !== "move" && (
              <GlassInput
                label={form.kind === "group" ? "Themenname" : "Seitentitel"}
                autoFocus
                required
                maxLength={form.kind === "group" ? 80 : 180}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            )}
            {form.kind === "group" ? (
              <label>
                Beschreibung
                <GlassTextarea
                  rows={2}
                  maxLength={500}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </label>
            ) : (
              <>
                <label>
                  Zielthema
                  <GlassSelect
                    aria-label="Zielthema"
                    value={form.group}
                    onValueChange={(group) =>
                      setForm({
                        ...form,
                        group,
                        parentId: null,
                        beforeId: null,
                      })
                    }
                    options={groups.map((g) => ({
                      value: g.id,
                      label: g.title,
                    }))}
                  />
                </label>
                <label>
                  Übergeordnete Seite
                  <GlassSelect
                    aria-label="Übergeordnete Seite"
                    searchable
                    searchPlaceholder="Seite finden …"
                    noResultsMessage="Keine passende Seite"
                    value={form.parentId ?? "__root"}
                    onValueChange={(value) =>
                      setForm({
                        ...form,
                        parentId: value === "__root" ? null : value,
                        beforeId: null,
                      })
                    }
                    options={[
                      { value: "__root", label: "Direkt im Thema" },
                      ...parentOptions.map((p) => ({
                        value: p.id,
                        label: `${"↳ ".repeat(p.depth)}${p.title}`,
                      })),
                    ]}
                  />
                </label>
                {form.kind === "move" && (
                  <label>
                    Position
                    <GlassSelect
                      aria-label="Position"
                      value={form.beforeId ?? "__end"}
                      onValueChange={(value) =>
                        setForm({
                          ...form,
                          beforeId: value === "__end" ? null : value,
                        })
                      }
                      options={[
                        ...siblingOptions.map((p) => ({
                          value: p.id,
                          label: `Vor „${p.title}“`,
                        })),
                        { value: "__end", label: "Am Ende dieser Ebene" },
                      ]}
                    />
                  </label>
                )}
                <p>
                  {form.kind === "move"
                    ? "Alle Unterseiten werden mit verschoben. Die Seitenadressen bleiben gleich."
                    : "Die neue Seite wird als Entwurf gespeichert. Inhalt und Freigabe bearbeitest du anschließend in der Redaktion."}
                </p>
              </>
            )}
            <footer>
              <GlassButton
                variant="secondary"
                type="button"
                onClick={() => {
                  setForm(null);
                  setError("");
                }}
              >
                Abbrechen
              </GlassButton>
              <GlassButton
                type="submit"
                disabled={form.kind !== "move" && !form.title.trim()}
              >
                {form.kind === "move"
                  ? "Verschieben"
                  : "Zur Struktur hinzufügen"}
              </GlassButton>
            </footer>
          </form>
        </GlassCard>
      )}
      <div className={styles.groups}>
        {groups.map((group, index) => {
          const children = ordered.filter((p) => p.group === group.id);
          return (
            <GlassCard key={group.id} className={styles.topic}>
              <details
                open={
                  !children.length || children.some((p) => p.status === "draft")
                }
              >
                <summary>
                  <Folder size={18} />
                  <strong>{group.title}</strong>
                  <span>
                    {children.length}{" "}
                    {children.length === 1 ? "Seite" : "Seiten"}
                  </span>
                </summary>
                <div className={styles.groupSettings}>
                  <GlassInput
                    label="Themenname"
                    aria-label={`Themenname: ${group.title}`}
                    value={group.title}
                    maxLength={80}
                    onChange={(e) =>
                      onChange(
                        groups.map((g) =>
                          g.id === group.id
                            ? { ...g, title: e.target.value }
                            : g,
                        ),
                        pages,
                      )
                    }
                  />
                  <div className={styles.groupActions}>
                    <GlassIconButton
                      aria-label={`${group.title} nach oben`}
                      disabled={index === 0}
                      onClick={() => {
                        const next = [...groups];
                        [next[index - 1], next[index]] = [
                          next[index],
                          next[index - 1],
                        ];
                        onChange(next, pages);
                      }}
                    >
                      <ArrowUp size={16} />
                    </GlassIconButton>
                    <GlassIconButton
                      aria-label={`${group.title} nach unten`}
                      disabled={index === groups.length - 1}
                      onClick={() => {
                        const next = [...groups];
                        [next[index + 1], next[index]] = [
                          next[index],
                          next[index + 1],
                        ];
                        onChange(next, pages);
                      }}
                    >
                      <ArrowDown size={16} />
                    </GlassIconButton>
                    <GlassButton
                      variant="secondary"
                      size="sm"
                      onClick={() => open("page", group.id)}
                    >
                      <Plus size={14} />
                      Seite anlegen
                    </GlassButton>
                  </div>
                </div>
                <label className={styles.groupDescription}>
                  Themenbeschreibung
                  <GlassInput
                    aria-label={`Beschreibung: ${group.title}`}
                    value={group.description ?? ""}
                    maxLength={500}
                    onChange={(e) =>
                      onChange(
                        groups.map((g) =>
                          g.id === group.id
                            ? { ...g, description: e.target.value }
                            : g,
                        ),
                        pages,
                      )
                    }
                  />
                </label>
                {children.length ? (
                  <ul className={styles.pages}>{children.map(row)}</ul>
                ) : (
                  <div className={styles.empty}>
                    Noch keine Seiten. Lege die erste Anleitung in diesem Thema
                    an.
                  </div>
                )}
              </details>
            </GlassCard>
          );
        })}
      </div>
      <p className={styles.hint}>
        Neue und leere Themen erscheinen erst im Hilfebereich, wenn sie
        freigegebene Seiten enthalten. Bis zu drei Seitenebenen; gespeicherte
        Kennungen und URLs bleiben erhalten.
      </p>
    </div>
  );
}
