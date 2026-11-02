import { Marked } from "marked";
import DOMPurify from "dompurify";
import catalog from "../../../../../docs/helpcenter/catalog.json";
import messages from "../../../../../docs/helpcenter/messages.json";

const files = import.meta.glob<string>(
  "../../../../../docs/helpcenter/content/*.md",
  {
    query: "?raw",
    import: "default",
    eager: true,
  },
);
export const kindLabels = messages.kindLabels;
export const helpMessages = messages;

export const groups = catalog.groups;
export const articles = catalog.articles.map((article) => ({
  ...article,
  parentId: (article as { parentId?: string }).parentId ?? null,
  markdown: files[`../../../../../docs/helpcenter/content/${article.slug}.md`],
}));
export type Article = (typeof articles)[number];
export const guides = articles.filter((article) => article.type === "journey");
export const referenceArticles = articles.filter(
  (article) => article.type !== "journey" && article.group !== "hilfe",
);
export const referenceGroups = groups.filter((group) =>
  referenceArticles.some((article) => article.group === group.id),
);
export function topicArticles(groupId: string) {
  return articles.filter(
    (article) => article.group === groupId && article.type !== "journey",
  );
}

export function articleParents(article: Article) {
  const result: Article[] = [];
  let id = article.parentId;
  while (id && result.length < 3) {
    const parent = articles.find((p) => p.id === id);
    if (!parent) break;
    result.unshift(parent);
    id = parent.parentId;
  }
  return result;
}
export function headingId(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
export function renderArticle(markdown: string) {
  const headings: { id: string; text: string }[] = [];
  const sectionIds = [
    ...markdown.matchAll(/^<!-- section: ([a-z0-9-]+) -->\n## /gm),
  ].map((match) => match[1]);
  let sectionIndex = 0;
  const parser = new Marked({
    renderer: {
      heading({ tokens, depth, text }) {
        if (depth === 1) return "";
        const base =
          depth === 2
            ? (sectionIds[sectionIndex++] ?? headingId(text))
            : headingId(text);
        let id = base;
        for (let n = 2; headings.some((heading) => heading.id === id); n++)
          id = `${base}-${n}`;
        if (depth === 2) headings.push({ id, text });
        return `<h${depth} id="${id}">${this.parser.parseInline(tokens)}</h${depth}>`;
      },
    },
  });
  const html = DOMPurify.sanitize(
    parser.parse(markdown.replace(/^# [^\n]+\n\n[^\n]+\n/, ""), {
      async: false,
    }) as string,
  );
  const template = document.createElement("template");
  template.innerHTML = html;
  template.content.querySelectorAll("table").forEach((table) => {
    table.setAttribute("role", "table");
    const labels = [...table.querySelectorAll("thead th")].map(
      (cell) => cell.textContent ?? "",
    );
    table
      .querySelectorAll("tr")
      .forEach((row) => row.setAttribute("role", "row"));
    table
      .querySelectorAll("th")
      .forEach((cell) => cell.setAttribute("role", "columnheader"));
    table.querySelectorAll("tbody tr").forEach((row) => {
      row.querySelectorAll("td").forEach((cell, index) => {
        cell.setAttribute("role", "cell");
        cell.dataset.label = labels[index] ?? "";
      });
    });
  });
  return { html: template.innerHTML, headings };
}
const normalize = (value: string) =>
  value
    .toLocaleLowerCase("de")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss");
const synonyms: Record<string, string> = messages.searchSynonyms;
export function searchArticles(query: string) {
  const terms = normalize(query)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((term) => synonyms[term] ?? term);
  if (!terms.length) return [];
  return articles
    .map((article) => {
      const title = normalize(article.title);
      const body = normalize(
        `${article.description} ${article.markdown} ${article.group} ${article.tags.join(" ")} ${article.audience}`,
      ).replace(/\bai\b/g, "ki");
      const description = normalize(article.description);
      const metadata = normalize(article.tags.join(" "));
      const score = terms.reduce(
        (sum, term) =>
          sum +
          (title.includes(term) ? 8 : 0) +
          (description.includes(term) ? 4 : 0) +
          (metadata.includes(term) ? 3 : 0) +
          (body.includes(term) ? 1 : 0),
        0,
      );
      return {
        article,
        score,
        matches: terms.every(
          (term) => title.includes(term) || body.includes(term),
        ),
      };
    })
    .filter((result) => result.matches)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.article);
}

export function formatHelpMessage(
  template: string,
  values: Record<string, string | number>,
) {
  return template.replace(/\{([a-zA-Z][a-zA-Z0-9_]*)\}/g, (match, key) =>
    key in values ? String(values[key]) : match,
  );
}
