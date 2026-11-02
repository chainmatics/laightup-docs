import { useEffect, useState } from "react";
import type { StructurePage } from "./structure-editor";
import { updateUrls } from "../../../../../../docs/helpcenter/lib/urls.mjs";
import {
  GlassButton,
  GlassInput,
  GlassSelect,
  GlassSettingsSection,
} from "./laightup-ui";
import styles from "./url-management.module.css";
export type UrlRedirect = { from: string; targetId: string };
type Props = {
  pages: StructurePage[];
  redirects: UrlRedirect[];
  onChange: (pages: StructurePage[], redirects: UrlRedirect[]) => void;
};
export default function UrlManagement({ pages, redirects, onChange }: Props) {
  const [pageId, setPageId] = useState(pages[0]?.id ?? "");
  const page = pages.find((p) => p.id === pageId);
  const [slug, setSlug] = useState(page?.slug ?? page?.id ?? "");
  useEffect(() => {
    setSlug(page?.slug ?? page?.id ?? "");
  }, [pageId, page?.slug]);
  const [from, setFrom] = useState("");
  const [targetId, setTargetId] = useState(
    pages.find((p) => p.status === "published")?.id ?? "",
  );
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const withSlugs = pages.map((p) => ({ ...p, slug: p.slug ?? p.id }));
  const options = pages.map((p) => ({
    value: p.id,
    label: p.title + (p.status === "draft" ? " (Entwurf)" : ""),
  }));
  const apply = (nextPages: StructurePage[], nextRedirects: UrlRedirect[]) => {
    try {
      const normalized = nextPages.map((p) => ({ ...p, slug: p.slug ?? p.id }));
      const checked = updateUrls(withSlugs, normalized, nextRedirects);
      onChange(nextPages, checked);
      setError("");
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  };
  return (
    <div className={styles.stack}>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <GlassSettingsSection
        title="Seitenadresse ändern"
        description="Für die deutsche Fassung. Bestehende Links bleiben durch eine automatische Weiterleitung erreichbar."
        bodyPadding
      >
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            if (page)
              apply(
                pages.map((p) => (p.id === page.id ? { ...p, slug } : p)),
                redirects,
              );
          }}
        >
          <label>
            Seite
            <GlassSelect
              aria-label="Seite für URL-Änderung"
              searchable
              value={pageId}
              options={options}
              onValueChange={(id) => {
                setPageId(id);
                const p = pages.find((p) => p.id === id);
                setSlug(p?.slug ?? id);
                setError("");
              }}
            />
          </label>
          <GlassInput
            label="Neue Seitenadresse"
            value={slug}
            maxLength={100}
            required
            onChange={(e) => setSlug(e.target.value)}
          />
          <p className={styles.path}>/help/{slug || "…"}</p>
          <p>
            Kleinbuchstaben, Zahlen und einzelne Bindestriche. Die Seitenkennung
            und Übersetzungen bleiben erhalten.
          </p>
          <GlassButton
            type="submit"
            disabled={!page || slug === (page.slug ?? page.id)}
          >
            Adressänderung vormerken
          </GlassButton>
        </form>
      </GlassSettingsSection>
      <GlassSettingsSection
        title="Weiterleitung hinzufügen"
        description="Eine alte Adresse führt direkt zur aktuellen URL einer veröffentlichten Seite."
        bodyPadding
      >
        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            if (apply(pages, [...redirects, { from, targetId }])) setFrom("");
          }}
        >
          <GlassInput
            label="Alte Seitenadresse (ohne /help/)"
            value={from}
            maxLength={100}
            required
            onChange={(e) => setFrom(e.target.value)}
          />
          <label>
            Zielseite
            <GlassSelect
              aria-label="Zielseite der Weiterleitung"
              searchable
              value={targetId}
              options={options.filter(
                (o) =>
                  pages.find((p) => p.id === o.value)?.status === "published",
              )}
              onValueChange={setTargetId}
            />
          </label>
          <GlassButton type="submit" disabled={!from || !targetId}>
            Weiterleitung vormerken
          </GlassButton>
        </form>
      </GlassSettingsSection>
      <GlassSettingsSection
        title={`Weiterleitungen (${redirects.length})`}
        description="Änderungen werden mit „Änderungen speichern“ übernommen. Entfernte Weiterleitungen können vor dem Speichern verworfen werden."
        bodyPadding
      >
        <GlassInput
          label="Weiterleitungen durchsuchen"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <ul className={styles.list}>
          {redirects
            .filter((r) =>
              `${r.from} ${pages.find((p) => p.id === r.targetId)?.title}`
                .toLowerCase()
                .includes(query.toLowerCase()),
            )
            .map((r) => (
              <li key={r.from}>
                <div>
                  <strong>/help/{r.from}</strong>
                  <span>
                    → /help/
                    {pages.find((p) => p.id === r.targetId)?.slug ?? r.targetId}
                  </span>
                </div>
                <GlassButton
                  variant="secondary"
                  size="sm"
                  aria-label={`Weiterleitung ${r.from} entfernen`}
                  onClick={() =>
                    apply(
                      pages,
                      redirects.filter((item) => item.from !== r.from),
                    )
                  }
                >
                  Entfernen
                </GlassButton>
              </li>
            ))}
        </ul>
        {!redirects.length && <p>Noch keine Weiterleitungen angelegt.</p>}
        {!!redirects.length &&
          !redirects.some((r) =>
            `${r.from} ${pages.find((p) => p.id === r.targetId)?.title}`
              .toLowerCase()
              .includes(query.toLowerCase()),
          ) && <p>Keine passenden Weiterleitungen.</p>}
      </GlassSettingsSection>
    </div>
  );
}
