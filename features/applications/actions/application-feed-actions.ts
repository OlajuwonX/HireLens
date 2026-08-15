"use server";

import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { getApplicationBoard } from "@/features/applications/server/application.service";
import { applicationFiltersSchema } from "../schemas/application.schema";
import { APPLICATION_PAGE_SIZE } from "../constants";
import type { ApplicationListRow } from "../server/application.repository";

export type ApplicationFeedPage = {
  rows: ApplicationListRow[];
  nextOffset: number | null;
};

export async function loadMoreApplicationsAction(input: {
  offset: number;
  filters: unknown;
}): Promise<ApplicationFeedPage> {
  const user = await requireDatabaseUser();
  const parsed = applicationFiltersSchema.safeParse(input.filters);

  if (!parsed.success) {
    return { rows: [], nextOffset: null };
  }

  const offset =
    Number.isFinite(input.offset) && input.offset > 0
      ? Math.floor(input.offset)
      : 0;

  const rows = await getApplicationBoard({
    userId: user.id,
    filters: parsed.data,
    limit: APPLICATION_PAGE_SIZE + 1,
    offset,
  });

  const page = rows.slice(0, APPLICATION_PAGE_SIZE);
  const nextOffset =
    rows.length > APPLICATION_PAGE_SIZE ? offset + APPLICATION_PAGE_SIZE : null;

  return { rows: page, nextOffset };
}
