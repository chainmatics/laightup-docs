import { describe, expect, it } from "vitest";
import {
  languages,
  findLanguages,
  languageAvailable,
  languageInContinent,
  regions,
} from "./languages";

describe("language selection", () => {
  it("covers all EU official languages, additional European languages and Japanese", () => {
    const codes = new Set(languages.map((language) => language.code));
    for (const code of [
      "bg",
      "hr",
      "cs",
      "da",
      "nl",
      "en",
      "et",
      "fi",
      "fr",
      "de",
      "el",
      "hu",
      "ga",
      "it",
      "lv",
      "lt",
      "mt",
      "pl",
      "pt",
      "ro",
      "sk",
      "sl",
      "es",
      "sv",
      "ja",
      "uk",
      "is",
      "no",
      "cy",
      "eu",
      "ca",
    ])
      expect(codes.has(code)).toBe(true);
    for (const code of [
      "nb",
      "nn",
      "nds",
      "szl",
      "pms",
      "lij",
      "lmo",
      "nap",
      "vec",
      "scn",
    ])
      expect(codes.has(code)).toBe(false);
    expect(
      languages.filter((language) => language.name === "Norwegisch"),
    ).toHaveLength(1);
    expect(codes.size).toBe(languages.length);
    for (const language of languages) {
      expect(language.flag).toBeTruthy();
      expect(language.nativeName).toBeTruthy();
      expect(regions.some((region) => region.id === language.region)).toBe(
        true,
      );
    }
  });
  it("finds languages by native name, German/English names, country and code", () => {
    expect(findLanguages("en")[0].code).toBe("en");
    for (const query of ["日本語", "Japanisch", "Japanese", "JP", "Japan"])
      expect(
        findLanguages(query).some((language) => language.code === "ja"),
      ).toBe(true);
    expect(
      findLanguages("Français").some((language) => language.code === "fr"),
    ).toBe(true);
    expect(
      findLanguages("Frankreich").some((language) => language.code === "fr"),
    ).toBe(true);
    expect(
      findLanguages("Norwegisch").some((language) => language.code === "no"),
    ).toBe(true);
    expect(findLanguages("sprachedieesnichtgibt")).toEqual([]);
  });
  it("combines search and region without pretending translations are published", () => {
    expect(findLanguages("", "asia").map((language) => language.code)).toEqual([
      "hy",
      "az",
      "ka",
      "ja",
      "kk",
    ]);
    expect(findLanguages("Japanese", "europe")).toEqual([]);
    expect(languageAvailable("de")).toBe(true);
    expect(languageAvailable("ja")).toBe(false);
    expect(languageAvailable("en")).toBe(false);
  });
  it("groups languages by continent, without regional variants or duplicated continent entries", () => {
    const japanese = languages.find((language) => language.code === "ja")!;
    const german = languages.find((language) => language.code === "de")!;
    const turkish = languages.find((language) => language.code === "tr")!;
    expect(languageInContinent(japanese, "asia")).toBe(true);
    expect(languageInContinent(japanese, "europe")).toBe(false);
    expect(languageInContinent(german, "europe")).toBe(true);
    expect(languageInContinent(german, "asia")).toBe(false);
    expect(languageInContinent(turkish, "asia")).toBe(false);
    expect(languageInContinent(turkish, "europe")).toBe(true);
  });
});
