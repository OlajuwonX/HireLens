import "server-only";

import { compare, hash } from "bcryptjs";

const SALT_ROUNDS = 12;

export async function hashPassword(plainText: string) {
  return hash(plainText, SALT_ROUNDS);
}

export async function verifyPassword(plainText: string, passwordHash: string) {
  return compare(plainText, passwordHash);
}
