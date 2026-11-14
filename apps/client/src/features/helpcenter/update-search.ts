import updates from "../../../../../docs/helpcenter/updates.json";
import releases from "../../../../../docs/helpcenter/releases.public.json";
import { renderRelease } from "./release-originals";

const normalize = (text: string) =>
  text
    .toLocaleLowerCase("de")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss");
const texts = new Map(
  updates.map((update) => {
    const release = releases.find((entry) => entry.entryId === update.id);
    const originalText = [release?.original, ...(release?.adoptedSources ?? [])]
      .filter(Boolean)
      .map((source) => {
        const template = document.createElement("template");
        template.innerHTML = renderRelease(
          source.markdown,
          source.id,
          update.title,
          true,
        );
        return template.content.textContent ?? "";
      })
      .join(" ");
    const date = new Intl.DateTimeFormat("de-DE", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${update.date}T12:00:00Z`));
    return [
      update.id,
      normalize(
        `${update.title} ${update.description} ${update.highlights.join(" ")} ${JSON.stringify(update.changes)} ${date} ${update.date} ${originalText}`,
      ),
    ];
  }),
);

export function searchUpdates(query: string) {
  const terms = normalize(query).trim().split(/\s+/).filter(Boolean);
  return updates.filter((update) =>
    terms.every((term) => texts.get(update.id).includes(term)),
  );
}
