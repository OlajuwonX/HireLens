import type { ComponentType } from "react";
import type { SceneId } from "../scenes";
import { MatchVisual, PostingVisual, ReadingVisual } from "./early";
import { ApplyVisual, GapsVisual, ReplyVisual } from "./late";

export const sceneVisuals: Record<SceneId, ComponentType> = {
  posting: PostingVisual,
  reading: ReadingVisual,
  match: MatchVisual,
  gaps: GapsVisual,
  apply: ApplyVisual,
  reply: ReplyVisual,
};
