import { detectSalary } from "@/lib/jobs/parse-job-posting";
import {
  MAX_POSTINGS_PER_BOARD,
  arrangementFrom,
  companyFromToken,
  dateFrom,
  employmentFrom,
  htmlToText,
  tidy,
} from "../normalize";
import { asArray, asRecord, httpUrl, id, isPosting, text } from "../read";
import type { BoardAdapter, DiscoveredPosting } from "../types";

function toPosting(raw: unknown, company: string): DiscoveredPosting | null {
  const job = asRecord(raw);
  const title = text(job.title);
  const sourceId = id(job.id);
  const url = httpUrl(job.jobUrl);

  if (!sourceId || !title || !url || job.isListed === false) {
    return null;
  }

  const location = text(job.location);
  const pay = text(asRecord(job.compensation).compensationTierSummary);
  const salary = pay ? detectSalary(pay) : null;
  const arrangement = text(job.workplaceType) ?? (job.isRemote === true ? "remote" : null);

  return {
    sourceId,
    title,
    company,
    location,
    workArrangement: arrangementFrom(arrangement, `${title} ${location ?? ""}`),
    employmentType: employmentFrom(text(job.employmentType)),
    salaryMin: salary?.salaryMin ?? null,
    salaryMax: salary?.salaryMax ?? null,
    currency: salary?.currency ?? null,
    description: tidy(text(job.descriptionPlain)) || htmlToText(text(job.descriptionHtml)),
    url,
    applyUrl: httpUrl(job.applyUrl),
    postedAt: dateFrom(text(job.publishedAt)),
  };
}

export const ashby: BoardAdapter = {
  source: "ASHBY",
  boardUrl: (token) =>
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(token)}?includeCompensation=true`,
  async fetchBoard(token, fetchJson) {
    const company = companyFromToken(token);
    const jobs = asArray(asRecord(await fetchJson(this.boardUrl(token))).jobs);

    return {
      companyName: company,
      postings: jobs
        .slice(0, MAX_POSTINGS_PER_BOARD)
        .map((job) => toPosting(job, company))
        .filter(isPosting),
    };
  },
};
