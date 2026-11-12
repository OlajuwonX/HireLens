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

function describe(job: Record<string, unknown>) {
  const lists = asArray(job.lists).map((item) => {
    const list = asRecord(item);
    return `${text(list.text) ?? ""}\n${htmlToText(text(list.content))}`;
  });

  return tidy([text(job.descriptionPlain), ...lists, text(job.additionalPlain)].filter(Boolean).join("\n\n"));
}

function toPosting(raw: unknown, company: string): DiscoveredPosting | null {
  const job = asRecord(raw);
  const categories = asRecord(job.categories);
  const location = text(categories.location);
  const salary = asRecord(job.salaryRange);
  const title = text(job.text);
  const sourceId = id(job.id);
  const url = httpUrl(job.hostedUrl);

  if (!sourceId || !title || !url) {
    return null;
  }

  return {
    sourceId,
    title,
    company,
    location,
    workArrangement: arrangementFrom(text(job.workplaceType), `${title} ${location ?? ""}`),
    employmentType: employmentFrom(text(categories.commitment)),
    salaryMin: typeof salary.min === "number" ? salary.min : null,
    salaryMax: typeof salary.max === "number" ? salary.max : null,
    currency: text(salary.currency),
    description: describe(job),
    url,
    applyUrl: httpUrl(job.applyUrl),
    postedAt: dateFrom(typeof job.createdAt === "number" ? job.createdAt : null),
  };
}

export const lever: BoardAdapter = {
  source: "LEVER",
  boardUrl: (token) => `https://api.lever.co/v0/postings/${encodeURIComponent(token)}?mode=json`,
  async fetchBoard(token, fetchJson) {
    const company = companyFromToken(token);
    const jobs = asArray(await fetchJson(this.boardUrl(token)));

    return {
      companyName: company,
      postings: jobs
        .slice(0, MAX_POSTINGS_PER_BOARD)
        .map((job) => toPosting(job, company))
        .filter(isPosting),
    };
  },
};
