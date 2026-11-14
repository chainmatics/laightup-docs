import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import UrlManagement, { type UrlRedirect } from "./url-management";
import { GlassTooltipProvider } from "./laightup-ui";
import type { StructurePage } from "./structure-editor";
beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);
const initial: StructurePage[] = [
  {
    id: "first",
    slug: "first",
    title: "Erste Seite",
    group: "start",
    parentId: null,
    status: "published",
  },
];
function Fixture() {
  const [pages, setPages] = useState(initial),
    [redirects, setRedirects] = useState<UrlRedirect[]>([]);
  return (
    <GlassTooltipProvider>
      <UrlManagement
        pages={pages}
        redirects={redirects}
        onChange={(p, r) => {
          setPages(p);
          setRedirects(r);
        }}
      />
    </GlassTooltipProvider>
  );
}
describe("URL management", () => {
  it("stages a rename and keeps historical aliases pointing at the latest address", () => {
    render(<Fixture />);
    fireEvent.change(
      screen.getByRole("textbox", { name: "Neue Seitenadresse" }),
      { target: { value: "new-name" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Adressänderung vormerken" }),
    );
    expect(screen.getByText("/help/first")).toBeTruthy();
    expect(screen.getByText("→ /help/new-name")).toBeTruthy();
    fireEvent.change(
      screen.getByRole("textbox", { name: "Neue Seitenadresse" }),
      { target: { value: "latest" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Adressänderung vormerken" }),
    );
    expect(screen.getAllByText("→ /help/latest")).toHaveLength(2);
  });
  it("rejects reserved names, and supports adding and removing a manual redirect", () => {
    render(<Fixture />);
    fireEvent.change(
      screen.getByRole("textbox", { name: "Neue Seitenadresse" }),
      { target: { value: "guides" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Adressänderung vormerken" }),
    );
    expect(screen.getByRole("alert").textContent).toContain("reservierte");
    fireEvent.change(
      screen.getByRole("textbox", { name: "Alte Seitenadresse (ohne /help/)" }),
      { target: { value: "old-link" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Weiterleitung vormerken" }),
    );
    expect(screen.getByText("/help/old-link")).toBeTruthy();
    fireEvent.click(
      screen.getByRole("button", { name: "Weiterleitung old-link entfernen" }),
    );
    expect(
      screen.getByText("Noch keine Weiterleitungen angelegt."),
    ).toBeTruthy();
  });
});
