import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import StructureEditor from "./structure-editor";
import { GlassTooltipProvider } from "./laightup-ui";
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});
afterEach(cleanup);
const groups = [
  { id: "start", title: "Erste Schritte", description: "Der Einstieg." },
];
const pages = [
  {
    id: "parent",
    title: "Einstieg",
    group: "start",
    parentId: null,
    status: "published" as const,
  },
  {
    id: "second",
    title: "Weiter geht es",
    group: "start",
    parentId: null,
    status: "published" as const,
  },
];
function setup() {
  const onChange = vi.fn(),
    onEdit = vi.fn();
  render(
    <GlassTooltipProvider>
      <StructureEditor
        groups={groups}
        pages={pages}
        onChange={onChange}
        onEdit={onEdit}
        dirty={false}
      />
    </GlassTooltipProvider>,
  );
  return { onChange, onEdit };
}
describe("management structure workflows", () => {
  it("creates a topic in pending structure without changing existing pages", () => {
    const { onChange } = setup();
    fireEvent.click(screen.getByRole("button", { name: "Neues Thema" }));
    fireEvent.change(
      screen.getByRole("textbox", { name: /^Themenname$/ }),
      { target: { value: "Installation" } },
    );
    fireEvent.submit(
      screen
        .getByRole("region", { name: "Thema anlegen" })
        .querySelector("form")!,
    );
    const [next, nextPages] = onChange.mock.calls[0];
    expect(next).toHaveLength(2);
    expect(next[1].title).toBe("Installation");
    expect(nextPages).toEqual(pages);
  });
  it("creates a draft subpage under the chosen parent", () => {
    const { onChange } = setup();
    fireEvent.click(
      screen.getByRole("button", { name: "Unterseite zu Einstieg anlegen" }),
    );
    fireEvent.change(screen.getByRole("textbox", { name: "Seitentitel" }), {
      target: { value: "Player vorbereiten" },
    });
    fireEvent.submit(
      screen
        .getByRole("region", { name: "Seite anlegen" })
        .querySelector("form")!,
    );
    const [, next] = onChange.mock.calls[0];
    const created = next.find((p) => p.title === "Player vorbereiten");
    expect(created).toMatchObject({
      group: "start",
      parentId: "parent",
      status: "draft",
    });
    expect(next.map((p) => p.id)).toEqual(["parent", created.id, "second"]);
  });
  it("reorders siblings with accessible actions and opens content editing", () => {
    const { onChange, onEdit } = setup();
    fireEvent.click(
      screen.getByRole("button", { name: /^Einstieg nach unten$/ }),
    );
    expect(onChange.mock.calls[0][1].map((p) => p.id)).toEqual([
      "second",
      "parent",
    ]);
    fireEvent.click(
      screen.getByRole("button", { name: /^Bearbeiten: Einstieg$/ }),
    );
    expect(onEdit).toHaveBeenCalledWith("parent");
  });
});
