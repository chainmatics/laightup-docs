import { describe, expect, it } from "vitest";
import { articles, groups, renderArticle, searchArticles } from "./content";

describe("helpcenter content", () => {
  it("finds complete instructions by task, terminology and German spelling", () => {
    expect(searchArticles("Display verbinden")[0].slug).toBe(
      "display-verbinden",
    );
    expect(
      searchArticles("Pairing").some((a) => a.slug === "display-verbinden"),
    ).toBe(true);
    expect(
      searchArticles("Playout").some((a) => a.group === "sendeplaene"),
    ).toBe(true);
    expect(
      searchArticles("Freigabe").some((a) => a.slug === "versionen-freigeben"),
    ).toBe(true);
    expect(searchArticles("AI").some((a) => a.slug === "easy-flow")).toBe(true);
    expect(searchArticles("  ")).toEqual([]);
    expect(searchArticles("zxqvkeineanleitung")).toEqual([]);
  });
  it("provides usable heading anchors and omits duplicate titles and leads", () => {
    const article = articles.find((a) => a.slug === "sendeplaene-verstehen")!;
    const { html, headings } = renderArticle(article.markdown);
    expect(html).not.toContain("<h1");
    expect(html).not.toContain(article.description);
    expect(headings.length).toBeGreaterThan(2);
    for (const heading of headings)
      expect(html).toContain(`id="${heading.id}"`);
  });
  it("sanitizes authored HTML before rendering", () => {
    const { html } = renderArticle(
      '## Prüfung\n\n<img src=x onerror="alert(1)"><script>alert(1)</script>\n\n[Link](javascript:alert)',
    );
    expect(html).not.toMatch(/onerror|<script|javascript:/);
  });
  it("has content for every article and every category", () => {
    expect(new Set(articles.map((a) => a.slug)).size).toBe(articles.length);
    for (const article of articles) {
      expect(article.markdown).toContain(`# ${article.title}`);
      expect(article.source.length).toBeGreaterThan(0);
      expect(renderArticle(article.markdown).headings.length).toBeGreaterThan(
        0,
      );
    }
    for (const group of groups)
      expect(articles.some((a) => a.group === group.id)).toBe(true);
  });
});

describe("task-led information architecture", () => {
  it("keeps every learning path linked to real, distinct instructions", () => {
    const paths = articles.filter((a) => a.type === "journey");
    expect(paths.length).toBeGreaterThanOrEqual(4);
    for (const path of paths) {
      expect(path.steps.length).toBeGreaterThan(1);
      expect(new Set(path.steps).size).toBe(path.steps.length);
      for (const slug of path.steps) {
        expect(
          articles.some((a) => a.slug === slug && a.type !== "journey"),
        ).toBe(true);
        expect(path.markdown).toContain(`/help/${slug}`);
      }
    }
  });
  it("identifies audience, purpose and content type for every article", () => {
    const types = [
      "guide",
      "concept",
      "reference",
      "troubleshooting",
      "journey",
    ];
    for (const article of articles) {
      expect(types).toContain(article.type);
      expect(article.audience.length).toBeGreaterThan(0);
      expect(article.outcome.length).toBeGreaterThan(0);
      expect(article.tags.length).toBeGreaterThan(0);
    }
  });
  it("prioritizes dynamic placeholders for the parameter entry point", () => {
    expect(searchArticles("Parameter")[0].slug).toBe("parameter-platzhalter");
    expect(
      searchArticles("Display registrieren").some(
        (a) => a.slug === "display-verbinden",
      ),
    ).toBe(true);
    expect(
      searchArticles("Samsung installieren").some(
        (a) => a.slug === "installation",
      ),
    ).toBe(true);
    expect(
      searchArticles("Einstellungen").some(
        (a) => a.slug === "einstellungen-ueberblick",
      ),
    ).toBe(true);
  });
});
