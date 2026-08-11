"use client";

import { useActionState, useCallback, useRef, useState } from "react";
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
import { JobPasteDialog } from "./job-paste-dialog";
import type { ExtractedJob } from "@/lib/ai/schemas/job-extraction.schema";

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
  const [imported, setImported] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const applyExtraction = useCallback((job: ExtractedJob) => {
    const form = formRef.current;

    if (!form) {
      return;
    }

    const fill = (name: string, value: string | number | null) => {
      const field = form.elements.namedItem(name);

      if (
        value === null ||
        value === "" ||
        !(
          field instanceof HTMLInputElement ||
          field instanceof HTMLTextAreaElement
        ) ||
        field.value.trim() !== ""
      ) {
        return;
      }

      field.value = String(value);
    };

    fill("title", job.title);
    fill("company", job.company);
    fill("location", job.location);
    fill("salaryMin", job.salaryMin);
    fill("salaryMax", job.salaryMax);
    fill("currency", job.currency);
    fill("source", job.source);
    fill("sourceUrl", job.sourceUrl);
    fill("description", job.description);
    fill("requirements", job.requirements);

    if (job.workArrangement) {
      setArrangement((current) =>
        current === "NOT_SPECIFIED" ? job.workArrangement! : current,
      );
    }

    if (job.employmentType) {
      setEmployment((current) =>
        current === "NOT_SPECIFIED" ? job.employmentType! : current,
      );
    }

    setImported(true);
  }, []);

  const clearImport = () => {
    formRef.current?.reset();
    setArrangement("NOT_SPECIFIED");
    setEmployment("NOT_SPECIFIED");
    setDeadline("");
    setImported(false);
  };

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
    <form
      ref={formRef}
      action={formAction}
      className="mx-auto w-full max-w-reading space-y-8"
    >
      {state.status === "error" ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}

      <div className="flex flex-col gap-3 rounded-card border border-border bg-surface-secondary p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <p className="text-meta text-text-secondary">
          Copied a posting already? Paste it once and HireLens fills the form.
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <JobPasteDialog onExtracted={applyExtraction} />
          {imported ? (
            <Button type="button" variant="ghost" onClick={clearImport}>
              Clear imported details
            </Button>
          ) : null}
        </div>
      </div>

      {imported ? (
        <Alert tone="info">
          Job details extracted. Review every field before saving. Anything we
          could not detect has been left blank.
        </Alert>
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
            rows={10}
            maxLength={50_000}
          />
        </Field>

        <Field id="requirements" label="Job requirements">
          <Textarea
            id="requirements"
            name="requirements"
            rows={6}
            maxLength={20_000}
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
