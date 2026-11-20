import { arrangementFrom, dateFrom, employmentFrom, htmlToText } from "../normalize";
import { asArray, asRecord, httpUrl, isPosting, text } from "../read";
import type { BoardAdapter, DiscoveredPosting } from "../types";

const PAGES = 3;

function toPosting(raw: unknown): DiscoveredPosting | null {
  const job = asRecord(raw);
  const sourceId = text(job.slug);
  const title = text(job.title);
  const company = text(job.company_name);
  const url = httpUrl(job.url);

  if (!sourceId || !title || !company || !url) {
    return null;
  }

  const location = text(job.location);

  return {
    sourceId,
    title,
    company,
    location,
    workArrangement: job.remote === true ? "REMOTE" : arrangementFrom(null, `${title} ${location ?? ""}`),
    employmentType: employmentFrom(asArray(job.job_types).map(String).join(" ")),
    salaryMin: null,
    salaryMax: null,
    currency: null,
    description: htmlToText(text(job.description)),
    url,
    applyUrl: url,
    postedAt: dateFrom(typeof job.created_at === "number" ? job.created_at * 1000 : null),
  };
}

export const arbeitnow: BoardAdapter = {
  source: "ARBEITNOW",
  boardUrl: () => "https://www.arbeitnow.com/api/job-board-api",
  async fetchBoard(token, fetchJson) {
    const pages = await Promise.all(
      Array.from({ length: PAGES }, (_, index) => fetchJson(`${this.boardUrl(token)}?page=${index + 1}`).catch(() => null)),
    );

    return {
      companyName: "Arbeitnow",
      postings: pages.flatMap((page) => asArray(asRecord(page).data)).map(toPosting).filter(isPosting),
    };
  },
};
