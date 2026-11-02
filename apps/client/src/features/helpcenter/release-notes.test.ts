import { describe, expect, it } from "vitest";
import updates from "../../../../../docs/helpcenter/updates.json";
import provenance from "../../../../../docs/helpcenter/release-sources.json";
import { articles } from "./content";
import completeReleases from "../../../../../docs/helpcenter/releases.json";
import archiveManifest from "../../../../../docs/helpcenter/release-archive/manifest.json";
import { renderRelease } from "./release-originals";
import { createHash } from "node:crypto";
const rawOriginals = import.meta.glob<string>(
  "../../../../../docs/helpcenter/release-archive/raw/*.md",
  { query: "?raw", import: "default", eager: true },
);

describe("published release notes", () => {
  it("backs every product entry with a dated Production publication", () => {
    const product = updates.filter((update) => update.category === "Produkt");
    expect(product.length).toBeGreaterThan(0);
    expect(new Set(provenance.entries.map((entry) => entry.entryId))).toEqual(
      new Set(product.map((entry) => entry.id)),
    );
    for (const update of product) {
      const evidence = provenance.entries.find(
        (entry) => entry.entryId === update.id,
      )!;
      expect(evidence.releaseDate).toBe(update.date);
      const publication = evidence.sources[0];
      expect(publication.title).toMatch(/Production-(Release|Hotfix)/);
      expect(publication.title).toContain(update.date);
      expect(publication.bodySha256).toMatch(/^[a-f0-9]{64}$/);
      for (const source of evidence.sources.slice(1)) {
        expect(source.title).toMatch(/^Staging-Release/);
        expect(source.createdAt.slice(0, 10) <= update.date).toBe(true);
      }
    }
  });
  it("keeps the archive ordered and all related instructions reachable", () => {
    expect(new Set(updates.map((entry) => entry.id)).size).toBe(updates.length);
    expect(updates.map((entry) => entry.date)).toEqual(
      updates
        .map((entry) => entry.date)
        .sort()
        .reverse(),
    );
    for (const entry of updates) {
      expect(entry.highlights.length).toBeGreaterThan(0);
      for (const change of entry.changes) {
        expect(change.links.length).toBeGreaterThan(0);
        for (const link of change.links)
          expect(articles.some((article) => article.slug === link.slug)).toBe(
            true,
          );
      }
    }
  });
  it("retains the separate activation notice for comments", () => {
    const release = updates.find((entry) => entry.id === "2026-10-22-produkt")!;
    const comments = release.changes.find((change) =>
      change.title.includes("Kommentare"),
    )!;
    expect(comments.description).toContain("separat freigeschaltet");
  });
});

// The UI imports this generated collection, not a separate unverified archive.

describe("complete original release texts", () => {
  it("renders the same complete sources that were archived", () => {
    expect(
      new Set(completeReleases.map((release) => release.original.id)),
    ).toEqual(new Set(archiveManifest.releases));
    for (const release of completeReleases) {
      const record = archiveManifest.updates.find(
        (source) => source.id === release.original.id,
      )!;
      expect(release.adoptedSources.map((source) => source.id)).toEqual(
        record.adoptedSources,
      );
      for (const source of [release.original, ...release.adoptedSources]) {
        expect(source.markdown).toBe(
          rawOriginals[
            `../../../../../docs/helpcenter/release-archive/${source.rawFile}`
          ],
        );
        expect(
          createHash("sha256").update(source.markdown, "utf8").digest("hex"),
        ).toBe(source.bodySha256);
        const html = renderRelease(source.markdown, source.id);
        const dom = new DOMParser().parseFromString(html, "text/html");
        expect(dom.querySelector("h3")?.textContent).toBe(source.title);
        expect(html).not.toMatch(/<h[12][ >]/);
        for (const url of source.markdown.matchAll(/\]\((https:\/\/[^)]+)\)/g))
          expect(
            [...dom.querySelectorAll("a")].some(
              (link) => link.getAttribute("href") === url[1],
            ),
          ).toBe(true);
      }
    }
  });
  it("preserves source paragraphs, technical details and release footers", () => {
    const latest = completeReleases.find(
      (release) =>
        release.original.id === "60ccedab-8b03-4395-8d87-f4514727ec87",
    )!;
    const html = renderRelease(latest.original.markdown, latest.original.id);
    expect(html).toContain("Technische Details");
    expect(html).toContain("LAI-538");
    expect(html).toContain("185 Commits");
    expect(html).toContain("Der Easy Flow liefert");
  });
  it("uses unique scoped anchors and strips executable source HTML", () => {
    const markdown =
      '# Titel\n\nEinleitung.\n\n## Gleich\n\n## Gleich\n\n<script>alert(1)</script><img src=x onerror="alert(1)">';
    const a = renderRelease(markdown, "release-a");
    const b = renderRelease(markdown, "release-b");
    expect(a).toContain('id="release-a-gleich-2"');
    expect(b).toContain('id="release-b-gleich"');
    expect(a).not.toMatch(/<script|onerror/);
    expect(a).toContain("Einleitung.");
  });
});

describe("reader-facing release titles", () => {
  it("uses a descriptive title while preserving every release paragraph", () => {
    const original =
      "# Production-Release 2026-10-29\n\nEinleitung.\n\n## Korrekturen\n\n- Ein Fehler wurde behoben.\n";
    const html = renderRelease(
      original,
      "release",
      "Genauere Designs & bessere Formate",
    );
    const dom = new DOMParser().parseFromString(html, "text/html");
    expect(dom.querySelector("h3")?.textContent).toBe(
      "Genauere Designs & bessere Formate",
    );
    expect(html).not.toContain(">Production-Release");
    expect(dom.body.textContent).toContain("Einleitung.");
    expect(dom.body.textContent).toContain("Ein Fehler wurde behoben.");
    expect(original).toContain("# Production-Release 2026-10-29");
  });
});
