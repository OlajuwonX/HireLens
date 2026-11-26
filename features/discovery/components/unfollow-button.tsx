"use client";

import { UndoableButton } from "@/components/ui/undoable-button";
import { refollowBoardAction, unfollowBoardNowAction } from "../actions/source-actions";

export function UnfollowButton({ publicId, companyName }: { publicId: string; companyName: string }) {
  return (
    <UndoableButton
      label="Unfollow"
      pendingLabel="Unfollowing..."
      doneMessage={`Stopped following ${companyName}. Saved jobs stay saved.`}
      failMessage={`${companyName} could not be unfollowed. Please try again.`}
      run={() => unfollowBoardNowAction(publicId)}
      undo={() => refollowBoardAction(publicId)}
      variant="ghost"
    />
  );
}
