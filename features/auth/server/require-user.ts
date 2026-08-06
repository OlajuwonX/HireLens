import "server-only";

import { redirect } from "next/navigation";
import { getCurrentUser } from "./current-user";

export async function requireCurrentUser() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/sign-in");
  }

  return currentUser;
}
