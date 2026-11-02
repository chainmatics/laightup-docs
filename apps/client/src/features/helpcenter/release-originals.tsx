import { publicReleaseMarkdown } from "../../../../../docs/helpcenter/lib/public-release.mjs";
import { Marked } from "marked";
import DOMPurify from "dompurify";
import originals from "../../../../../docs/helpcenter/releases.public.json";
import { headingId, helpMessages, formatHelpMessage } from "./content";
import styles from "./updates.module.css";

export function renderRelease(
  markdown: string,
  prefix: string,
  displayTitle?: string,
  readerView = false,
) {
  const used = new Set<string>();
  let titleRendered = false;
  const parser = new Marked({
    renderer: {
      heading({ tokens, depth, text }) {
        const base = `${prefix}-${headingId(text)}`;
        let id = base;
        for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
        used.add(id);
        const level = Math.min(6, depth + 2);
        if (depth === 1 && !titleRendered && displayTitle) {
          titleRendered = true;
          const escaped = displayTitle
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
          return `<h${level} id="${id}">${escaped}</h${level}>`;
        }
        return `<h${level} id="${id}">${this.parser.parseInline(tokens)}</h${level}>`;
      },
    },
  });
  const html = DOMPurify.sanitize(
    parser.parse(readerView ? publicReleaseMarkdown(markdown) : markdown, {
      async: false,
    }) as string,
  );
  if (!readerView) return html;
  const template = document.createElement("template");
  template.innerHTML = html;
  template.content.querySelectorAll("p").forEach((paragraph) => {
    const text = paragraph.textContent ?? "";
    if (
      /\d+ Commits?\s*[|·]/i.test(text) ||
      (paragraph.querySelector('a[href*="#project-update-"]') &&
        /Staging-Release|Geht live|Mit diesem Release geht/.test(text))
    )
      paragraph.remove();
  });
  template.content
    .querySelectorAll("a")
    .forEach((link) =>
      link.replaceWith(document.createTextNode(link.textContent ?? "")),
    );
  return template.innerHTML;
}

export default function ReleaseOriginals({
  entryId,
  title,
  date,
}: {
  entryId: string;
  title: string;
  date: string;
}) {
  const release = originals.find((entry) => entry.entryId === entryId);
  if (!release) return null;
  return (
    <details className={styles.originals} id={`${entryId}-original`}>
      <summary>{helpMessages.updates.details}</summary>
      <div className={styles.originalBody}>
        {[release.original, ...release.adoptedSources].map((source, index) => (
          <section
            key={source.id}
            aria-label={
              index === 0
                ? helpMessages.updates.detailsLabel
                : helpMessages.updates.additionalLabel
            }
          >
            {index > 0 && (
              <p className={styles.adoptionNotice}>
                {helpMessages.updates.additionalIntro}
              </p>
            )}
            {index === 0 && (
              <p className={styles.publicationDate}>
                {formatHelpMessage(helpMessages.updates.date, {
                  date: new Intl.DateTimeFormat("de-DE", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  }).format(new Date(`${date}T12:00:00Z`)),
                })}
              </p>
            )}
            <div
              className={styles.releaseProse}
              dangerouslySetInnerHTML={{
                __html: renderRelease(
                  source.markdown,
                  source.id,
                  index === 0 ? title : helpMessages.updates.additionalTitle,
                  true,
                ),
              }}
            />
          </section>
        ))}
      </div>
    </details>
  );
}
