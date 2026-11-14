// Redirects point to stable page IDs, never to another redirect.
export const reservedSlugs = ["guides", "nachschlagen", "was-ist-neu", "themen", "bearbeiten", "verwalten"];
export function validateUrls(pages, redirects = [], extraReserved = []) {
  const reserved = new Set([...reservedSlugs, ...extraReserved]);
  const valid = value => typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value) && value.length <= 100 && !reserved.has(value);
  const slugs = new Set();
  for (const page of pages) {
    if (!valid(page.slug)) throw new Error(`Ungültige oder reservierte Seitenadresse: ${page.slug}`);
    if (slugs.has(page.slug)) throw new Error(`Die Seitenadresse ist bereits vergeben: ${page.slug}`);
    slugs.add(page.slug);
  }
  if (!Array.isArray(redirects) || redirects.length > 5000) throw new Error("Ungültige Weiterleitungen.");
  const sources = new Set();
  for (const redirect of redirects) {
    if (!redirect || !valid(redirect.from) || sources.has(redirect.from) || slugs.has(redirect.from)) throw new Error(`Die alte Adresse ist ungültig oder bereits belegt: ${redirect?.from}`);
    const target = pages.find(page => page.id === redirect.targetId);
    if (!target || target.status === "draft") throw new Error("Weiterleitungen brauchen eine veröffentlichte Zielseite.");
    sources.add(redirect.from);
  }
}
export function updateUrls(previousPages, pages, redirects, extraReserved = []) {
  const next = redirects.map(({ from, targetId }) => ({ from, targetId }));
  for (const previous of previousPages) {
    const page = pages.find(item => item.id === previous.id);
    if (!page || page.slug === previous.slug || previous.status === "draft") continue;
    // Reclaiming one's own historical URL is safe; a different page may not take it.
    const historical = next.find(item => item.from === page.slug);
    if (historical?.targetId === page.id) next.splice(next.indexOf(historical), 1);
    const old = next.find(item => item.from === previous.slug);
    if (old && old.targetId !== page.id) throw new Error("Die bisherige Adresse wird bereits weitergeleitet.");
    if (!old) next.push({ from: previous.slug, targetId: page.id });
  }
  validateUrls(pages, next, extraReserved);
  return next;
}
export function publicRedirects(pages, redirects = [], prefix = "/help") {
  validateUrls(pages, redirects);
  return Object.fromEntries(redirects.map(({ from, targetId }) => [`${prefix}/${from}`, `${prefix}/${pages.find(page => page.id === targetId).slug}`]));
}
