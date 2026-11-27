import "server-only";

import { findProfileByUser, saveJobRegions } from "@/features/candidate-profile/server/profile.repository";
import { readRegions, type JobRegion } from "@/lib/discovery/regions";
import { DISCOVERY_LIMITS } from "../constants";
import { countFollows, followBoard } from "./board.repository";
import { findBoardByPublicId, findSuggestableBoard } from "./suggestion.repository";

export type SuggestionResult = { ok: true; companyName: string } | { ok: false; message: string };

export async function followSuggestedBoard(
  input: { userId: string; publicId: string },
  find: (publicId: string) => Promise<{ id: string; companyName: string } | null> = findSuggestableBoard,
): Promise<SuggestionResult> {
  const board = await find(input.publicId);

  if (!board) {
    return { ok: false, message: "That company could not be found." };
  }

  if ((await countFollows(input.userId)) >= DISCOVERY_LIMITS.followsPerUser) {
    return { ok: false, message: `You can follow up to ${DISCOVERY_LIMITS.followsPerUser} companies.` };
  }

  await followBoard({ userId: input.userId, boardId: board.id });

  return { ok: true, companyName: board.companyName };
}

export function refollowBoard(input: { userId: string; publicId: string }) {
  return followSuggestedBoard(input, findBoardByPublicId);
}

export function nextRegions(current: JobRegion[], region: JobRegion, enabled: boolean) {
  const rest = current.filter((value) => value !== region);

  return enabled ? [...rest, region] : rest;
}

export async function setJobRegion(input: { userId: string; region: JobRegion; enabled: boolean }) {
  const profile = await findProfileByUser(input.userId);
  const jobRegions = nextRegions(readRegions(profile?.jobRegions), input.region, input.enabled);

  await saveJobRegions({ userId: input.userId, jobRegions });

  return jobRegions;
}
