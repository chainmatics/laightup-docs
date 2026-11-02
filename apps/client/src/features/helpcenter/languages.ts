import catalogue from "../../../../../docs/helpcenter/languages.json";
import locales from "../../../../../docs/helpcenter/locales.json";
const fallbackNames: Record<string, string> = { lld: "Ladinisch" };
const german = new Intl.DisplayNames(["de"], { type: "language" });
const english = new Intl.DisplayNames(["en"], { type: "language" });
const countries = new Intl.DisplayNames(["de"], { type: "region" });
export const languages = catalogue.map((language) => ({
  ...language,
  name:
    language.names.de ??
    fallbackNames[language.code] ??
    german.of(language.code) ??
    language.nativeName,
  englishName:
    language.names.en ?? english.of(language.code) ?? language.nativeName,
  countryName: language.country ? (countries.of(language.country) ?? "") : "",
}));
export type HelpLanguage = (typeof languages)[number];
export const regions = [
  { id: "all", label: "Alle" },
  { id: "europe", label: "Europa" },
  { id: "asia", label: "Asien" },
];
const normalize = (text: string) =>
  text
    .toLocaleLowerCase("de")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss");
export function findLanguages(query: string, region = "all") {
  const normalized = normalize(query).trim();
  const terms = normalized.split(/\s+/).filter(Boolean);
  const rank = (language: HelpLanguage) =>
    normalized && normalize(language.code) === normalized
      ? 0
      : normalized &&
          [language.name, language.nativeName, language.englishName].some(
            (name) => normalize(name) === normalized,
          )
        ? 1
        : 2;
  return languages
    .filter(
      (language) =>
        (region === "all" || language.region === region) &&
        terms.every((term) =>
          normalize(
            `${language.name} ${language.nativeName} ${language.englishName} ${language.code} ${language.country} ${language.countryName}`,
          ).includes(term),
        ),
    )
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, "de"));
}
// Published content bundles do not yet imply translated UI routes. Enable only
// locales that are actually wired through the application's locale renderer.
const renderedLocales = new Set(["de"]);
export function languageAvailable(code: string) {
  const config = locales.locales as Record<string, { status: string }>;
  return renderedLocales.has(code) && config[code]?.status === "published";
}

export function languageInContinent(language: HelpLanguage, continent: string) {
  return continent === "all" || language.region === continent;
}
