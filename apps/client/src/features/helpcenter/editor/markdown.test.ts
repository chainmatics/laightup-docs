import { describe, it, expect } from "vitest";
import { markdownToEditor, editorToMarkdown, previewBody } from "./markdown";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Heading from "@tiptap/extension-heading";
const source =
  "<!-- section: stabiler-anker -->\n## Überschrift\n\nEin **wichtiger** Text mit {{angebot.preis}} und [Anleitung](doc:schnellstart#bevor-du-startest).\n\n| Name | Wert |\n| --- | --- |\n| Preis | 9 € |\n";
describe("visual editing Markdown contract", () => {
  it("preserves anchors, semantic links, formatting, tables and product placeholders", () => {
    const html = markdownToEditor(source);
    expect(html).toContain('data-section-id="stabiler-anker"');
    expect(html).toContain('href="doc:schnellstart#bevor-du-startest"');
    const result = editorToMarkdown(html);
    expect(result).toContain(
      "<!-- section: stabiler-anker -->\n## Überschrift",
    );
    expect(result).toContain("**wichtiger**");
    expect(result).toContain("{{angebot.preis}}");
    expect(result).toContain("(doc:schnellstart#bevor-du-startest)");
    expect(result).toContain("| Preis | 9 € |");
  });
  it("does not shift an existing anchor onto an inserted unmarked heading", () => {
    const html = markdownToEditor("## Neu\n\n" + source);
    const dom = document.createElement("div");
    dom.innerHTML = html;
    expect(
      dom.querySelectorAll("h2")[0].getAttribute("data-section-id"),
    ).toBeNull();
    expect(dom.querySelectorAll("h2")[1].getAttribute("data-section-id")).toBe(
      "stabiler-anker",
    );
  });
  it("keeps doc links through the actual Tiptap schema and resolves them only for preview", () => {
    const editor = new Editor({
      extensions: [
        StarterKit.configure({
          heading: false,
          link: { protocols: ["doc"], openOnClick: false },
        }),
        Heading.extend({
          addAttributes() {
            return {
              sectionId: {
                default: null,
                parseHTML: (el) => el.getAttribute("data-section-id"),
                renderHTML: (attrs) =>
                  attrs.sectionId ? { "data-section-id": attrs.sectionId } : {},
              },
            };
          },
        }),
      ],
      content: markdownToEditor(source),
    });
    expect(editorToMarkdown(editor.getHTML())).toContain(
      "(doc:schnellstart#bevor-du-startest)",
    );
    editor.destroy();
    expect(
      previewBody("[Text](doc:stable#anchor)", [
        { id: "stable", slug: "translated-slug" },
      ]),
    ).toBe("[Text](/help/translated-slug#anchor)");
  });
  it("removes executable HTML and JavaScript links in both directions", () => {
    const html = markdownToEditor(
      '<script>alert(1)</script>\n\n[bad](javascript:alert(1))\n\n<img src="x" onerror="alert(1)">',
    );
    expect(html).not.toMatch(/<script|onerror|href="javascript/);
    expect(
      editorToMarkdown('<p><a href="javascript:alert(1)">bad</a></p>'),
    ).not.toContain("javascript:");
  });
});

it("preserves table headers and row counts through the real visual schema", async () => {
  const { TableKit } = await import("@tiptap/extension-table");
  const editor = new Editor({
    extensions: [StarterKit.configure({ trailingNode: false }), TableKit],
    content: markdownToEditor(
      "| Standort | Inhalt |\n| --- | --- |\n| Berlin | Sommer |\n",
    ),
  });
  const output = editorToMarkdown(editor.getHTML());
  expect(output).toMatch(/\| Standort \| Inhalt \|/);
  const element = document.createElement("div");
  element.innerHTML = markdownToEditor(output);
  expect(element.querySelectorAll("tr")).toHaveLength(2);
  expect(element.querySelector("th")?.textContent).toBe("Standort");
  editor.destroy();
});
