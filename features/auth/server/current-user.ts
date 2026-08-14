import "server-only";

import { auth } from "@/auth";
import type {
  PublicAccountState,
  PublicUser,
} from "@/features/auth/types/public-user";
import { mapSessionToPublicUser } from "./public-user";

export type CurrentUser = {
  user: PublicUser;
  account: PublicAccountState;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  return {
    user: mapSessionToPublicUser(session),
    account: session.account,
  };
}
