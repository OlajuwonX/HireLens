import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";

export type TextFieldConfig = {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  type?: "text" | "url" | "tel" | "number";
  placeholder?: string;
};

export function ProfileTextField({
  field,
  defaultValue,
  error,
}: {
  field: TextFieldConfig;
  defaultValue: string;
  error?: string;
}) {
  const id = `profile-${field.name}`;

  return (
    <FormField
      id={id}
      label={field.label}
      hint={field.hint}
      error={error}
      required={field.required}
    >
      <Input
        id={id}
        name={field.name}
        type={field.type ?? "text"}
        inputMode={field.type === "number" ? "numeric" : undefined}
        min={field.type === "number" ? 0 : undefined}
        placeholder={field.placeholder}
        defaultValue={defaultValue}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : field.hint ? `${id}-hint` : undefined}
      />
    </FormField>
  );
}
