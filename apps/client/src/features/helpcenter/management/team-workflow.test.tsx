import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import TeamWorkflow from "./team-workflow";
import { GlassTooltipProvider } from "./laightup-ui";
beforeAll(() =>
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  ),
);
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const doc = {
  kind: "article",
  id: "example",
  title: "Display verbinden",
  description: "Ein Display anmelden.",
  body: "Den Code eingeben.",
  audience: "Alle Teams",
  outcome: "Online",
  tags: [],
  group: "start",
  changes: [],
};
const proposal = {
  id: "review-one",
  title: doc.title,
  pageId: doc.id,
  kind: "article",
  at: "2026-11-02T10:00:00Z",
  status: "pending",
  version: 1,
  author: { id: "author", name: "Autor" },
};
function setup({
  mode = "session",
  actor = "reviewer",
  stale = false,
  view = "reviews",
} = {}) {
  const fetcher = vi.fn(async (input, options) => {
    const route = String(input);
    let value;
    if (route.endsWith("/access"))
      value = {
        mode,
        token: "token",
        actor: { id: actor, name: "Prüfer", role: "reviewer" },
        capabilities: ["read", "comment", "edit", "review"],
        members: [],
        revision: "r",
      };
    else if (route.endsWith("/reviews"))
      value = { requests: [proposal], audit: [] };
    else if (route.includes("/review?id="))
      value = {
        ...proposal,
        document: { ...doc, body: "Den Registrierungscode eingeben." },
        before: doc,
        stale,
        localSelfReview: mode === "local",
        comments: [],
      };
    else if (route.endsWith("/review-decide"))
      value = {
        ...proposal,
        document: doc,
        before: doc,
        status: "rejected",
        stale: false,
        comments: [],
      };
    return { ok: true, json: async () => value };
  });
  vi.stubGlobal("fetch", fetcher);
  render(
    <MemoryRouter>
      <GlassTooltipProvider>
        <TeamWorkflow view={view as "reviews" | "access"} />
      </GlassTooltipProvider>
    </MemoryRouter>,
  );
  return fetcher;
}
describe("review and access UI", () => {
  it("shows the submitted comparison and sends a reasoned revision-bound review decision", async () => {
    const fetcher = setup();
    await screen
      .findByRole("button", { name: /Display verbinden/ })
      .then((button) => fireEvent.click(button));
    await screen.findByRole("heading", { name: "Eingereichte Änderungen" });
    expect(
      screen
        .getByRole("button", { name: "Freigeben und übernehmen" })
        .hasAttribute("disabled"),
    ).toBe(false);
    fireEvent.change(
      screen.getByRole("textbox", { name: "Kommentar oder Begründung" }),
      { target: { value: "Bitte den Code genauer erklären." } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Überarbeitung anfordern" }),
    );
    await waitFor(() =>
      expect(fetcher).toHaveBeenCalledWith(
        "/__help-editor/review-decide",
        expect.objectContaining({
          body: JSON.stringify({
            id: "review-one",
            version: 1,
            action: "reject",
            comment: "Bitte den Code genauer erklären.",
          }),
        }),
      ),
    );
  });
  it("prevents authors from approving themselves and disables stale publication", async () => {
    setup({ actor: "author", stale: true });
    fireEvent.click(
      await screen.findByRole("button", { name: /Display verbinden/ }),
    );
    expect(
      (
        await screen.findByRole("button", { name: "Freigeben und übernehmen" })
      ).hasAttribute("disabled"),
    ).toBe(true);
    expect(screen.getByText(/Eine andere Person muss/)).toBeTruthy();
    expect(
      screen.getByText(/Die Quelle wurde seit dem Einreichen/),
    ).toBeTruthy();
  });
  it("describes local operation honestly without invented team members", async () => {
    setup({ mode: "local", view: "access" });
    await screen.findByRole("heading", { name: "Zugriff auf die Redaktion" });
    expect(
      screen.getByText(/Hier arbeitet eine lokale Redaktion/),
    ).toBeTruthy();
    expect(
      screen.queryByRole("heading", { name: "Workspace-Mitglieder" }),
    ).toBeNull();
  });
});
