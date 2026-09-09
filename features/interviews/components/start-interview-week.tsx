"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { notify } from "@/components/ui/toast";
import { startInterviewWeekAction } from "../actions/interview-actions";
import {
  initialStartInterviewWeekState,
  type StartInterviewWeekState,
} from "../actions/interview-form-state";

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
  const announced = useRef<StartInterviewWeekState>(
    initialStartInterviewWeekState,
  );

  useEffect(() => {
    if (state === announced.current || state.status === "idle") {
      return;
    }

    announced.current = state;

    if (state.status === "error") {
      notify.error(state.message);
    } else if (state.status === "pending_generation") {
      notify.info(
        "Your set is being prepared. Refresh this page in a moment.",
      );
    } else if (state.status === "started") {
      notify.success("Your interview set is ready.");
    }
  }, [state]);

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
      </CardContent>
    </Card>
  );
}
