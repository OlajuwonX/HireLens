"use client";

import { UndoableButton } from "@/components/ui/undoable-button";
import { hideMatchAction, restoreMatchAction } from "../actions/matching-actions";

export function HideMatchButton({ publicId, title }: { publicId: string; title: string }) {
  return (
    <UndoableButton
      label="Not interested"
      pendingLabel="Hiding..."
      doneMessage={`Hid ${title}.`}
      failMessage="That match could not be hidden. Please try again."
      run={() => hideMatchAction(publicId)}
      undo={() => restoreMatchAction(publicId)}
    />
  );
}
