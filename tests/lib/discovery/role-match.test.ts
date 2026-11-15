import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";
import { jobPostings } from "@/lib/db/schema";
import { buildRoleMatcher, normalizeTitle, titleMatches } from "@/lib/discovery/role-match";

vi.mock("server-only", () => ({}));

const { titleMatchesSql } = await import("@/features/discovery/server/role-sql");

const matches = (roles: string[], title: string) => titleMatches(buildRoleMatcher(roles), title);

describe("titleMatches", () => {
  it.each([
    ["Frontend Engineer", "Senior Frontend Engineer"],
    ["Frontend Engineer", "Front-End Developer (React)"],
    ["Frontend Developer", "Staff Front End Engineer, Payments"],
    ["React Developer", "Software Engineer, React"],
    ["React Native Developer", "React Native Engineer"],
    ["Full Stack Engineer", "Fullstack Developer"],
    ["Product Designer", "Senior Product Designer"],
  ])("%s finds %s", (role, title) => {
    expect(matches([role], title)).toBe(true);
  });

  it.each([
    ["Frontend Engineer", "Backend Engineer"],
    ["Frontend Engineer", "Frontend Engineering Manager"],
    ["React Developer", "Reactor Physicist"],
    ["React Native Developer", "React Engineer"],
    ["Product Designer", "Product Manager"],
  ])("%s ignores %s", (role, title) => {
    expect(matches([role], title)).toBe(false);
  });

  it("matches when any of several roles fits", () => {
    expect(matches(["Backend Engineer", "Frontend Engineer"], "Frontend Developer")).toBe(true);
  });

  it("matches nothing without roles", () => {
    expect(matches([], "Frontend Engineer")).toBe(false);
  });

  it("ignores seniority words in the target role", () => {
    expect(matches(["Senior Frontend Engineer"], "Frontend Engineer")).toBe(true);
  });

  it("normalizes punctuation and case", () => {
    expect(normalizeTitle("  Sr. Front-End/UI  Engineer ")).toBe("sr front end ui engineer");
  });
});

describe("titleMatchesSql", () => {
  const render = (roles: string[]) => new PgDialect().sqlToQuery(titleMatchesSql(buildRoleMatcher(roles), jobPostings.title));

  it("matches whole words of every term, with synonyms", () => {
    const query = render(["Frontend Engineer"]);

    expect(query.params).toEqual(["% frontend %", "% front end %", "% engineer %", "% developer %", "% programmer %"]);
    expect(query.sql).toContain("regexp_replace(lower(\"job_postings\".\"title\"), '[^a-z0-9]+', ' ', 'g')");
  });

  it("escapes like wildcards in role text", () => {
    expect(render(["C_100%"]).params).toEqual(["% c %", "% 100 %"]);
    expect(render(["50%_off"]).params.every((param) => !/[^\\][%_](?!$)/.test(String(param).slice(1, -1)))).toBe(true);
  });

  it("matches nothing without roles", () => {
    expect(render([]).sql).toBe("false");
  });
});
