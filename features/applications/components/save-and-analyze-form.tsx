"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dropdown } from "@/components/ui/dropdown";
import { DatePicker } from "@/components/ui/date-picker";
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
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden className="ml-0.5 text-danger">
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (required)</span> : null}
      </Label>
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
  const [versionId, setVersionId] = useState("");
  const [arrangement, setArrangement] = useState("NOT_SPECIFIED");
  const [employment, setEmployment] = useState("NOT_SPECIFIED");
  const [deadline, setDeadline] = useState("");

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
          required
        >
          <Dropdown
            id="resumeVersionPublicId"
            name="resumeVersionPublicId"
            label="Resume version"
            value={versionId || preselected}
            onChange={setVersionId}
            options={versions.map((version) => ({
              value: version.publicId,
              label: `${version.resumeTitle} - ${version.label}`,
              hint: version.isDefault ? "Default version" : undefined,
            }))}
          />
        </Field>
      </section>

      <section className="space-y-4">
        <h2 className="text-section-title font-semibold text-text-primary">
          The job
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="title" label="Job title" error={errors.title} required>
            <Input id="title" name="title" required maxLength={200} />
          </Field>

          <Field id="company" label="Company" error={errors.company} required>
            <Input id="company" name="company" required maxLength={200} />
          </Field>

          <Field id="location" label="Location" error={errors.location}>
            <Input id="location" name="location" maxLength={200} />
          </Field>

          <Field id="workArrangement" label="Work arrangement">
            <Dropdown
              id="workArrangement"
              name="workArrangement"
              label="Work arrangement"
              value={arrangement}
              onChange={setArrangement}
              options={WORK_ARRANGEMENTS.map((value) => ({
                value,
                label: workArrangementLabels[value],
              }))}
            />
          </Field>

          <Field id="employmentType" label="Employment type">
            <Dropdown
              id="employmentType"
              name="employmentType"
              label="Employment type"
              value={employment}
              onChange={setEmployment}
              options={EMPLOYMENT_TYPES.map((value) => ({
                value,
                label: employmentTypeLabels[value],
              }))}
            />
          </Field>

          <Field id="deadlineAt" label="Application deadline">
            <DatePicker
              id="deadlineAt"
              name="deadlineAt"
              value={deadline}
              onChange={setDeadline}
              placeholder="No deadline"
            />
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
          required
        >
          <Textarea
            id="description"
            name="description"
            required
            rows={12}
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

      <div className="flex justify-end border-t border-border pt-5">
        <SubmitButton />
      </div>
    </form>
  );
}
