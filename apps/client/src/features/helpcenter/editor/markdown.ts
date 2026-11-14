import { Marked } from "marked";
import DOMPurify from "dompurify";
import * as TurndownModule from "@joplin/turndown";
import * as Gfm from "@joplin/turndown-plugin-gfm";
import { headingId } from "../content";
const sanitizeOptions = {
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|doc):|\/|#|\.{1,2}\/)/i,
};
const Turndown = (TurndownModule as any).default || TurndownModule;
export function markdownToEditor(markdown: string) {
  const ids = [
    ...markdown.matchAll(/^(?:<!-- section: ([a-z0-9-]+) -->\n)?## .+$/gm),
  ].map((match) => match[1]);
  let index = 0;
  const parser = new Marked({
    renderer: {
      heading({ tokens, depth }) {
        const id = depth === 2 ? ids[index++] : null;
        return `<h${depth}${id ? ` data-section-id="${id}"` : ""}>${this.parser.parseInline(tokens)}</h${depth}>`;
      },
    },
  });
  return DOMPurify.sanitize(
    parser.parse(markdown, { async: false }) as string,
    sanitizeOptions,
  );
}
export function editorToMarkdown(html: string) {
  const container = document.createElement("div");
  container.innerHTML = DOMPurify.sanitize(html, sanitizeOptions);
  // Column sizing is editor metadata. Remove it before GFM detects the header row.
  container.querySelectorAll("colgroup").forEach((node) => node.remove());
  const reserved = new Set(
    [...container.querySelectorAll("h2[data-section-id]")].map((el) =>
      el.getAttribute("data-section-id"),
    ),
  );
  const converter = new Turndown({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });
  converter.use([Gfm.tables, Gfm.strikethrough, Gfm.highlightedCodeBlock]);
  converter.addRule("stable-section", {
    filter: "h2",
    replacement(content, _node) {
      const node = _node as HTMLElement;
      let id = node.dataset.sectionId;
      if (!id) {
        const base = headingId(node.textContent || "abschnitt") || "abschnitt";
        id = base;
        for (let n = 2; reserved.has(id); n++) id = `${base}-${n}`;
        reserved.add(id);
        node.dataset.sectionId = id;
      }
      return `\n\n<!-- section: ${id} -->\n## ${content.replace(/^(\d+)\\\./, "$1.")}\n\n`;
    },
  });
  return converter.turndown(container).trim() + "\n";
}
export function previewBody(
  markdown: string,
  links: { id: string; slug: string }[],
) {
  return markdown.replace(
    /\]\(doc:([^#)]+)(#[^)]*)?\)/g,
    (_, id, anchor = "") =>
      `](/help/${links.find((item) => item.id === id)?.slug ?? id}${anchor})`,
  );
}
