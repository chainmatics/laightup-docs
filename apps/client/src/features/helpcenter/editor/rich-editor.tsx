import { useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import GlobalDragHandle from "@/features/editor/extensions/drag-handle";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import { TextSelection } from "@tiptap/pm/state";
import { Fragment } from "@tiptap/pm/model";
import {
  IconBold,
  IconItalic,
  IconStrikethrough,
  IconLink,
  IconPhoto,
  IconPlus,
  IconArrowUp,
  IconArrowDown,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconH2,
  IconList,
  IconQuote,
  IconCode,
  IconTable,
  IconX,
  IconSearch,
  IconListNumbers,
  IconH3,
  IconTypography,
  IconGripVertical,
  IconUpload,
} from "@tabler/icons-react";
import { headingId } from "../content";
import { markdownToEditor, editorToMarkdown } from "./markdown";
import styles from "./editor.module.css";
const StableHeading = Heading.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      sectionId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-section-id"),
        renderHTML: (attrs) =>
          attrs.sectionId ? { "data-section-id": attrs.sectionId } : {},
      },
    };
  },
});
export default function RichEditor({
  value,
  onChange,
  links,
  onUpload,
}: {
  value: string;
  onChange: (value: string) => void;
  links: { id: string; title: string }[];
  onUpload: (file: File) => Promise<string>;
}) {
  const [palette, setPalette] = useState(false),
    [filter, setFilter] = useState(""),
    [index, setIndex] = useState(0),
    [insert, setInsert] = useState<"link" | "image" | null>(null),
    [address, setAddress] = useState(""),
    [alt, setAlt] = useState("");
  const wrapper = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const dragState = useRef<{
    from: number;
    to: number;
    startY: number;
    moved: boolean;
  } | null>(null);
  const [dropMarker, setDropMarker] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [paletteStyle, setPaletteStyle] = useState<{
    top: number;
    left: number;
    maxHeight: number;
  }>({ top: 52, left: 0, maxHeight: 440 });
  const [uploading, setUploading] = useState(false),
    [uploadError, setUploadError] = useState("");
  const openPalette = (view: any) => {
    const rect = wrapper.current?.getBoundingClientRect(),
      cursor = view.coordsAtPos(view.state.selection.from);
    if (rect) {
      const below = window.innerHeight - cursor.bottom - 25;
      const height = Math.min(
        440,
        Math.max(160, below >= 240 ? below : cursor.top - 90),
      );
      setPaletteStyle({
        top:
          below >= 240
            ? cursor.bottom - rect.top + 8
            : Math.max(0, cursor.top - rect.top - height - 8),
        left: Math.max(0, Math.min(cursor.left - rect.left, rect.width - 300)),
        maxHeight: height,
      });
    }
    setPalette(true);
    setFilter("");
    setIndex(0);
  };
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        trailingNode: false,
        link: {
          openOnClick: false,
          protocols: ["doc"],
          HTMLAttributes: { target: null, rel: null },
        },
      }),
      StableHeading.configure({ levels: [2, 3] }),
      Image.configure({ allowBase64: false }),
      TableKit,
      GlobalDragHandle.configure({
        dragHandleSelector: "#help-editor-drag",
        scrollThreshold: 65,
      }),
    ],
    content: markdownToEditor(value),
    editorProps: {
      attributes: {
        "aria-label": "Artikelinhalt",
        role: "textbox",
        "aria-multiline": "true",
      },
      handleKeyDown(_view, event) {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key.toLowerCase() === "k"
        ) {
          event.preventDefault();
          setAddress(editor.getAttributes("link").href ?? "");
          setInsert("link");
          return true;
        }
        if (
          event.key === "/" &&
          _view.state.selection.$from.parent.type.name === "paragraph" &&
          !_view.state.selection.$from.parent.textContent
        ) {
          event.preventDefault();
          openPalette(_view);
          return true;
        }
        return false;
      },
    },
    onUpdate({ editor }) {
      const used = new Set<string>();
      const tr = editor.state.tr;
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name !== "heading" || node.attrs.level !== 2) return;
        let id = node.attrs.sectionId;
        if (!id || used.has(id)) {
          id = `${headingId(node.textContent) || "abschnitt"}-${crypto.randomUUID().slice(0, 8)}`;
          tr.setNodeMarkup(pos, undefined, { ...node.attrs, sectionId: id });
        }
        used.add(id);
      });
      if (tr.docChanged) {
        editor.view.dispatch(tr);
        return;
      }
      onChange(editorToMarkdown(editor.getHTML()));
    },
  });
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e?.isActive("bold"),
      italic: e?.isActive("italic"),
      strike: e?.isActive("strike"),
      heading: e?.isActive("heading", { level: 2 }),
      list: e?.isActive("bulletList"),
      quote: e?.isActive("blockquote"),
      undo: e?.can().undo(),
      redo: e?.can().redo(),
      table: e?.isActive("table"),
    }),
  });
  if (!editor) return null;
  const tool = (
    label: string,
    Icon: any,
    run: () => void,
    pressed?: boolean,
    disabled = false,
  ) => (
    <button
      key={label}
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
    >
      <Icon size={17} stroke={1.6} />
    </button>
  );
  const reorder = (i: number, to: number) => {
    const { state, view } = editor;
    const nodes: any[] = [];
    state.doc.forEach((node) => nodes.push(node));
    if (to < 0 || to >= nodes.length || i === to || !nodes[i]) return;
    const [moving] = nodes.splice(i, 1);
    nodes.splice(to, 0, moving);
    const tr = state.tr.replaceWith(
      0,
      state.doc.content.size,
      Fragment.fromArray(nodes),
    );
    let pos = 1;
    for (let n = 0; n < to; n++) pos += nodes[n].nodeSize;
    tr.setSelection(
      TextSelection.near(tr.doc.resolve(Math.min(pos, tr.doc.content.size))),
    );
    view.dispatch(tr);
    editor.commands.focus();
  };
  const move = (direction: number) => {
    const index = editor.state.selection.$from.index(0);
    reorder(index, index + direction);
  };
  const blocks = [
    {
      label: "Text",
      hint: "Ein einfacher Absatz",
      Icon: IconTypography,
      run: () => editor.chain().focus().setParagraph().run(),
    },
    {
      label: "Überschrift",
      hint: "Neuer Hauptabschnitt",
      Icon: IconH2,
      run: () => editor.chain().focus().setHeading({ level: 2 }).run(),
    },
    {
      label: "Zwischenüberschrift",
      hint: "Ein Abschnitt im Abschnitt",
      Icon: IconH3,
      run: () => editor.chain().focus().setHeading({ level: 3 }).run(),
    },
    {
      label: "Aufzählung",
      hint: "Punkte übersichtlich sammeln",
      Icon: IconList,
      run: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "Schrittfolge",
      hint: "Eine nummerierte Anleitung",
      Icon: IconListNumbers,
      run: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "Hinweis",
      hint: "Eine wichtige Information hervorheben",
      Icon: IconQuote,
      run: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      label: "Codeblock",
      hint: "Befehle und Beispiele",
      Icon: IconCode,
      run: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      label: "Tabelle",
      hint: "Informationen vergleichen",
      Icon: IconTable,
      run: () =>
        editor
          .chain()
          .focus()
          .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
          .run(),
    },
    {
      label: "Bild",
      hint: "Screenshot mit Alternativtext",
      Icon: IconPhoto,
      run: () => {
        setAddress("");
        setAlt("");
        setInsert("image");
      },
    },
  ];
  const matches = blocks.filter((b) =>
    b.label.toLowerCase().includes(filter.toLowerCase()),
  );
  const runBlock = (i: number) => {
    matches[i]?.run();
    setPalette(false);
  };
  const valid = /^(https?:\/\/|\/helpcenter\/)/i.test(address);
  return (
    <div className={styles.richWrap} ref={wrapper}>
      <div
        className={styles.toolbar}
        role="toolbar"
        aria-label="Text formatieren"
      >
        {tool("Block einfügen", IconPlus, () => {
          if (palette) setPalette(false);
          else {
            const { state, view } = editor;
            const cursor = state.selection.$from;
            const top = cursor.depth
              ? cursor.node(1)
              : state.doc.nodeAt(cursor.pos);
            if (top?.type.name !== "paragraph" || top.content.size) {
              const pos = cursor.depth
                ? cursor.after(1)
                : cursor.pos + (top?.nodeSize ?? 0);
              const tr = state.tr.insert(
                pos,
                state.schema.nodes.paragraph.create(),
              );
              tr.setSelection(TextSelection.create(tr.doc, pos + 1));
              view.dispatch(tr);
            }
            openPalette(editor.view);
          }
        })}
        <span />
        {tool(
          "Fett",
          IconBold,
          () => editor.chain().focus().toggleBold().run(),
          active?.bold,
        )}
        {tool(
          "Kursiv",
          IconItalic,
          () => editor.chain().focus().toggleItalic().run(),
          active?.italic,
        )}
        {tool(
          "Durchgestrichen",
          IconStrikethrough,
          () => editor.chain().focus().toggleStrike().run(),
          active?.strike,
        )}
        <span />
        {tool(
          "Überschrift",
          IconH2,
          () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          active?.heading,
        )}
        {tool(
          "Aufzählung",
          IconList,
          () => editor.chain().focus().toggleBulletList().run(),
          active?.list,
        )}
        {tool(
          "Hinweis",
          IconQuote,
          () => editor.chain().focus().toggleBlockquote().run(),
          active?.quote,
        )}
        {tool("Link einfügen", IconLink, () => {
          setInsert("link");
          setAddress(editor.getAttributes("link").href ?? "");
        })}
        {tool("Bild einfügen", IconPhoto, () => {
          setInsert("image");
          setAddress("");
          setAlt("");
        })}
        <span />
        {tool("Block nach oben", IconArrowUp, () => move(-1))}
        {tool("Block nach unten", IconArrowDown, () => move(1))}
        <span />
        {tool(
          "Rückgängig",
          IconArrowBackUp,
          () => editor.chain().focus().undo().run(),
          undefined,
          !active?.undo,
        )}
        {tool(
          "Wiederholen",
          IconArrowForwardUp,
          () => editor.chain().focus().redo().run(),
          undefined,
          !active?.redo,
        )}
      </div>
      {palette && (
        <div
          className={styles.palette}
          style={paletteStyle}
          role="dialog"
          aria-label="Block einfügen"
        >
          <div className={styles.paletteSearch}>
            <IconSearch size={16} />
            <input
              autoFocus
              placeholder="Block suchen …"
              aria-label="Blocktyp suchen"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value);
                setIndex(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setPalette(false);
                  editor.commands.focus();
                }
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setIndex(Math.min(index + 1, matches.length - 1));
                }
                if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setIndex(Math.max(index - 1, 0));
                }
                if (e.key === "Enter") {
                  e.preventDefault();
                  runBlock(index);
                }
              }}
            />
            <button
              onClick={() => setPalette(false)}
              aria-label="Blockauswahl schließen"
            >
              <IconX size={15} />
            </button>
          </div>
          {matches.map((b, i) => (
            <button
              key={b.label}
              className={i === index ? styles.selected : ""}
              onClick={() => runBlock(i)}
            >
              <b.Icon size={20} stroke={1.4} />
              <span>
                {b.label}
                <small>{b.hint}</small>
              </span>
            </button>
          ))}
        </div>
      )}
      {insert && (
        <div
          className={styles.insertPanel}
          role="dialog"
          aria-label={insert === "link" ? "Link einfügen" : "Bild einfügen"}
        >
          <div className={styles.panelTitle}>
            <strong>
              {insert === "link"
                ? "Link einfügen"
                : "Original-Screenshot einfügen"}
            </strong>
            <button
              onClick={() => setInsert(null)}
              aria-label="Einfügen schließen"
            >
              <IconX size={16} />
            </button>
          </div>
          {insert === "image" && (
            <>
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className={styles.fileInput}
                aria-label="Screenshot-Datei"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  setUploadError("");
                  try {
                    setAddress(await onUpload(file));
                    if (!alt) setAlt(file.name.replace(/\.[^.]+$/, ""));
                  } catch (error) {
                    setUploadError(error.message);
                  } finally {
                    setUploading(false);
                    e.target.value = "";
                  }
                }}
              />
              <button
                className={styles.uploadImage}
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
              >
                <IconUpload size={16} />
                {uploading ? "Lädt …" : "Screenshot hochladen"}
              </button>
              <small className={styles.uploadHint}>
                PNG, JPG oder WebP · bis 5 MB · lokal gespeichert
              </small>
              {uploadError && (
                <p role="alert" className={styles.uploadError}>
                  {uploadError}
                </p>
              )}
            </>
          )}
          <input
            autoFocus
            aria-label={insert === "link" ? "Linkadresse" : "Bildadresse"}
            placeholder={
              insert === "link"
                ? "https://… oder Anleitung wählen"
                : "/helpcenter/images/… oder https://…"
            }
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          {insert === "image" && (
            <input
              aria-label="Alternativtext"
              placeholder="Was zeigt das Bild?"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
            />
          )}
          {insert === "link" && (
            <div className={styles.linkChoices}>
              {links
                .filter((l) =>
                  l.title.toLowerCase().includes(address.toLowerCase()),
                )
                .slice(0, 7)
                .map((l) => (
                  <button
                    key={l.id}
                    onClick={() => {
                      const href = `doc:${l.id}`;
                      if (editor.state.selection.empty)
                        editor
                          .chain()
                          .focus()
                          .insertContent({
                            type: "text",
                            text: l.title,
                            marks: [{ type: "link", attrs: { href } }],
                          })
                          .run();
                      else editor.chain().focus().setLink({ href }).run();
                      setInsert(null);
                    }}
                  >
                    {l.title}
                  </button>
                ))}
            </div>
          )}
          <button
            className={styles.primary}
            disabled={
              insert === "image"
                ? !valid || !alt.trim()
                : !/^(https?:\/\/|doc:)/i.test(address)
            }
            onClick={() => {
              if (insert === "image")
                editor.chain().focus().setImage({ src: address, alt }).run();
              else
                editor
                  .chain()
                  .focus()
                  .extendMarkRange("link")
                  .setLink({ href: address })
                  .run();
              setInsert(null);
            }}
          >
            Einfügen
          </button>
        </div>
      )}
      <BubbleMenu
        editor={editor}
        updateDelay={80}
        options={{ placement: "top", offset: 9 }}
        className={styles.bubble}
        shouldShow={({ state }) =>
          !state.selection.empty && !palette && !insert
        }
      >
        {tool(
          "Auswahl fett",
          IconBold,
          () => editor.chain().focus().toggleBold().run(),
          active?.bold,
        )}
        {tool(
          "Auswahl kursiv",
          IconItalic,
          () => editor.chain().focus().toggleItalic().run(),
          active?.italic,
        )}
        {tool(
          "Auswahl durchstreichen",
          IconStrikethrough,
          () => editor.chain().focus().toggleStrike().run(),
          active?.strike,
        )}
        <span />
        {tool("Auswahl verlinken", IconLink, () => {
          setAddress(editor.getAttributes("link").href ?? "");
          setInsert("link");
        })}
      </BubbleMenu>
      {active?.table && (
        <div
          className={styles.tableTools}
          role="toolbar"
          aria-label="Tabelle bearbeiten"
        >
          <button onClick={() => editor.chain().focus().addRowAfter().run()}>
            + Zeile
          </button>
          <button onClick={() => editor.chain().focus().addColumnAfter().run()}>
            + Spalte
          </button>
          <button onClick={() => editor.chain().focus().deleteRow().run()}>
            Zeile entfernen
          </button>
          <button onClick={() => editor.chain().focus().deleteTable().run()}>
            Tabelle entfernen
          </button>
        </div>
      )}
      <div
        id="help-editor-drag"
        className={styles.dragHandle}
        role="button"
        tabIndex={0}
        aria-label="Block verschieben"
        title="Block ziehen · mit Pfeiltasten verschieben"
        onDragStart={(e) => e.preventDefault()}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          e.currentTarget.draggable = false;
          const rect = e.currentTarget.getBoundingClientRect();
          const hit = editor.view.posAtCoords({
            left: rect.right + 70,
            top: rect.top + 8,
          });
          if (!hit) return;
          const from = editor.state.doc.resolve(hit.pos).index(0);
          dragState.current = {
            from,
            to: from,
            startY: e.clientY,
            moved: false,
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const drag = dragState.current;
          if (!drag) return;
          if (Math.abs(e.clientY - drag.startY) < 4 && !drag.moved) return;
          drag.moved = true;
          const scroll = wrapper.current?.closest("[data-editor-scroll]");
          if (scroll instanceof HTMLElement) {
            const r = scroll.getBoundingClientRect();
            if (e.clientY < r.top + 35) scroll.scrollTop -= 12;
            if (e.clientY > r.bottom - 35) scroll.scrollTop += 12;
          }
          const bounds: DOMRect[] = [];
          editor.state.doc.forEach((_node, pos) => {
            const dom = editor.view.nodeDOM(pos);
            if (dom instanceof HTMLElement)
              bounds.push(dom.getBoundingClientRect());
          });
          let slot = bounds.findIndex(
            (rect) => e.clientY < rect.top + rect.height / 2,
          );
          if (slot < 0) slot = bounds.length;
          drag.to = slot > drag.from ? slot - 1 : slot;
          const box = editor.view.dom.getBoundingClientRect();
          const top =
            slot < bounds.length
              ? bounds[slot].top
              : bounds[bounds.length - 1]?.bottom;
          if (top !== undefined)
            setDropMarker({ top: top - 3, left: box.left, width: box.width });
        }}
        onPointerUp={(e) => {
          const drag = dragState.current;
          dragState.current = null;
          setDropMarker(null);
          editor.view.dragging = null;
          if (e.currentTarget.hasPointerCapture(e.pointerId))
            e.currentTarget.releasePointerCapture(e.pointerId);
          if (drag?.moved) reorder(drag.from, drag.to);
        }}
        onPointerCancel={() => {
          dragState.current = null;
          setDropMarker(null);
          editor.view.dragging = null;
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            move(-1);
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            move(1);
          }
        }}
      >
        <IconGripVertical size={16} />
      </div>
      {dropMarker && (
        <div
          className={styles.dropMarker}
          style={dropMarker}
          aria-hidden="true"
        />
      )}
      <EditorContent editor={editor} className={styles.rich} />
      <div className={styles.editorHint}>
        Schreibe los oder drücke <kbd>/</kbd> für einen neuen Block.
      </div>
    </div>
  );
}
