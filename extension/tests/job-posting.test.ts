import { describe, expect, it } from "vitest";
import { describeHeld, heldLabel, htmlToText, readJobPosting } from "../src/shared/job-posting";

const long = "You will build the payments platform end to end. ".repeat(8);

const graph = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", name: "Raydar" },
    {
      "@type": "JobPosting",
      title: "Senior Software Engineer",
      hiringOrganization: { "@type": "Organization", name: "Raydar" },
      jobLocation: [{ address: { addressLocality: "London", addressCountry: "GB" } }],
      description: `&lt;p&gt;${long}&lt;/p&gt;&lt;ul&gt;&lt;li&gt;React&lt;/li&gt;&lt;li&gt;Node &amp;amp; Postgres&lt;/li&gt;&lt;/ul&gt;`,
    },
  ],
});

describe("readJobPosting", () => {
  it("finds the posting inside a graph and turns escaped HTML into text", () => {
    const posting = readJobPosting(["not json", graph]);

    expect(posting).toMatchObject({ title: "Senior Software Engineer", company: "Raydar", location: "London, GB" });
    expect(posting?.description).toContain("• React");
    expect(posting?.description).toContain("Node & Postgres");
    expect(posting?.description).not.toContain("<");
  });

  it("returns nothing when the page has no job data", () => {
    expect(readJobPosting([JSON.stringify({ "@type": "WebSite" })])).toBeNull();
  });
});

describe("describeHeld", () => {
  it("prefers the structured description when it is long enough", () => {
    const text = describeHeld(readJobPosting([graph]), "Menu Sign in Apply now");

    expect(text.startsWith("Senior Software Engineer\nRaydar\nLondon, GB\n\n")).toBe(true);
  });

  it("falls back to the page text when the structured one is thin", () => {
    expect(describeHeld({ title: "X", company: "", location: "", description: "Short." }, "Page text")).toBe("Page text");
    expect(describeHeld(null, "Page text")).toBe("Page text");
  });
});

describe("helpers", () => {
  it("keeps line breaks from block tags", () => {
    expect(htmlToText("<p>One</p><p>Two</p>")).toBe("One\nTwo");
  });

  it("labels a held description with its site and age", () => {
    const held = { url: "https://apply.workable.com/raydar/j/C39C58F585/", title: "Senior Software Engineer", text: "x", savedAt: 0 };

    expect(heldLabel(held, 5 * 60_000)).toBe("Senior Software Engineer · apply.workable.com · saved 5 min ago");
    expect(heldLabel(held, 10_000)).toContain("saved just now");
  });
});
