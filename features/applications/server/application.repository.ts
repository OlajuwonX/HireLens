import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { applications } from "@/lib/db/schema";

export async function findApplicationForUser(input: {
  userId: string;
  publicId: string;
}) {
  const [application] = await db
    .select()
    .from(applications)
    .where(
      and(
        eq(applications.userId, input.userId),
        eq(applications.publicId, input.publicId),
      ),
    )
    .limit(1);

  return application ?? null;
}
