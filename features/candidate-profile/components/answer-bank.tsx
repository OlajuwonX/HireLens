"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import { deleteAnswerAction } from "../actions/answer-actions";
import { ANSWER_LIMITS } from "../constants";
import type { AnswerRow } from "../server/answer.repository";
import { AnswerForm, type AnswerDraft } from "./answer-form";

export function AnswerBank({ answers }: { answers: AnswerRow[] }) {
  const [draft, setDraft] = useState<AnswerDraft | null>(null);
  const [formKey, setFormKey] = useState(0);

  const reset = () => {
    setDraft(null);
    setFormKey((key) => key + 1);
  };

  const edit = (row: AnswerRow) => {
    setDraft({ publicId: row.publicId, question: row.question, answer: row.answer });
    setFormKey((key) => key + 1);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Answer bank</CardTitle>
        <span className="font-mono text-system text-text-muted">
          {answers.length}/{ANSWER_LIMITS.perUser}
        </span>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-meta text-text-secondary">
          Save answers to questions employers often ask. HireLens reuses them
          when preparing applications and never invents an answer for you.
        </p>

        <AnswerForm key={formKey} draft={draft} onDone={reset} />

        {answers.length === 0 ? (
          <p className="text-meta text-text-muted">No saved answers yet.</p>
        ) : (
          <ul className="divide-y divide-border border-t border-border">
            {answers.map((row) => (
              <li key={row.publicId} className="flex items-start gap-3 py-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-meta font-semibold text-text-primary">
                    {row.question}
                  </p>
                  <p className="line-clamp-3 whitespace-pre-line text-meta text-text-secondary">
                    {row.answer}
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={() => edit(row)}>
                  Edit
                </Button>
                <DeleteConfirmButton
                  action={deleteAnswerAction}
                  publicId={row.publicId}
                  title="Delete this answer?"
                  description="HireLens will stop using it in applications. This cannot be undone."
                  toastLabel="Answer"
                />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
