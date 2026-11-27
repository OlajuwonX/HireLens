import { dateFrom, htmlToText } from "../normalize";
import { httpUrl, isPosting } from "../read";
import type { BoardAdapter, DiscoveredPosting } from "../types";
import { parseRssItems, rssTag as tag } from "./rss";

function toPosting(item: string): DiscoveredPosting | null {
  const heading = htmlToText(tag(item, "title"));
  const separator = heading.indexOf(":");
  const company = separator > 0 ? heading.slice(0, separator).trim() : "";
  const title = separator > 0 ? heading.slice(separator + 1).trim() : heading;
  const url = httpUrl(tag(item, "link"));
  const sourceId = tag(item, "guid") || url;

  if (!sourceId || !title || !company || !url) {
    return null;
  }

  const region = htmlToText(tag(item, "region"));

  return {
    sourceId,
    title,
    company,
    location: region ? `Remote - ${region}` : "Remote",
    workArrangement: "REMOTE",
    employmentType: "NOT_SPECIFIED",
    salaryMin: null,
    salaryMax: null,
    currency: null,
    description: htmlToText(tag(item, "description"), true),
    url,
    applyUrl: url,
    postedAt: dateFrom(tag(item, "pubDate")),
  };
}

export const weworkremotely: BoardAdapter = {
  source: "WEWORKREMOTELY",
  boardUrl: () => "https://weworkremotely.com/remote-jobs.rss",
  async fetchBoard(token, fetchJson) {
    const xml = await fetchJson(this.boardUrl(token), "text");

    return {
      companyName: "We Work Remotely",
      postings: parseRssItems(xml).map(toPosting).filter(isPosting),
    };
  },
};
