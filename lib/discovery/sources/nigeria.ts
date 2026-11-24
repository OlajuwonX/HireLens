import { arrangementFrom, dateFrom, htmlToText } from "../normalize";
import { httpUrl, isPosting } from "../read";
import type { BoardAdapter, DiscoveredPosting, FeedSource } from "../types";
import { nigerianLocation, splitHeading } from "./nigeria-heading";
import { parseRssItems, rssTag } from "./rss";

function toPosting(item: string): DiscoveredPosting | null {
  const heading = htmlToText(rssTag(item, "title"));
  const parts = splitHeading(heading);
  const url = httpUrl(rssTag(item, "link"));
  const sourceId = rssTag(item, "guid") || url;

  if (!parts || !url || !sourceId) {
    return null;
  }

  const description = htmlToText(rssTag(item, "description"), true);

  return {
    sourceId,
    title: parts.title,
    company: parts.company,
    location: nigerianLocation(description),
    workArrangement: arrangementFrom(null, `${heading}\n${description}`),
    employmentType: "NOT_SPECIFIED",
    salaryMin: null,
    salaryMax: null,
    currency: null,
    description,
    url,
    applyUrl: url,
    postedAt: dateFrom(rssTag(item, "pubDate")),
  };
}

function nigerianFeed(source: FeedSource, companyName: string, feedUrl: string): BoardAdapter {
  return {
    source,
    boardUrl: () => feedUrl,
    async fetchBoard(_token, fetchJson) {
      const xml = await fetchJson(feedUrl, "text");

      return { companyName, postings: parseRssItems(xml).map(toPosting).filter(isPosting) };
    },
  };
}

export const myjobmag = nigerianFeed("MYJOBMAG", "MyJobMag", "https://www.myjobmag.com/jobsxml.xml");

export const hotnigerianjobs = nigerianFeed(
  "HOTNIGERIANJOBS",
  "HotNigerianJobs",
  "https://www.hotnigerianjobs.com/feed/rss.xml",
);
