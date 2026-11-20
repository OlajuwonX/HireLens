"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useActionToast } from "@/lib/forms/use-action-toast";
import { saveAnswerAction } from "../actions/answer-actions";
import { initialProfileFormState } from "../actions/form-state";
import { ANSWER_LIMITS } from "../constants";

export type AnswerDraft = { publicId: string; question: string; answer: string };

function SaveButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : editing ? "Update answer" : "Add answer"}
    </Button>
  );
}

export function AnswerForm({
  draft,
  onDone,
}: {
  draft: AnswerDraft | null;
  onDone: () => void;
}) {
  const [state, action] = useActionState(saveAnswerAction, initialProfileFormState);
  const submitted = state.status === "error" ? state.values : undefined;
  const errors = state.fieldErrors;

  useActionToast(state, onDone);

  return (
    <form action={action} className="space-y-4">
      {draft ? <input type="hidden" name="publicId" value={draft.publicId} /> : null}

      <FormField id="answer-question" label="Question" required error={errors.question}>
        <Input
          id="answer-question"
          name="question"
          maxLength={ANSWER_LIMITS.question}
          placeholder="Why do you want to work here?"
          defaultValue={submitted?.question ?? draft?.question ?? ""}
          aria-invalid={errors.question ? true : undefined}
        />
      </FormField>

      <FormField id="answer-answer" label="Your answer" required error={errors.answer}>
        <Textarea
          id="answer-answer"
          name="answer"
          rows={5}
          maxLength={ANSWER_LIMITS.answer}
          defaultValue={submitted?.answer ?? draft?.answer ?? ""}
          aria-invalid={errors.answer ? true : undefined}
        />
      </FormField>

      <div className="flex justify-end gap-2">
        {draft ? (
          <Button type="button" variant="outline" onClick={onDone}>
            Cancel
          </Button>
        ) : null}
        <SaveButton editing={Boolean(draft)} />
      </div>
    </form>
  );
}
