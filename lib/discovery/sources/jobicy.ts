import { dateFrom, employmentFrom, htmlToText } from "../normalize";
import { asArray, asRecord, httpUrl, id, isPosting, text } from "../read";
import type { BoardAdapter, DiscoveredPosting } from "../types";

const amount = (value: unknown) => (typeof value === "number" && value > 0 ? Math.round(value) : null);

function toPosting(raw: unknown): DiscoveredPosting | null {
  const job = asRecord(raw);
  const sourceId = id(job.id);
  const title = text(job.jobTitle);
  const company = text(job.companyName);
  const url = httpUrl(job.url);

  if (!sourceId || !title || !company || !url) {
    return null;
  }

  return {
    sourceId,
    title,
    company,
    location: text(job.jobGeo) ? `Remote - ${text(job.jobGeo)}` : "Remote",
    workArrangement: "REMOTE",
    employmentType: employmentFrom(asArray(job.jobType).map(String).join(" ")),
    salaryMin: amount(job.salaryMin),
    salaryMax: amount(job.salaryMax),
    currency: text(job.salaryCurrency),
    description: htmlToText(text(job.jobDescription)),
    url,
    applyUrl: url,
    postedAt: dateFrom(text(job.pubDate)),
  };
}

export const jobicy: BoardAdapter = {
  source: "JOBICY",
  boardUrl: () => "https://jobicy.com/api/v2/remote-jobs?count=100",
  async fetchBoard(token, fetchJson) {
    const jobs = asArray(asRecord(await fetchJson(this.boardUrl(token))).jobs);

    return { companyName: "Jobicy", postings: jobs.map(toPosting).filter(isPosting) };
  },
};
