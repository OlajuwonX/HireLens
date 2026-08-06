import "server-only";

import type { PublicUser } from "@/features/auth/types/public-user";
import type { Session } from "next-auth";

export function mapSessionToPublicUser(session: Session): PublicUser {
  return {
    name: session.user?.name ?? null,
    email: session.user?.email ?? null,
    image: session.user?.image ?? null,
  };
}
