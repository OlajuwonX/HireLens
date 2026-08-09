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
import { saveAndAnalyzeAction } from "@/features/applications/actions/application-actions";
import { initialApplicationFormState } from "@/features/applications/actions/application-form-state";

export type VersionOption = {
  publicId: string;
  label: string;
  resumeTitle: string;
  isDefault: boolean;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="primary" disabled={pending}>
      {pending ? "Saving and analysing…" : "Save & Analyze"}
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
      {error ? <p className="text-label text-danger">{error}</p> : null}
    </div>
  );
}

export function SaveAndAnalyzeForm({
  versions,
}: {
  versions: VersionOption[];
}) {
  const [state, formAction] = useActionState(
    saveAndAnalyzeAction,
    initialApplicationFormState,
  );
  const errors = state.fieldErrors;

  if (versions.length === 0) {
    return (
      <Alert tone="info">
        Upload a resume version before creating an application. HireLens needs a
        resume to analyse against the job.
      </Alert>
    );
  }

  const preselected =
    versions.find((version) => version.isDefault)?.publicId ??
    versions[0].publicId;

  return (
    <form action={formAction} className="mx-auto w-full max-w-reading space-y-8">
      {state.status === "error" ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-section-title font-semibold text-text-primary">
          Resume
        </h2>
        <Field
          id="resumeVersionPublicId"
          label="Which resume should HireLens use?"
          error={errors.resumeVersionPublicId}
          hint="Defaults to your default version, or the latest if none is set."
        >
          <Select
            id="resumeVersionPublicId"
            name="resumeVersionPublicId"
            defaultValue={preselected}
          >
            {versions.map((version) => (
              <option key={version.publicId} value={version.publicId}>
                {version.resumeTitle} — {version.label}
                {version.isDefault ? " (default)" : ""}
              </option>
            ))}
          </Select>
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-section-title font-semibold text-text-primary">
          The job
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="title" label="Job title" error={errors.title}>
            <Input id="title" name="title" required maxLength={200} />
          </Field>

          <Field id="company" label="Company" error={errors.company}>
            <Input id="company" name="company" required maxLength={200} />
          </Field>

          <Field id="location" label="Location" error={errors.location}>
            <Input id="location" name="location" maxLength={200} />
          </Field>

          <Field id="workArrangement" label="Work arrangement">
            <Select
              id="workArrangement"
              name="workArrangement"
              defaultValue="NOT_SPECIFIED"
            >
              {WORK_ARRANGEMENTS.map((value) => (
                <option key={value} value={value}>
                  {workArrangementLabels[value]}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="employmentType" label="Employment type">
            <Select
              id="employmentType"
              name="employmentType"
              defaultValue="NOT_SPECIFIED"
            >
              {EMPLOYMENT_TYPES.map((value) => (
                <option key={value} value={value}>
                  {employmentTypeLabels[value]}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="deadlineAt" label="Application deadline">
            <Input id="deadlineAt" name="deadlineAt" type="date" />
          </Field>

          <Field id="source" label="Source">
            <Input
              id="source"
              name="source"
              maxLength={120}
              placeholder="LinkedIn"
            />
          </Field>

          <Field
            id="sourceUrl"
            label="Job posting URL"
            error={errors.sourceUrl}
            hint="Include https://"
          >
            <Input id="sourceUrl" name="sourceUrl" type="url" inputMode="url" />
          </Field>

          <Field id="salaryMin" label="Salary from">
            <Input
              id="salaryMin"
              name="salaryMin"
              type="number"
              min={0}
              inputMode="numeric"
            />
          </Field>

          <Field id="salaryMax" label="Salary to" error={errors.salaryMax}>
            <Input
              id="salaryMax"
              name="salaryMax"
              type="number"
              min={0}
              inputMode="numeric"
            />
          </Field>

          <Field id="currency" label="Currency">
            <Input id="currency" name="currency" maxLength={8} placeholder="GBP" />
          </Field>
        </div>

        <Field
          id="description"
          label="Job description"
          error={errors.description}
          hint="Paste the posting. Stored and shown as plain text."
        >
          <Textarea
            id="description"
            name="description"
            required
            rows={14}
            maxLength={50_000}
            className="min-h-64"
          />
        </Field>

        <Field id="requirements" label="Job requirements">
          <Textarea
            id="requirements"
            name="requirements"
            rows={8}
            maxLength={20_000}
            className="min-h-40"
          />
        </Field>

        <Field id="notes" label="Your notes">
          <Textarea id="notes" name="notes" rows={4} maxLength={10_000} />
        </Field>
      </section>

      <div className="sticky bottom-0 -mx-4 border-t border-border bg-background/95 px-4 py-4 backdrop-blur sm:mx-0 sm:px-0">
        <SubmitButton />
      </div>
    </form>
  );
}
