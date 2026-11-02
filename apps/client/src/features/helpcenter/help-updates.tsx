import { Link } from "react-router-dom";
import { useState } from "react";
import {
  IconArrowRight,
  IconChevronRight,
  IconSearch,
  IconX,
  IconArrowDown,
} from "@tabler/icons-react";
import { searchUpdates } from "./update-search";
import styles from "./updates.module.css";
import ReleaseOriginals from "./release-originals";
import ReleaseArtwork from "./release-artwork";
import { helpMessages, formatHelpMessage } from "./content";
const copy = helpMessages.updates;

const dateFormat = new Intl.DateTimeFormat("de-DE", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export default function HelpUpdates() {
  const [visibleCount, setVisibleCount] = useState(4);
  const [query, setQuery] = useState("");
  const filtered = searchUpdates(query);
  const latestProduct = searchUpdates("")[0];
  return (
    <main id="help-main" className={styles.page}>
      <nav className={styles.breadcrumbs} aria-label="Brotkrümelnavigation">
        <Link to="/help">Helpcenter</Link>
        <IconChevronRight size={13} />
        <span>Was ist neu?</span>
      </nav>
      <header className={styles.journalHero}>
        <img
          className={styles.heroImage}
          src="/helpcenter/images/updates-hero.webp"
          alt=""
          width="1903"
          height="826"
          fetchPriority="high"
        />
        <div className={styles.heroShade} />
        <div className={styles.heroCopy}>
          <span className={styles.heroEyebrow}>{copy.eyebrow}</span>
          <h1>
            {copy.headingStart} <em>{copy.headingEmphasis}</em>
          </h1>
          <p>
            {copy.introFirst}
            <br />
            {copy.introSecond}
          </p>
          <div className={styles.heroLinks}>
            <a href="#updates-search">
              {copy.discover} <IconArrowDown size={17} />
            </a>
            <Link to="/help">
              {copy.helpLink} <IconArrowRight size={17} />
            </Link>
          </div>
          {latestProduct && (
            <span className={styles.heroDate}>
              {formatHelpMessage(copy.latest, {
                date: dateFormat.format(
                  new Date(`${latestProduct.date}T12:00:00Z`),
                ),
              })}
            </span>
          )}
        </div>
        <span className={styles.heroEdition} aria-hidden="true">
          {copy.edition}
        </span>
      </header>
      <div
        id="updates-search"
        className={styles.updateSearch}
        role="search"
        aria-label={copy.searchLabel}
      >
        <IconSearch size={20} aria-hidden="true" />
        <input
          type="search"
          aria-label={copy.searchInputLabel}
          placeholder={copy.searchPlaceholder}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setVisibleCount(4);
          }}
        />
        {query && (
          <button
            aria-label={copy.clear}
            onClick={() => {
              setQuery("");
              setVisibleCount(4);
            }}
          >
            <IconX size={17} />
          </button>
        )}
      </div>
      <div className={styles.resultCount}>
        <span aria-live="polite">
          {formatHelpMessage(
            filtered.length === 1 ? copy.entryOne : copy.entryOther,
            { count: filtered.length },
          )}
        </span>
      </div>
      <section className={styles.timeline} aria-label={copy.archiveLabel}>
        {filtered.length === 0 && (
          <div className={styles.empty}>
            <h2>{copy.emptyTitle}</h2>
            <p>{copy.emptyDescription}</p>
          </div>
        )}
        {filtered.slice(0, visibleCount).map((update) => (
          <article
            className={styles.entry}
            key={update.id}
            aria-labelledby={update.id}
          >
            <div className={styles.date}>
              <div className={styles.entryMeta}>
                <time dateTime={update.date}>
                  {dateFormat.format(new Date(`${update.date}T12:00:00Z`))}
                </time>
                <h2 id={update.id}>{update.title}</h2>
              </div>
            </div>
            <div className={styles.card}>
              <ReleaseArtwork entryId={update.id} />
              <div className={styles.body}>
                <p className={styles.lead}>{update.description}</p>
                <details className={styles.guideDetails}>
                  <summary>
                    {copy.guideDetails}
                    <IconArrowRight size={15} />
                  </summary>
                  <div className={styles.changes}>
                    {update.changes.map((change) => (
                      <section key={change.title}>
                        <h3>{change.title}</h3>
                        <p>{change.description}</p>
                        <div className={styles.links}>
                          {change.links.map((link) => (
                            <Link key={link.slug} to={`/help/${link.slug}`}>
                              {link.label}
                              <IconArrowRight size={15} />
                            </Link>
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                </details>
                <ReleaseOriginals
                  entryId={update.id}
                  title={update.title}
                  date={update.date}
                />
              </div>
            </div>
          </article>
        ))}
      </section>
      {visibleCount < filtered.length && (
        <button
          className={styles.more}
          onClick={() => setVisibleCount((count) => count + 4)}
        >
          {copy.older} <span>({filtered.length - visibleCount})</span>
        </button>
      )}
      <Link className={styles.back} to="/help">
        {copy.back} <IconArrowRight size={17} />
      </Link>
    </main>
  );
}
