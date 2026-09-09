"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { startInterviewWeekAction } from "../actions/interview-actions";
import { initialStartInterviewWeekState } from "../actions/interview-form-state";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Preparing your set…" : "Start this week's set"}
    </Button>
  );
}

export function StartInterviewWeek() {
  const [state, action] = useActionState(
    startInterviewWeekAction,
    initialStartInterviewWeekState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>This week&rsquo;s interview set</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-meta text-text-secondary">
          Thirty questions tuned to your target role and seniority. Two unlock
          each day, and the rest are open for practice whenever you like.
          Building the set for the first time can take a moment.
        </p>

        <form action={action}>
          <SubmitButton />
        </form>

        {state.status === "error" ? (
          <p role="alert" className="text-meta text-danger">
            {state.message}
          </p>
        ) : null}

        {state.status === "pending_generation" ? (
          <p role="status" className="text-meta text-text-secondary">
            Your set is being prepared. Refresh this page in a moment.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
