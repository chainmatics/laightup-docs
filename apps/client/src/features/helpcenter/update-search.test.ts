import { describe, expect, it } from "vitest";
import { searchUpdates } from "./update-search";
import publicReleases from "../../../../../docs/helpcenter/releases.public.json";
import { renderRelease } from "./release-originals";

describe("release search", () => {
  it("searches only product news by date and multiple terms", () => {
    expect(searchUpdates("")).toHaveLength(13);
    expect(searchUpdates("").every((entry) => entry.sourceUpdateId)).toBe(true);
    expect(searchUpdates("Neue Wege zur passenden Anleitung")).toEqual([]);
    expect(
      searchUpdates("PDF import").some(
        (entry) => entry.id === "2026-10-22-produkt",
      ),
    ).toBe(true);
    expect(searchUpdates("29. Oktober 2026").map((entry) => entry.id)).toEqual([
      "2026-10-29-produkt",
    ]);

    expect(searchUpdates("keinepassendeanderung")).toEqual([]);
  });
  it("finds details in adopted release contents and normalizes umlauts", () => {
    expect(
      searchUpdates("Ein-Klick-Korrektur").some(
        (entry) => entry.id === "2026-10-03-produkt",
      ),
    ).toBe(true);
    expect(searchUpdates("ruckgangig").map((entry) => entry.id)).toEqual(
      searchUpdates("rückgängig").map((entry) => entry.id),
    );
    expect(searchUpdates("rückgängig").length).toBeGreaterThan(0);
  });
});

describe("reader-facing release contents", () => {
  it("omits source links and provenance footers while retaining changes", () => {
    const markdown =
      "# Production-Release 2026-10-29\n\n## Verbesserungen\n\n- PDFs importieren.\n\n## Technische Details\n\n- [LAI-42](https://linear.app/chainmatics/issue/LAI-42): Interner Job-Fix.\n\n---\n185 Commits | [Release-PR #574](https://github.com/chainmatics/laightup/pull/574)";
    const html = renderRelease(markdown, "test", "PDFs importieren", true);
    expect(html).not.toContain("<a");
    expect(html).not.toContain("LAI-42");
    expect(html).not.toContain("Technische Details");
    expect(html).not.toContain("Interner Job-Fix");
    expect(html).not.toContain("185 Commits");
    expect(html).not.toContain("Production-Release");
    expect(html).toContain("PDFs importieren.");
    expect(markdown).toContain("https://linear.app/");
  });
});

describe("public release boundary", () => {
  it("ships product information without internal ticket or engineering data", () => {
    expect(publicReleases).toHaveLength(13);
    for (const release of publicReleases) {
      const text = JSON.stringify(release);
      expect(text).not.toMatch(
        /LAI-\d+|Technische Details|linear\.app|github\.com|bodySha256|rawFile|Commits|Release-PR/,
      );
      expect(
        [release.original, ...release.adoptedSources].some(
          (source) =>
            source.markdown.includes("Verbesserungen") ||
            source.markdown.length > 100,
        ),
      ).toBe(true);
    }
  });
  it("does not expose tickets or technical details through search", () => {
    expect(searchUpdates("LAI-538")).toEqual([]);
    expect(searchUpdates("Replay-Harness")).toEqual([]);
    expect(searchUpdates("Technische Details")).toEqual([]);
  });
});
