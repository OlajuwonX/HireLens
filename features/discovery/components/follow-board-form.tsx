"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { DISCOVERY_SOURCES } from "@/lib/discovery/types";
import { useActionToast } from "@/lib/forms/use-action-toast";
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
  const [formKey, setFormKey] = useState(0);

  useActionToast(state, () => setFormKey((key) => key + 1));

  return (
    <form key={formKey} action={action} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
      <FormField
        id="follow-board"
        label="Company job board"
        hint={`Paste a link such as ${sourceHints.GREENHOUSE}, ${sourceHints.LEVER} or ${sourceHints.ASHBY}.`}
      >
        <Input id="follow-board" name="board" placeholder="https://boards.greenhouse.io/company" required />
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
  );
}
