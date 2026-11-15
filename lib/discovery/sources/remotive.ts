import { detectSalary } from "@/lib/jobs/parse-job-posting";
import { MAX_POSTINGS_PER_BOARD, dateFrom, employmentFrom, htmlToText } from "../normalize";
import { asArray, asRecord, httpUrl, id, isPosting, text } from "../read";
import type { BoardAdapter, DiscoveredPosting } from "../types";

function toPosting(raw: unknown): DiscoveredPosting | null {
  const job = asRecord(raw);
  const sourceId = id(job.id);
  const title = text(job.title);
  const company = text(job.company_name);
  const url = httpUrl(job.url);

  if (!sourceId || !title || !company || !url) {
    return null;
  }

  const salary = detectSalary(text(job.salary) ?? "");
  const published = text(job.publication_date);

  return {
    sourceId,
    title,
    company,
    location: text(job.candidate_required_location) ?? "Remote",
    workArrangement: "REMOTE",
    employmentType: employmentFrom((text(job.job_type) ?? "").replace(/_/g, " ")),
    salaryMin: salary?.salaryMin ?? null,
    salaryMax: salary?.salaryMax ?? null,
    currency: salary?.currency ?? null,
    description: htmlToText(text(job.description)),
    url,
    applyUrl: url,
    postedAt: dateFrom(published && !/[zZ]|[+-]\d\d:?\d\d$/.test(published) ? `${published}Z` : published),
  };
}

export const remotive: BoardAdapter = {
  source: "REMOTIVE",
  boardUrl: () => "https://remotive.com/api/remote-jobs",
  async fetchBoard(token, fetchJson) {
    const jobs = asArray(asRecord(await fetchJson(this.boardUrl(token))).jobs);

    return {
      companyName: "Remotive",
      postings: jobs.map(toPosting).filter(isPosting).slice(0, MAX_POSTINGS_PER_BOARD * 4),
    };
  },
};
