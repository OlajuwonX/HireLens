import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const card = readFileSync(
  "features/applications/components/saved-job-card.tsx",
  "utf8",
);
const grid = readFileSync(
  "features/applications/components/application-card-grid.tsx",
  "utf8",
);
const repository = readFileSync(
  "features/applications/server/application.repository.ts",
  "utf8",
);
const actions = readFileSync(
  "features/applications/actions/application-actions.ts",
  "utf8",
);

describe("the confirm dialog survives the menu closing", () => {
  it("renders the dialog outside the menuOpen branch", () => {
    const menuBranch = card.indexOf("{menuOpen ? (");
    const menuBranchEnd = card.indexOf(") : null}", menuBranch);
    const dialog = card.indexOf("<Dialog open={confirmOpen}");

    expect(menuBranch).toBeGreaterThan(-1);
    expect(dialog).toBeGreaterThan(menuBranchEnd);
  });

  it("keeps the dialog open state separate from the menu open state", () => {
    expect(card).toContain("const [menuOpen, setMenuOpen]");
    expect(card).toContain("const [confirmOpen, setConfirmOpen]");
  });

  it("closes the menu and opens the dialog rather than nesting them", () => {
    expect(card).toContain(
      "setMenuOpen(false);\n                  setConfirmOpen(true);",
    );
  });
});

describe("archive and delete are optimistic", () => {
  it("hides the card before awaiting the server", () => {
    const setRemoved = card.indexOf("setRemoved(true)");
    const awaitDelete = card.indexOf("await deleteApplicationAction");

    expect(setRemoved).toBeGreaterThan(-1);
    expect(setRemoved).toBeLessThan(awaitDelete);
  });

  it("flips archive state before awaiting the server", () => {
    const setArchived = card.indexOf("setArchivedNow(next)");
    const awaitArchive = card.indexOf("await archiveApplicationAction");

    expect(setArchived).toBeGreaterThan(-1);
    expect(setArchived).toBeLessThan(awaitArchive);
  });

  it("toasts on both actions", () => {
    expect(card).toContain("notify.deleted(title)");
    expect(card).toContain("archived.");
    expect(card).toContain("restored.");
  });

  it("rolls back and reports failure", () => {
    expect(card).toContain("setRemoved(false)");
    expect(card).toContain("setArchivedNow(archived)");
    expect(card).toContain("could not be deleted.");
    expect(card).toContain("could not be archived.");
  });

  it("ignores the redirect control-flow throw", () => {
    expect(card).toContain("NEXT_REDIRECT");
  });

  it("leaves the current view once its archive state changes", () => {
    expect(card).toContain("if (removed || archivedNow !== archived)");
  });
});

describe("the card markup stays valid", () => {
  it("does not nest the menu button inside the card link", () => {
    expect(grid).not.toMatch(/<Link[^>]*>[\s\S]*<button/);
  });

  it("uses an overlay link so the whole card is still clickable", () => {
    expect(grid).toContain("before:absolute before:inset-0");
  });
});

describe("archived saved jobs are hidden unless filtered for", () => {
  it("excludes archived rows by default", () => {
    expect(repository).toContain("isNull(applications.archivedAt)");
  });

  it("shows only archived rows on the archived tab", () => {
    expect(repository).toContain('input.filters.tab === "ARCHIVED"');
    expect(repository).toContain("isNotNull(applications.archivedAt)");
  });

  it("counts archived separately from the three statuses", () => {
    expect(repository).toContain('row.archivedAt ? "ARCHIVED" : row.status');
  });

  it("does not redirect away from the current filters on delete", () => {
    const deleteAction = actions.slice(
      actions.indexOf("export async function deleteApplicationAction"),
      actions.indexOf("export async function archiveApplicationAction"),
    );

    expect(deleteAction).not.toContain("redirect(");
  });
});
