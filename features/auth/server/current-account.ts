import "server-only";

import { cache } from "react";
import { findUserById } from "./user.repository";

export const getAccountRecord = cache(async (userId: string) =>
  findUserById(userId),
);
