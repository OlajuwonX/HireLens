"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  EMPLOYMENT_TYPES,
  WORK_ARRANGEMENTS,
  employmentTypeLabels,
  workArrangementLabels,
} from "@/features/jobs/constants";
import {
  createJobAction,
  updateJobAction,
} from "@/features/jobs/actions/job-actions";
import { initialJobFormState } from "@/features/jobs/actions/job-form-state";
import type { Job } from "@/lib/db/schema";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="primary" disabled={pending}>
      {pending ? "Saving…" : label}
    </Button>
  );
}

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error ? (
        <p className="text-label text-text-muted">{hint}</p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-label text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function toDateInput(value: Date | null) {
  return value ? value.toISOString().slice(0, 10) : "";
}

export function JobForm({ job }: { job?: Job }) {
  const isEdit = Boolean(job);
  const [state, formAction] = useActionState(
    isEdit ? updateJobAction : createJobAction,
    initialJobFormState,
  );
  const errors = state.fieldErrors;

  return (
    <form action={formAction} className="space-y-6">
      {job ? <input type="hidden" name="publicId" value={job.publicId} /> : null}

      {state.status === "error" ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field id="title" label="Job title" error={errors.title}>
          <Input
            id="title"
            name="title"
            required
            maxLength={200}
            defaultValue={job?.title}
            aria-invalid={Boolean(errors.title)}
          />
        </Field>

        <Field id="company" label="Company" error={errors.company}>
          <Input
            id="company"
            name="company"
            required
            maxLength={200}
            defaultValue={job?.company}
            aria-invalid={Boolean(errors.company)}
          />
        </Field>

        <Field id="location" label="Location" error={errors.location}>
          <Input
            id="location"
            name="location"
            maxLength={200}
            defaultValue={job?.location ?? ""}
          />
        </Field>

        <Field
          id="workArrangement"
          label="Work arrangement"
          error={errors.workArrangement}
        >
          <Select
            id="workArrangement"
            name="workArrangement"
            defaultValue={job?.workArrangement ?? "NOT_SPECIFIED"}
          >
            {WORK_ARRANGEMENTS.map((value) => (
              <option key={value} value={value}>
                {workArrangementLabels[value]}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          id="employmentType"
          label="Employment type"
          error={errors.employmentType}
        >
          <Select
            id="employmentType"
            name="employmentType"
            defaultValue={job?.employmentType ?? "NOT_SPECIFIED"}
          >
            {EMPLOYMENT_TYPES.map((value) => (
              <option key={value} value={value}>
                {employmentTypeLabels[value]}
              </option>
            ))}
          </Select>
        </Field>

        <Field id="deadlineAt" label="Deadline" error={errors.deadlineAt}>
          <Input
            id="deadlineAt"
            name="deadlineAt"
            type="date"
            defaultValue={toDateInput(job?.deadlineAt ?? null)}
          />
        </Field>

        <Field id="salaryMin" label="Salary from" error={errors.salaryMin}>
          <Input
            id="salaryMin"
            name="salaryMin"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={job?.salaryMin ?? ""}
          />
        </Field>

        <Field id="salaryMax" label="Salary to" error={errors.salaryMax}>
          <Input
            id="salaryMax"
            name="salaryMax"
            type="number"
            min={0}
            inputMode="numeric"
            defaultValue={job?.salaryMax ?? ""}
            aria-invalid={Boolean(errors.salaryMax)}
          />
        </Field>

        <Field id="currency" label="Currency" error={errors.currency}>
          <Input
            id="currency"
            name="currency"
            maxLength={8}
            placeholder="GBP"
            defaultValue={job?.currency ?? ""}
          />
        </Field>

        <Field id="source" label="Source" error={errors.source}>
          <Input
            id="source"
            name="source"
            maxLength={120}
            placeholder="LinkedIn"
            defaultValue={job?.source ?? ""}
          />
        </Field>
      </div>

      <Field
        id="sourceUrl"
        label="Job posting URL"
        error={errors.sourceUrl}
        hint="Include https://"
      >
        <Input
          id="sourceUrl"
          name="sourceUrl"
          type="url"
          inputMode="url"
          maxLength={2048}
          defaultValue={job?.sourceUrl ?? ""}
          aria-invalid={Boolean(errors.sourceUrl)}
        />
      </Field>

      <Field
        id="description"
        label="Job description"
        error={errors.description}
        hint="Paste the posting. It is stored and shown as plain text."
      >
        <Textarea
          id="description"
          name="description"
          required
          rows={12}
          maxLength={50_000}
          defaultValue={job?.description}
          aria-invalid={Boolean(errors.description)}
          className="min-h-56"
        />
      </Field>

      <Field id="requirements" label="Requirements" error={errors.requirements}>
        <Textarea
          id="requirements"
          name="requirements"
          rows={6}
          maxLength={20_000}
          defaultValue={job?.requirements ?? ""}
        />
      </Field>

      <Field id="notes" label="Your notes" error={errors.notes}>
        <Textarea
          id="notes"
          name="notes"
          rows={4}
          maxLength={10_000}
          defaultValue={job?.notes ?? ""}
        />
      </Field>

      <SubmitButton label={isEdit ? "Save changes" : "Save job"} />
    </form>
  );
}
