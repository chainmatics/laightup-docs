import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContentNavigation, ContentOverview } from "./content-structure";
import type { EditorCatalog } from "./editor-types";
afterEach(cleanup);
const catalog: EditorCatalog = {
  token: "local",
  groups: [
    { id: "start", title: "Erste Schritte" },
    { id: "displays", title: "Displays" },
  ],
  documents: [
    {
      kind: "article",
      id: "one",
      title: "Einstieg",
      group: "start",
      hasDraft: false,
    },
    {
      kind: "article",
      id: "two",
      title: "Display verbinden",
      group: "displays",
      hasDraft: true,
    },
    {
      kind: "update",
      id: "release",
      title: "Neue Displayfunktionen",
      group: "",
      hasDraft: false,
    },
  ],
};
describe("editor content structure", () => {
  it("finds pages across collapsed groups and both content areas", () => {
    const onSelect = vi.fn();
    render(
      <ContentNavigation
        catalog={catalog}
        selected={null}
        overview={false}
        filter="Display"
        onSelect={onSelect}
        onOverview={vi.fn()}
        onCreate={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: /Display verbinden/,
      }),
    );
    expect(onSelect).toHaveBeenCalledWith("article", "two");
    fireEvent.click(
      screen.getByRole("button", { name: "Neue Displayfunktionen" }),
    );
    expect(onSelect).toHaveBeenLastCalledWith("update", "release");
    expect(screen.queryByRole("button", { name: "Einstieg" })).toBeNull();
  });
  it("lets users switch areas and open a collapsed topic with the keyboard-accessible button", () => {
    render(
      <ContentNavigation
        catalog={catalog}
        selected={null}
        overview={false}
        filter=""
        onSelect={vi.fn()}
        onOverview={vi.fn()}
        onCreate={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", {
        name: /Display verbinden/,
      }),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Displays 1" }));
    expect(
      screen.getByRole("button", {
        name: /Display verbinden/,
      }),
    ).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Produktnews 1" }));
    expect(screen.queryByRole("button", { name: "Einstieg" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Neue Displayfunktionen" }),
    ).toBeTruthy();
  });
  it("creates an instruction in its chosen topic and opens the correct page from the overview", () => {
    const onCreate = vi.fn(),
      onSelect = vi.fn();
    render(
      <ContentOverview
        catalog={catalog}
        onCreate={onCreate}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Neue Seite in Displays" }),
    );
    expect(onCreate).toHaveBeenCalledWith("displays");
    fireEvent.click(
      screen.getByRole("button", {
        name: /Display verbinden/,
      }),
    );
    expect(onSelect).toHaveBeenCalledWith("article", "two");
  });
});
