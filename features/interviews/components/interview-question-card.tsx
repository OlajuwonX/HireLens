"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { submitInterviewAnswerAction } from "../actions/interview-actions";
import {
  initialInterviewAnswerState,
  type InterviewAnswerState,
} from "../actions/interview-form-state";
import { interviewDifficultyLabels } from "../constants";
import type { InterviewPageQuestion } from "../server/interview-page.service";

type Resolved = {
  selectedOption: number;
  correct: boolean;
  correctOption: number;
  explanation: string;
};

function OptionRow({
  option,
  index,
  picked,
  onPick,
  groupName,
  disabled,
}: {
  option: string;
  index: number;
  picked: boolean;
  onPick: () => void;
  groupName: string;
  disabled: boolean;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-control border p-3 text-meta transition-colors",
        picked ? "border-accent-hover" : "border-border hover:border-border-strong",
        disabled && "cursor-not-allowed",
      )}
    >
      <input
        type="radio"
        name={groupName}
        className="mt-0.5"
        checked={picked}
        disabled={disabled}
        onChange={onPick}
      />
      <span className="flex-1 text-text-primary">{option}</span>
      <span aria-hidden className="font-mono text-label text-text-muted">
        {String.fromCharCode(65 + index)}
      </span>
    </label>
  );
}

function QuestionForm({
  question,
  index,
}: {
  question: InterviewPageQuestion;
  index: number;
}) {
  const { pending } = useFormStatus();
  const [choice, setChoice] = useState<number | null>(null);
  const groupName = useId();

  return (
    <>
      <input
        type="hidden"
        name="questionPublicId"
        value={question.questionPublicId}
      />
      <input type="hidden" name="selectedOption" value={choice ?? ""} />

      <fieldset disabled={pending}>
        <legend className="mb-3 text-meta font-medium text-text-primary">
          {index}. {question.question}
        </legend>

        <div className="space-y-2">
          {question.options.map((option, optionIndex) => (
            <OptionRow
              key={optionIndex}
              option={option}
              index={optionIndex}
              picked={choice === optionIndex}
              onPick={() => setChoice(optionIndex)}
              groupName={groupName}
              disabled={pending}
            />
          ))}
        </div>

        <Button
          type="submit"
          size="compact"
          className="mt-3"
          disabled={pending || choice === null}
        >
          {pending ? "Checking…" : "Submit answer"}
        </Button>
      </fieldset>
    </>
  );
}

function ResolvedView({
  question,
  resolved,
  index,
}: {
  question: InterviewPageQuestion;
  resolved: Resolved;
  index: number;
}) {
  return (
    <div>
      <p className="mb-3 text-meta font-medium text-text-primary">
        {index}. {question.question}
      </p>

      <ul className="space-y-2">
        {question.options.map((option, optionIndex) => {
          const isAnswer = resolved.correctOption === optionIndex;
          const isWrongPick =
            resolved.selectedOption === optionIndex && !resolved.correct;

          return (
            <li
              key={optionIndex}
              className={cn(
                "flex items-start gap-3 rounded-control border p-3 text-meta",
                isAnswer && "border-accent-hover bg-surface-elevated",
                isWrongPick && "border-danger",
                !isAnswer && !isWrongPick && "border-border opacity-70",
              )}
            >
              <span className="flex-1 text-text-primary">{option}</span>
              {isAnswer ? (
                <span className="flex shrink-0 items-center gap-1 text-label text-text-secondary">
                  <Check className="size-3.5" aria-hidden />
                  Correct answer
                </span>
              ) : isWrongPick ? (
                <span className="flex shrink-0 items-center gap-1 text-label text-danger">
                  <X className="size-3.5" aria-hidden />
                  Your answer
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div
        role="status"
        aria-live="polite"
        className="mt-3 space-y-1 border-t border-border pt-3"
      >
        <p className="flex items-center gap-1.5 text-meta font-medium">
          {resolved.correct ? (
            <>
              <Check className="size-4 text-accent-hover" aria-hidden />
              <span className="text-text-primary">Correct</span>
            </>
          ) : (
            <>
              <X className="size-4 text-danger" aria-hidden />
              <span className="text-text-primary">
                Not quite — the answer was option{" "}
                {String.fromCharCode(65 + resolved.correctOption)}
              </span>
            </>
          )}
        </p>
        <p className="text-meta text-text-secondary">{resolved.explanation}</p>
      </div>
    </div>
  );
}

export function InterviewQuestionCard({
  question,
  index,
}: {
  question: InterviewPageQuestion;
  index: number;
}) {
  const [state, formAction] = useActionState(
    submitInterviewAnswerAction,
    initialInterviewAnswerState,
  );
  const announced = useRef<InterviewAnswerState>(initialInterviewAnswerState);

  useEffect(() => {
    if (state === announced.current || state.status === "idle") {
      return;
    }

    announced.current = state;

    if (state.status === "error") {
      notify.error(state.message);
    }
  }, [state]);

  const resolved: Resolved | null =
    question.answered ??
    (state.status === "answered" &&
    state.questionPublicId === question.questionPublicId
      ? {
          selectedOption: state.selectedOption,
          correct: state.correct,
          correctOption: state.correctOption,
          explanation: state.explanation,
        }
      : null);

  return (
    <li className="rounded-card border border-border bg-surface p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="truncate font-mono text-system uppercase text-text-muted">
          {question.topic}
        </span>
        <span className="shrink-0 rounded-control border border-border px-2 py-0.5 text-label text-text-secondary">
          {interviewDifficultyLabels[question.difficulty]}
        </span>
      </div>

      {resolved ? (
        <ResolvedView question={question} resolved={resolved} index={index} />
      ) : (
        <form action={formAction}>
          <QuestionForm question={question} index={index} />
        </form>
      )}
    </li>
  );
}
