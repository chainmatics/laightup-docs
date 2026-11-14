import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import HelpPageTree from "./help-page-tree";
afterEach(cleanup);
it("renders parent and nested subpage links in the saved hierarchy with the active page marked", () => {
  render(
    <MemoryRouter>
      <HelpPageTree
        currentSlug="kind"
        pages={[
          { id: "root", title: "Einstieg", slug: "einstieg" },
          { id: "child", title: "Vorbereiten", slug: "kind", parentId: "root" },
          { id: "last", title: "Abschluss", slug: "abschluss" },
        ]}
      />
    </MemoryRouter>,
  );
  const root = screen.getByRole("link", { name: "Einstieg" }),
    child = screen.getByRole("link", { name: "Vorbereiten" });
  expect(root.closest("li")?.querySelector("ul")?.contains(child)).toBe(true);
  expect(child.getAttribute("aria-current")).toBe("page");
  expect(child.getAttribute("href")).toBe("/help/kind");
  expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
    "Einstieg",
    "Vorbereiten",
    "Abschluss",
  ]);
});
