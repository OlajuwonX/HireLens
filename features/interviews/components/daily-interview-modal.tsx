"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { notify } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { submitInterviewAnswerAction } from "../actions/interview-actions";
import {
  initialInterviewAnswerState,
  type InterviewAnswerState,
} from "../actions/interview-form-state";
import {
  isDailyPromptSkipped,
  skipDailyPromptToday,
} from "../daily-prompt-skip";
import type { DailyInterviewPrompt } from "../server/interview-daily.service";
import type { InterviewPageQuestion } from "../server/interview-page.service";

type ReadyPrompt = Extract<DailyInterviewPrompt, { due: true }>;

type Resolved = {
  selectedOption: number;
  correct: boolean;
  correctOption: number;
  explanation: string;
};

let autoOpenedKey: string | null = null;

function DailyForm({ question }: { question: InterviewPageQuestion }) {
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

      <fieldset disabled={pending} className="space-y-2">
        {question.options.map((option, optionIndex) => (
          <label
            key={optionIndex}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-control border p-3 text-meta transition-colors",
              choice === optionIndex
                ? "border-accent-hover"
                : "border-border hover:border-border-strong",
              pending && "cursor-not-allowed",
            )}
          >
            <input
              type="radio"
              name={groupName}
              className="mt-0.5"
              checked={choice === optionIndex}
              onChange={() => setChoice(optionIndex)}
            />
            <span
              className="line-clamp-2 flex-1 text-text-primary"
              title={option}
            >
              {option}
            </span>
          </label>
        ))}
      </fieldset>

      <Button
        type="submit"
        size="compact"
        className="mt-3"
        disabled={pending || choice === null}
      >
        {pending ? "Checking…" : "Submit answer"}
      </Button>
    </>
  );
}

function DailyResolved({
  question,
  resolved,
}: {
  question: InterviewPageQuestion;
  resolved: Resolved;
}) {
  return (
    <div>
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
              <span
                className="line-clamp-2 flex-1 text-text-primary"
                title={option}
              >
                {option}
              </span>
              {isAnswer ? (
                <span className="flex shrink-0 items-center gap-1 text-label text-text-secondary">
                  <Check className="size-3.5" aria-hidden />
                  Correct
                </span>
              ) : isWrongPick ? (
                <span className="flex shrink-0 items-center gap-1 text-label text-danger">
                  <X className="size-3.5" aria-hidden />
                  You
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p
        role="status"
        className="mt-3 line-clamp-3 text-meta text-text-secondary"
        title={resolved.explanation}
      >
        {resolved.correct ? "Correct. " : "Not quite. "}
        {resolved.explanation}
      </p>
    </div>
  );
}

function DailyQuestion({
  question,
  position,
  isLast,
  onResolved,
  onNext,
}: {
  question: InterviewPageQuestion;
  position: number;
  isLast: boolean;
  onResolved: () => void;
  onNext: () => void;
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
    } else if (state.status === "answered") {
      onResolved();
    }
  }, [state, onResolved]);

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
    <div>
      <p
        className="mb-3 line-clamp-4 text-meta font-medium text-text-primary"
        title={question.question}
      >
        {position}. {question.question}
      </p>

      {resolved ? (
        <DailyResolved question={question} resolved={resolved} />
      ) : (
        <form action={formAction}>
          <DailyForm question={question} />
        </form>
      )}

      {resolved && !isLast ? (
        <Button
          type="button"
          size="compact"
          className="mt-4"
          onClick={onNext}
        >
          Next question
        </Button>
      ) : null}
    </div>
  );
}

export function DailyInterviewModal({ prompt }: { prompt: ReadyPrompt }) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [sessionAnswered, setSessionAnswered] = useState<ReadonlySet<string>>(
    new Set(),
  );

  useEffect(() => {
    const key = `${prompt.cyclePublicId}:${prompt.dayIndex}`;
    const firstUnanswered = prompt.questions.findIndex(
      (question) => question.answered === null,
    );

    if (
      firstUnanswered === -1 ||
      autoOpenedKey === key ||
      isDailyPromptSkipped(prompt.cyclePublicId, prompt.dayIndex)
    ) {
      return;
    }

    autoOpenedKey = key;
    setIndex(firstUnanswered);
    setOpen(true);
  }, [prompt]);

  const total = prompt.questions.length;
  const answeredNow = prompt.questions.filter(
    (question) =>
      question.answered !== null ||
      sessionAnswered.has(question.questionPublicId),
  ).length;
  const current = prompt.questions[index];

  function handleSkip() {
    skipDailyPromptToday(prompt.cyclePublicId, prompt.dayIndex);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogTitle className="pr-8 text-section-title font-semibold text-text-primary">
          Today&rsquo;s interview questions
        </DialogTitle>
        <p className="mt-1 text-meta text-text-secondary">
          {answeredNow}/{total} answered today
        </p>

        {current ? (
          <div className="mt-4">
            <DailyQuestion
              key={current.questionPublicId}
              question={current}
              position={index + 1}
              isLast={index >= total - 1}
              onResolved={() =>
                setSessionAnswered((prev) =>
                  new Set(prev).add(current.questionPublicId),
                )
              }
              onNext={() => setIndex((i) => Math.min(i + 1, total - 1))}
            />
          </div>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <button
            type="button"
            onClick={handleSkip}
            className="text-label text-text-muted underline-offset-4 hover:underline"
          >
            Skip for today
          </button>

          {answeredNow >= total ? (
            <Button asChild size="compact">
              <Link href="/dashboard/interview">Take more questions</Link>
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
