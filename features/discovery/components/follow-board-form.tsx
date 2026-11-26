"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { DISCOVERY_SOURCES } from "@/lib/discovery/types";
import { notify } from "@/components/ui/toast";
import { followBoardAction, type FollowFormState } from "../actions/discovery-actions";
import { sourceHints, sourceLabels } from "../constants";

const initial: FollowFormState = { status: "idle", message: "" };

const sources = [
  { value: "", label: "Detect from link" },
  ...DISCOVERY_SOURCES.map((value) => ({ value, label: sourceLabels[value] })),
];

function FollowButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Checking board..." : "Follow board"}
    </Button>
  );
}

export function FollowBoardForm() {
  const [state, action] = useActionState(followBoardAction, initial);
  const [source, setSource] = useState("");
  const [board, setBoard] = useState("");
  const announced = useRef(state);
  const error = state.status === "error" ? state.message : "";

  useEffect(() => {
    if (state === announced.current) {
      return;
    }

    announced.current = state;

    if (state.status === "saved") {
      notify.success(state.message);
      setBoard("");
      setSource("");
    }
  }, [state]);

  return (
    <div className="space-y-2">
      <form action={action} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <FormField id="follow-board" label="Company job board" error={error || undefined}>
          <Input
            id="follow-board"
            name="board"
            value={board}
            onChange={(event) => setBoard(event.target.value)}
            placeholder="https://boards.greenhouse.io/company"
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "follow-board-error" : undefined}
            required
          />
        </FormField>
        <Dropdown
          name="source"
          label="Board source"
          value={source}
          onChange={setSource}
          options={sources}
        />
        <FollowButton />
      </form>
      <p className="break-words text-label text-text-muted">
        Paste a link such as {sourceHints.GREENHOUSE}, {sourceHints.LEVER} or {sourceHints.ASHBY}.
      </p>
    </div>
  );
}
