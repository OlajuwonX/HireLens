import {
  buildPaletteSections,
  flattenSections,
} from "@/features/search/palette-items";
import { parseSearchResponse } from "@/features/search/parse-response";
import { buildCommands } from "@/features/search/registry";
import { EMPTY_SEARCH_RESPONSE } from "@/features/search/types";
import { describe, expect, it } from "vitest";

const id = "123e4567-e89b-12d3-a456-426614174000";
const commands = buildCommands({ isAdmin: false });

const response = {
  resumes: [{ id, kind: "resume" as const, title: "Frontend", subtitle: "Resume", href: `/dashboard/resumes/${id}` }],
  jobs: [{ id, kind: "job" as const, title: "Engineer", subtitle: "Acme", href: `/dashboard/jobs?open=${id}` }],
  documents: [],
};

describe("buildPaletteSections", () => {
  it("shows recent searches then quick actions when the query is empty", () => {
    const sections = buildPaletteSections({
      query: "",
      recents: ["cover letter", "react"],
      commands,
      response: EMPTY_SEARCH_RESPONSE,
      responseReady: false,
    });

    expect(sections.map((section) => section.key)).toEqual(["recent", "quick"]);
    expect(sections[0]!.items.map((item) => item.title)).toEqual([
      "cover letter",
      "react",
    ]);
    expect(sections[0]!.items.every((item) => item.href === null)).toBe(true);
  });

  it("omits the recents section when there is no history", () => {
    const sections = buildPaletteSections({
      query: "",
      recents: [],
      commands,
      response: EMPTY_SEARCH_RESPONSE,
      responseReady: false,
    });

    expect(sections.map((section) => section.key)).toEqual(["quick"]);
  });

  it("treats a too-short query as empty", () => {
    const sections = buildPaletteSections({
      query: "a",
      recents: [],
      commands,
      response,
      responseReady: true,
    });

    expect(sections.map((section) => section.key)).toEqual(["quick"]);
  });

  it("shows matching commands immediately, before data results arrive", () => {
    const sections = buildPaletteSections({
      query: "password",
      recents: [],
      commands,
      response: EMPTY_SEARCH_RESPONSE,
      responseReady: false,
    });

    expect(sections.map((section) => section.key)).toEqual(["commands"]);
    expect(sections[0]!.items[0]!.title).toBe("Add or change password");
  });

  it("adds data groups only once the response is ready", () => {
    const pending = buildPaletteSections({
      query: "front",
      recents: [],
      commands,
      response,
      responseReady: false,
    });
    const ready = buildPaletteSections({
      query: "front",
      recents: [],
      commands,
      response,
      responseReady: true,
    });

    expect(pending.some((section) => section.key === "resumes")).toBe(false);
    expect(ready.map((section) => section.key)).toEqual(
      expect.arrayContaining(["resumes", "jobs"]),
    );
    expect(ready.some((section) => section.key === "documents")).toBe(false);
  });

  it("gives every item a unique id and flattens in display order", () => {
    const sections = buildPaletteSections({
      query: "front",
      recents: [],
      commands,
      response,
      responseReady: true,
    });
    const items = flattenSections(sections);
    const ids = items.map((item) => item.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(items.map((item) => item.kind)).toEqual(
      sections.flatMap((section) => section.items.map((item) => item.kind)),
    );
  });

  it("never offers admin commands to a non-admin", () => {
    const sections = buildPaletteSections({
      query: "admin",
      recents: [],
      commands,
      response: EMPTY_SEARCH_RESPONSE,
      responseReady: true,
    });

    expect(flattenSections(sections)).toEqual([]);
  });
});

describe("parseSearchResponse", () => {
  it("accepts a well-formed response", () => {
    expect(parseSearchResponse(response)).toEqual(response);
  });

  it("returns an empty response for garbage", () => {
    expect(parseSearchResponse(null)).toEqual(EMPTY_SEARCH_RESPONSE);
    expect(parseSearchResponse("x")).toEqual(EMPTY_SEARCH_RESPONSE);
    expect(parseSearchResponse({ resumes: "no" })).toEqual(EMPTY_SEARCH_RESPONSE);
  });

  it("drops items with unsafe or external links", () => {
    const parsed = parseSearchResponse({
      resumes: [
        { id: "1", kind: "resume", title: "ok", subtitle: null, href: "/dashboard/resumes/1" },
        { id: "2", kind: "resume", title: "evil", subtitle: null, href: "https://evil.example.com" },
        { id: "3", kind: "resume", title: "proto", subtitle: null, href: "//evil.example.com" },
        { id: "4", kind: "resume", title: "js", subtitle: null, href: "javascript:alert(1)" },
      ],
      jobs: [],
      documents: [],
    });

    expect(parsed.resumes.map((item) => item.title)).toEqual(["ok"]);
  });

  it("drops items with a wrong shape or unknown kind", () => {
    const parsed = parseSearchResponse({
      resumes: [
        { id: 1, kind: "resume", title: "bad id", href: "/a" },
        { id: "x", kind: "admin", title: "bad kind", href: "/a" },
        { id: "y", kind: "resume", href: "/a" },
        null,
        "string",
      ],
      jobs: [],
      documents: [],
    });

    expect(parsed.resumes).toEqual([]);
  });

  it("normalises a missing subtitle to null", () => {
    const parsed = parseSearchResponse({
      resumes: [{ id: "1", kind: "resume", title: "t", href: "/dashboard/resumes/1" }],
      jobs: [],
      documents: [],
    });

    expect(parsed.resumes[0]!.subtitle).toBeNull();
  });
});
