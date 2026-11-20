"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dropdown } from "@/components/ui/dropdown";
import { FormField } from "@/components/ui/form-field";
import { workArrangementLabels } from "@/features/jobs/constants";
import type { CandidateProfile } from "@/lib/db/schema";
import { useActionToast } from "@/lib/forms/use-action-toast";
import { saveProfileAction } from "../actions/profile-actions";
import { initialProfileFormState } from "../actions/form-state";
import { PROFILE_WORK_ARRANGEMENTS, SENIORITY_LEVELS, seniorityLabels } from "../constants";
import { sponsorshipValue } from "../profile-values";
import { compensationFields, contactFields, locationFields, roleFields } from "./profile-fields";
import { ProfileSection } from "./profile-section";

const sponsorshipOptions = [
  { value: "NO", label: "No, I don't need sponsorship" },
  { value: "YES", label: "Yes, I need sponsorship" },
];

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="primary" disabled={pending}>
      {pending ? "Saving..." : "Save profile"}
    </Button>
  );
}

export function ProfileForm({ profile }: { profile: CandidateProfile | null }) {
  const [state, action] = useActionState(saveProfileAction, initialProfileFormState);
  const [seniority, setSeniority] = useState(profile?.seniority ?? "");
  const [sponsorship, setSponsorship] = useState(
    sponsorshipValue(profile?.requiresSponsorship ?? null),
  );
  const errors = state.fieldErrors;
  const submitted = state.status === "error" ? state.values : undefined;
  const shared = { profile, errors, submitted };
  const arrangements = submitted
    ? (submitted.workArrangements ?? "").split(",")
    : (profile?.workArrangements ?? []);
  const relocate = submitted
    ? submitted.willingToRelocate === "on"
    : (profile?.willingToRelocate ?? false);

  useActionToast(state);

  return (
    <form action={action} className="space-y-6">
      <ProfileSection title="Role" fields={roleFields} {...shared}>
        <FormField id="profile-seniority" label="Seniority" required error={errors.seniority}>
          <Dropdown
            id="profile-seniority"
            name="seniority"
            label="Seniority"
            placeholder="Select a level"
            value={seniority}
            onChange={setSeniority}
            options={SENIORITY_LEVELS.map((value) => ({ value, label: seniorityLabels[value] }))}
          />
        </FormField>
      </ProfileSection>

      <ProfileSection title="Location and eligibility" fields={locationFields} {...shared}>
        <FormField id="profile-sponsorship" label="Visa sponsorship" required error={errors.requiresSponsorship}>
          <Dropdown
            id="profile-sponsorship"
            name="requiresSponsorship"
            label="Visa sponsorship"
            placeholder="Select an option"
            value={sponsorship}
            onChange={setSponsorship}
            options={sponsorshipOptions}
          />
        </FormField>

        <fieldset className="space-y-2 sm:col-span-2">
          <legend className="text-label font-medium text-text-secondary">
            Work arrangements<span aria-hidden className="ml-0.5 text-danger">*</span>
          </legend>
          <div className="flex flex-wrap gap-4">
            {PROFILE_WORK_ARRANGEMENTS.map((value) => (
              <label key={value} className="flex items-center gap-2 text-meta text-text-primary">
                <Checkbox
                  name="workArrangements"
                  value={value}
                  defaultChecked={arrangements.includes(value)}
                />
                {workArrangementLabels[value]}
              </label>
            ))}
            <label className="flex items-center gap-2 text-meta text-text-primary">
              <Checkbox name="willingToRelocate" defaultChecked={relocate} />
              Open to relocating
            </label>
          </div>
        </fieldset>
      </ProfileSection>

      <ProfileSection title="Compensation" fields={compensationFields} {...shared} />

      <ProfileSection title="Contact and links" fields={contactFields} {...shared} />

      <div className="flex justify-end">
        <SaveButton />
      </div>
    </form>
  );
}
