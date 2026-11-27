import { describe, expect, it, vi } from "vitest";
import { SYSTEM_BOARDS } from "@/lib/discovery/catalog";
import { readRegions } from "@/lib/discovery/regions";
import { adapters } from "@/lib/discovery/sources";
import { nigerianLocation, splitHeading } from "@/lib/discovery/sources/nigeria-heading";

const serve = (payload: unknown) => vi.fn(async (_url: string, _as?: "json" | "text") => payload);

const myJobMagFeed = `<?xml version="1.0"?><rss><channel>
<item><title><![CDATA[Frontend Developer at Paystack]]></title><link><![CDATA[https://www.myjobmag.com/jobs/frontend-developer-at-paystack]]></link><guid isPermaLink="false"><![CDATA[https://www.myjobmag.com/jobs/frontend-developer-at-paystack]]></guid><pubDate>Mon, 23 Nov 2026 19:55:56 GMT</pubDate><description><![CDATA[<p>Build React apps. The role is hybrid in Lagos.</p>]]></description></item>
<item><title><![CDATA[Jobs at The Elev8]]></title><link><![CDATA[https://www.myjobmag.com/jobs/the-elev8]]></link><guid><![CDATA[https://www.myjobmag.com/jobs/the-elev8]]></guid></item>
</channel></rss>`;

const hotNigerianJobsFeed = `<rss version="2.0"><channel>
<item>
  <title>Data Entry Officer (Oyo) at Moniepoint Incorporated - Hybrid (2 Openings)</title>
  <link>https://www.hotnigerianjobs.com/hotjobs/1/data-entry.html</link>
  <guid>https://www.hotnigerianjobs.com/hotjobs/1/data-entry.html</guid>
  <description>Moniepoint is recruiting. The position is located in Oyo State.</description>
  <pubDate>Mon, 23 Nov 2026 18:24:03 +0100</pubDate>
</item>
<item>
  <title>Dangote Industries Limited Job Recruitment (51 Positions)</title>
  <link>https://www.hotnigerianjobs.com/hotjobs/2/dangote.html</link>
  <guid>https://www.hotnigerianjobs.com/hotjobs/2/dangote.html</guid>
</item>
</channel></rss>`;

describe("splitHeading", () => {
  it.each([
    ["Frontend Developer at Paystack", { title: "Frontend Developer", company: "Paystack" }],
    [
      "Field Credit Officer (Edo) at Moniepoint Incorporated - 3 Openings",
      { title: "Field Credit Officer (Edo)", company: "Moniepoint Incorporated" },
    ],
    [
      "Data Entry Officer (Delta) - Hybrid at Moniepoint Incorporated",
      { title: "Data Entry Officer (Delta)", company: "Moniepoint Incorporated" },
    ],
    [
      "Data Entry Officer (Oyo) at Moniepoint Incorporated - Hybrid (2 Openings)",
      { title: "Data Entry Officer (Oyo)", company: "Moniepoint Incorporated" },
    ],
  ])("splits %s", (heading, expected) => {
    expect(splitHeading(heading)).toEqual(expected);
  });

  it.each(["Jobs at The Elev8", "Dangote Industries Limited Job Recruitment (51 Positions)", "Dispatch Rider", ""])(
    "skips round-ups and headings without a company: %s",
    (heading) => {
      expect(splitHeading(heading)).toBeNull();
    },
  );
});

describe("nigerianLocation", () => {
  it("reads the stated location or falls back to Nigeria", () => {
    expect(nigerianLocation("The position is located in Lagos State.")).toBe("Lagos State, Nigeria");
    expect(nigerianLocation("Apply now.")).toBe("Nigeria");
  });
});

describe("MyJobMag", () => {
  it("maps single roles and skips company round-ups", async () => {
    const fetch = serve(myJobMagFeed);
    const { companyName, postings } = await adapters.MYJOBMAG.fetchBoard("all", fetch);

    expect(fetch).toHaveBeenCalledWith("https://www.myjobmag.com/jobsxml.xml", "text");
    expect(companyName).toBe("MyJobMag");
    expect(postings).toHaveLength(1);
    expect(postings[0]).toMatchObject({
      title: "Frontend Developer",
      company: "Paystack",
      location: "Nigeria",
      workArrangement: "HYBRID",
      description: "Build React apps. The role is hybrid in Lagos.",
    });
    expect(postings[0].postedAt?.toISOString()).toBe("2026-11-23T19:55:56.000Z");
  });
});

describe("HotNigerianJobs", () => {
  it("cleans opening counts and reads the location", async () => {
    const { postings } = await adapters.HOTNIGERIANJOBS.fetchBoard("all", serve(hotNigerianJobsFeed));

    expect(postings).toHaveLength(1);
    expect(postings[0]).toMatchObject({
      title: "Data Entry Officer (Oyo)",
      company: "Moniepoint Incorporated",
      location: "Oyo State, Nigeria",
      workArrangement: "HYBRID",
      applyUrl: "https://www.hotnigerianjobs.com/hotjobs/1/data-entry.html",
    });
  });
});

describe("the Nigerian catalog", () => {
  it("marks every Nigerian source with its region", () => {
    const nigerian = SYSTEM_BOARDS.filter((board) => board.region === "NG").map(
      (board) => `${board.source}:${board.token}`,
    );

    expect(nigerian).toEqual(
      expect.arrayContaining([
        "MYJOBMAG:all",
        "HOTNIGERIANJOBS:all",
        "GREENHOUSE:moniepoint",
        "ASHBY:andela",
        "ASHBY:lemfi",
      ]),
    );
    expect(SYSTEM_BOARDS.find((board) => board.source === "REMOTIVE")?.region).toBeUndefined();
  });

  it("keeps only known regions", () => {
    expect(readRegions(["NG", "XX"])).toEqual(["NG"]);
    expect(readRegions(null)).toEqual([]);
  });
});
