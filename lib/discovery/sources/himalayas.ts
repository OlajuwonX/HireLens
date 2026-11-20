import { dateFrom, employmentFrom, htmlToText } from "../normalize";
import { asArray, asRecord, httpUrl, isPosting, text } from "../read";
import type { BoardAdapter, DiscoveredPosting } from "../types";

const PAGE_SIZE = 20;
const PAGES = 5;

const amount = (value: unknown) => (typeof value === "number" && value > 0 ? Math.round(value) : null);

function toPosting(raw: unknown): DiscoveredPosting | null {
  const job = asRecord(raw);
  const url = httpUrl(job.applicationLink) ?? httpUrl(job.guid);
  const sourceId = text(job.guid) ?? url;
  const title = text(job.title);
  const company = text(job.companyName);

  if (!sourceId || !title || !company || !url) {
    return null;
  }

  const regions = asArray(job.locationRestrictions).map(String).filter(Boolean);

  return {
    sourceId,
    title,
    company,
    location: regions.length > 0 ? `Remote - ${regions.join(", ")}` : "Remote",
    workArrangement: "REMOTE",
    employmentType: employmentFrom(text(job.employmentType)),
    salaryMin: amount(job.minSalary),
    salaryMax: amount(job.maxSalary),
    currency: text(job.currency),
    description: htmlToText(text(job.description)),
    url,
    applyUrl: url,
    postedAt: dateFrom(typeof job.pubDate === "number" ? job.pubDate * 1000 : null),
  };
}

export const himalayas: BoardAdapter = {
  source: "HIMALAYAS",
  boardUrl: () => "https://himalayas.app/jobs/api",
  async fetchBoard(token, fetchJson) {
    const pages = await Promise.all(
      Array.from({ length: PAGES }, (_, index) =>
        fetchJson(`${this.boardUrl(token)}?limit=${PAGE_SIZE}&offset=${index * PAGE_SIZE}`).catch(() => null),
      ),
    );

    return {
      companyName: "Himalayas",
      postings: pages.flatMap((page) => asArray(asRecord(page).jobs)).map(toPosting).filter(isPosting),
    };
  },
};
