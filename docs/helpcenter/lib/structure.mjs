const idPattern = /^[a-z0-9][a-z0-9-]{0,100}$/;
export const pageStatus = (page) => page.status ?? "published";
export function descendants(pages, id) {
  const result = new Set();
  const visit = (parent) => {
    for (const p of pages.filter((p) => p.parentId === parent)) {
      if (p.id === id || result.has(p.id))
        throw new Error("Die Seitenhierarchie enthält einen Kreis.");
      result.add(p.id);
      visit(p.id);
    }
  };
  visit(id);
  return result;
}
export function validateStructure(groups, pages) {
  if (
    !Array.isArray(groups) ||
    !Array.isArray(pages) ||
    groups.length > 100 ||
    pages.length > 2000
  )
    throw new Error("Ungültige Inhaltsstruktur.");
  const validIds = (items) =>
    items.every(
      (p) =>
        typeof p?.id === "string" &&
        idPattern.test(p.id) &&
        !["__proto__", "constructor", "prototype"].includes(p.id),
    ) && new Set(items.map((p) => p.id)).size === items.length;
  if (!validIds(groups) || !validIds(pages))
    throw new Error("Kennungen müssen eindeutig und gültig sein.");
  const byId = new Map(pages.map((p) => [p.id, p]));
  for (const page of pages) {
    if (!groups.some((g) => g.id === page.group))
      throw new Error("Die Seite gehört zu einem unbekannten Thema.");
    if (!["draft", "published"].includes(pageStatus(page)))
      throw new Error("Unbekannter Seitenstatus.");
    if (
      page.parentId != null &&
      (typeof page.parentId !== "string" || !byId.has(page.parentId))
    )
      throw new Error("Die übergeordnete Seite fehlt.");
    const visited = new Set([page.id]);
    let node = page,
      depth = 1;
    while (node.parentId) {
      if (visited.has(node.parentId))
        throw new Error(
          "Eine Seite kann nicht unter sich selbst oder ihren Unterseiten liegen.",
        );
      visited.add(node.parentId);
      node = byId.get(node.parentId);
      if (!node || node.group !== page.group)
        throw new Error(
          "Elternseite und Unterseite müssen im selben Thema liegen.",
        );
      if (pageStatus(page) === "published" && pageStatus(node) === "draft")
        throw new Error(
          "Eine veröffentlichte Seite kann nicht unter einer Entwurfsseite liegen.",
        );
      if (++depth > 3)
        throw new Error("Es sind höchstens drei Seitenebenen möglich.");
    }
  }
}
export function orderedPages(groups, pages) {
  validateStructure(groups, pages);
  const result = [];
  const visit = (group, parentId = null, depth = 0) => {
    for (const page of pages.filter(
      (p) => p.group === group && (p.parentId ?? null) === parentId,
    )) {
      result.push({ ...page, depth });
      visit(group, page.id, depth + 1);
    }
  };
  for (const group of groups) visit(group.id);
  return result;
}
export function movePage(
  groups,
  pages,
  id,
  { group, parentId = null, beforeId = null },
) {
  const current = pages.find((p) => p.id === id);
  if (!current) throw new Error("Seite nicht gefunden.");
  const children = descendants(pages, id),
    branch = new Set([id, ...children]);
  if (branch.has(parentId))
    throw new Error(
      "Eine Seite kann nicht unter sich selbst oder ihren Unterseiten liegen.",
    );
  const moving = pages
    .filter((p) => branch.has(p.id))
    .map((p) => ({ ...p, group, ...(p.id === id ? { parentId } : {}) }));
  const rest = pages.filter((p) => !branch.has(p.id));
  let index = rest.length;
  if (beforeId) {
    index = rest.findIndex(
      (p) =>
        p.id === beforeId &&
        p.group === group &&
        (p.parentId ?? null) === (parentId ?? null),
    );
    if (index < 0) throw new Error("Ungültige Zielposition.");
  }
  const next = [...rest.slice(0, index), ...moving, ...rest.slice(index)];
  return orderedPages(groups, next).map(({ depth, ...p }) => p);
}
export function shiftPage(groups, pages, id, delta) {
  const page = pages.find((p) => p.id === id);
  if (!page) throw new Error("Seite nicht gefunden.");
  const siblings = pages.filter(
    (p) =>
      p.group === page.group &&
      (p.parentId ?? null) === (page.parentId ?? null),
  );
  const index = siblings.findIndex((p) => p.id === id),
    to = index + delta;
  if (to < 0 || to >= siblings.length) return pages;
  const target = delta < 0 ? siblings[to].id : (siblings[to + 1]?.id ?? null);
  return movePage(groups, pages, id, {
    group: page.group,
    parentId: page.parentId ?? null,
    beforeId: target,
  });
}
