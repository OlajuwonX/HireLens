import { detectSalary } from "@/lib/jobs/parse-job-posting";
import {
  MAX_POSTINGS_PER_BOARD,
  arrangementFrom,
  companyFromToken,
  dateFrom,
  employmentFrom,
  htmlToText,
} from "../normalize";
import { asArray, asRecord, httpUrl, id, isPosting, text } from "../read";
import type { BoardAdapter, DiscoveredPosting } from "../types";

function toPosting(raw: unknown, company: string, token: string): DiscoveredPosting | null {
  const job = asRecord(raw);
  const location = text(asRecord(job.location).name);
  const description = htmlToText(text(job.content), true);
  const title = text(job.title);
  const sourceId = id(job.id);
  const url = httpUrl(job.absolute_url);

  if (!sourceId || !title || !url) {
    return null;
  }

  const salary = detectSalary(description);

  return {
    sourceId,
    title,
    company,
    location,
    workArrangement: arrangementFrom(null, `${title} ${location ?? ""}`),
    employmentType: employmentFrom(title),
    salaryMin: salary?.salaryMin ?? null,
    salaryMax: salary?.salaryMax ?? null,
    currency: salary?.currency ?? null,
    description,
    url,
    applyUrl: `https://boards.greenhouse.io/${encodeURIComponent(token)}/jobs/${encodeURIComponent(sourceId)}`,
    postedAt: dateFrom(text(job.first_published) ?? text(job.updated_at)),
  };
}

export const greenhouse: BoardAdapter = {
  source: "GREENHOUSE",
  boardUrl: (token) =>
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs?content=true`,
  async fetchBoard(token, fetchJson) {
    const jobs = asArray(asRecord(await fetchJson(this.boardUrl(token))).jobs);
    const company = text(asRecord(jobs[0]).company_name) ?? companyFromToken(token);

    return {
      companyName: company,
      postings: jobs
        .slice(0, MAX_POSTINGS_PER_BOARD)
        .map((job) => toPosting(job, company, token))
        .filter(isPosting),
    };
  },
};
