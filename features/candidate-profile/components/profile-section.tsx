import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CandidateProfile } from "@/lib/db/schema";
import { defaultValueFor } from "./profile-fields";
import { ProfileTextField, type TextFieldConfig } from "./profile-text-field";

export function ProfileSection({
  title,
  fields,
  profile,
  errors,
  submitted,
  children,
}: {
  title: string;
  fields: TextFieldConfig[];
  profile: CandidateProfile | null;
  errors: Record<string, string>;
  submitted?: Record<string, string>;
  children?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <ProfileTextField
            key={field.name}
            field={field}
            defaultValue={defaultValueFor(profile, field.name, submitted)}
            error={errors[field.name]}
          />
        ))}
        {children}
      </CardContent>
    </Card>
  );
}
