import { MAX_BOOST_STEPS, needsBoost } from "../../../features/extension/match";
import { ask } from "../shared/messages";
import type { BoostReply, FillData, MatchSummary } from "../shared/types";
import { reloadData } from "./fill-data";
import type { Linked, Progress } from "./link-job";

export type Improved = { fill: FillData; match: MatchSummary | null; notes: string[] };

const LIMIT_NOTE = "Your AI allowance for today is used up, so your current resume was used.";

function describeStep(score: number | null) {
  return score === null
    ? "Scoring your resume against this job..."
    : `Your resume matches ${score}%. Improving it truthfully for this job...`;
}

export async function improveResume(linked: Linked, progress: Progress): Promise<Improved> {
  const application = linked.fill.application;
  const before = linked.fill.match.score;

  if (!application || !needsBoost(before)) {
    return { ...linked, match: application ? { before, after: before, gaps: [] } : null };
  }

  const notes = [...linked.notes];
  let after = before;
  let gaps: string[] = [];

  for (let step = 0; step < MAX_BOOST_STEPS; step++) {
    progress(describeStep(after));

    const reply = await ask<BoostReply>({ type: "boost", applicationPublicId: application.publicId });
    const result: BoostReply = reply.ok ? reply.value : { ok: false, limited: false, message: reply.message };

    if (!result.ok) {
      notes.push(result.limited ? LIMIT_NOTE : result.message);
      break;
    }

    after = result.score;
    gaps = result.gaps;

    if (result.finished) break;
  }

  return { fill: await reloadData(), match: { before, after, gaps }, notes };
}
