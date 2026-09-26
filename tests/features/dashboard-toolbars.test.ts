import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(file, "utf8");

const PAGES = {
  jobs: "app/(dashboard)/dashboard/jobs/page.tsx",
  documents: "app/(dashboard)/dashboard/documents/page.tsx",
  resumes: "app/(dashboard)/dashboard/resumes/page.tsx",
};

const TOOLBARS = {
  jobs: "features/applications/components/application-filters.tsx",
  documents: "features/documents/components/document-filters.tsx",
  resumes: "features/resumes/components/resume-list.tsx",
};

describe("per-page search is gone", () => {
  it.each(Object.entries(TOOLBARS))("%s toolbar has no search input", (_name, file) => {
    const source = read(file);

    expect(source).not.toContain("DebouncedSearch");
    expect(source).not.toContain("SearchInput");
    expect(source).not.toContain("Search saved jobs");
    expect(source).not.toContain("Search AI documents");
    expect(source).not.toContain("Search job titles");
  });

  it.each(Object.entries(PAGES))("%s page no longer reads a search term", (_name, file) => {
    const source = read(file);

    expect(source).not.toContain("raw.q");
    expect(source).not.toContain('readParam(raw, "q")');
    expect(source).not.toContain("filters.q");
  });

  it("removed the search term from every filter type and query", () => {
    expect(read("features/applications/schemas/application.schema.ts")).not.toMatch(
      /applicationFiltersSchema = z\.object\(\{\s*q:/,
    );
    expect(read("features/documents/actions/document-feed-actions.ts")).not.toContain("q: z.");
    expect(read("features/documents/components/document-feed.tsx")).not.toContain("q: string");
    expect(read("features/documents/server/document.repository.ts")).not.toContain("filters.q");
    expect(read("features/applications/server/application.repository.ts")).not.toContain("filters.q");
  });

  it("heals a stale q in the URL the next time a filter changes", () => {
    expect(read(TOOLBARS.jobs)).toContain('search.delete("q")');
    expect(read(TOOLBARS.documents)).toContain('search.delete("q")');
  });
});

describe("the shared search components stay for admin", () => {
  it.each([
    "features/admin/components/user-search-input.tsx",
    "features/admin/components/audit-log-filters.tsx",
    "features/bug-reports/components/bug-report-filters.tsx",
  ])("%s still uses DebouncedSearch", (file) => {
    expect(read(file)).toContain("DebouncedSearch");
  });
});

describe("filters take the search slot and the primary button sits beside them", () => {
  it("jobs: Create application is passed into the toolbar, not the page header", () => {
    const page = read(PAGES.jobs);

    expect(page).toMatch(/<ApplicationFilters[\s\S]*action=\{<CreateApplicationButton \/>\}/);
    expect(page).not.toMatch(/<PageHeader[^>]*action=/);
  });

  it("documents: Go to Saved Jobs is passed into the toolbar", () => {
    const page = read(PAGES.documents);

    expect(page).toContain("<DocumentFilters action={<GoToSavedJobsButton />} />");
    expect(page).not.toMatch(/<PageHeader[^>]*action=/);
  });

  it("resumes: Add resume is passed into the list toolbar", () => {
    const page = read(PAGES.resumes);

    expect(page).toMatch(/<ResumeList[\s\S]*action=\{[\s\S]*<AddResumeDialog/);
    const header = page.match(/<PageHeader[\s\S]*?\/>/)?.[0] ?? "";

    expect(header).toContain('title="Resumes"');
    expect(header).not.toContain("AddResumeDialog");
    expect(header).not.toContain("action=");
  });

  it("keeps the page titles that drive the header", () => {
    expect(read(PAGES.jobs)).toContain('title="Saved Jobs"');
    expect(read(PAGES.documents)).toContain('title="AI Documents"');
    expect(read(PAGES.resumes)).toContain('title="Resumes"');
  });

  it.each(Object.entries(TOOLBARS))("%s toolbar puts the button first on mobile and last on desktop", (_name, file) => {
    const source = read(file);

    expect(source).toContain("flex-col-reverse");
    expect(source).toContain("sm:flex-row");
    expect(source).toContain("sm:justify-between");
    expect(source).toContain("{action}");
  });

  it("resumes still offers Add resume when there are no resumes at all", () => {
    const source = read(TOOLBARS.resumes);

    expect(source).toMatch(/resumes\.length === 0[\s\S]*action=\{action\}/);
  });

  it("the primary buttons are full width on mobile", () => {
    expect(read(PAGES.jobs)).toContain('className="w-full sm:w-auto"');
    expect(read(PAGES.documents)).toContain('className="w-full sm:w-auto"');
    expect(read(PAGES.resumes)).toContain("w-full justify-center sm:w-auto");
  });
});

describe("empty states tell the truth", () => {
  it("jobs no longer keys its empty state on a search term", () => {
    const page = read(PAGES.jobs);

    expect(page).toContain("resolveJobsEmptyState");
    expect(page).toContain("Nothing matches those filters");
  });

  it("documents empty state copy no longer mentions search", () => {
    expect(read(PAGES.documents)).not.toContain("different search");
  });
});

describe("header search button is noticeable on desktop", () => {
  const trigger = read("features/search/components/search-trigger.tsx");

  it("has a fixed width that grows with the screen", () => {
    expect(trigger).toContain("sm:w-44");
    expect(trigger).toContain("md:w-52");
    expect(trigger).toContain("lg:w-72");
    expect(trigger).toContain("xl:w-96");
  });

  it("shows a descriptive prompt on large screens and pins the shortcut right", () => {
    expect(trigger).toContain("Search resumes, jobs, documents");
    expect(trigger).toContain("ml-auto");
  });

  it("stays an icon on mobile", () => {
    expect(trigger).toContain("sm:hidden");
  });
});
