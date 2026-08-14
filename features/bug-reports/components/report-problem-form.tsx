"use client";

import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/components/ui/toast";
import { useUiStore } from "@/lib/stores/ui-store";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitBugReportAction } from "../actions/bug-report-actions";
import { initialBugReportFormState } from "../actions/bug-report-form-state";
import { BUG_CATEGORIES, bugCategoryLabels } from "../constants";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="primary" disabled={pending}>
      {pending ? "Sending..." : "Send report"}
    </Button>
  );
}

function Field({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        <span aria-hidden className="ml-0.5 text-danger">
          *
        </span>
        <span className="sr-only"> (required)</span>
      </Label>
      {children}
    </div>
  );
}

export function ReportProblemForm() {
  const [state, action] = useActionState(
    submitBugReportAction,
    initialBugReportFormState,
  );
  const [category, setCategory] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const pathname = usePathname();
  const lastErrorEventId = useUiStore((store) => store.lastErrorEventId);
  const announced = useRef(initialBugReportFormState);

  useEffect(() => {
    if (state === announced.current || state.status === "idle") {
      return;
    }

    announced.current = state;

    if (state.status === "error") {
      notify.error(state.message);
      return;
    }

    notify.success(state.message);
    setCategory("");
    setResetKey((key) => key + 1);
  }, [state]);

  return (
    <form key={resetKey} action={action} className="space-y-4">
      <input type="hidden" name="route" value={pathname} />
      <input
        type="hidden"
        name="sentryEventId"
        value={lastErrorEventId ?? ""}
      />

      <Field id="category" label="Category">
        <Dropdown
          id="category"
          name="category"
          label="Category"
          placeholder="Select a category"
          value={category}
          onChange={setCategory}
          options={BUG_CATEGORIES.map((value) => ({
            value,
            label: bugCategoryLabels[value],
          }))}
        />
      </Field>

      <Field id="title" label="Title">
        <Input
          id="title"
          name="title"
          maxLength={120}
          placeholder="Short summary"
          required
        />
      </Field>

      <Field id="description" label="What happened?">
        <Textarea
          id="description"
          name="description"
          rows={6}
          maxLength={4_000}
          placeholder="What were you doing, and what went wrong?"
          required
        />
      </Field>

      {state.status === "error" ? (
        <p role="status" className="text-label text-danger">
          {state.message}
        </p>
      ) : null}

      <div className="flex justify-end border-t border-border pt-4">
        <SubmitButton />
      </div>
    </form>
  );
}
