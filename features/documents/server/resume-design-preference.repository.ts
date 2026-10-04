import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import type { ResumeDesignSelection } from "@/lib/resume-design";

export async function findResumeDesignPreference(userId: string) {
  const [preference] = await db
    .select({
      template: users.preferredResumeTemplate,
      typography: users.preferredResumeTypography,
      spacing: users.preferredResumeSpacing,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return preference ?? null;
}

export async function updateResumeDesignPreference(input: {
  userId: string;
  selection: ResumeDesignSelection;
}) {
  await db
    .update(users)
    .set({
      preferredResumeTemplate: input.selection.template,
      preferredResumeTypography: input.selection.typography,
      preferredResumeSpacing: input.selection.spacing,
      updatedAt: new Date(),
    })
    .where(eq(users.id, input.userId));
}
