import "server-only";

export type UserOwnedInput = {
  userId: string;
};

export function assertUserOwnsResource(
  currentUserId: string,
  resource: UserOwnedInput | null | undefined,
): asserts resource is UserOwnedInput {
  if (!resource || resource.userId !== currentUserId) {
    throw new Error("Forbidden");
  }
}
