export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 200;

export type PasswordRule = {
  id: string;
  label: string;
  isMet: (password: string) => boolean;
};

export const PASSWORD_RULES: readonly PasswordRule[] = [
  {
    id: "length",
    label: `At least ${PASSWORD_MIN_LENGTH} characters`,
    isMet: (password) => password.length >= PASSWORD_MIN_LENGTH,
  },
  {
    id: "lowercase",
    label: "A lowercase letter",
    isMet: (password) => /[a-z]/.test(password),
  },
  {
    id: "uppercase",
    label: "An uppercase letter",
    isMet: (password) => /[A-Z]/.test(password),
  },
  {
    id: "number",
    label: "A number",
    isMet: (password) => /[0-9]/.test(password),
  },
];

export function unmetPasswordRules(password: string) {
  return PASSWORD_RULES.filter((rule) => !rule.isMet(password));
}

function joinLabels(labels: string[]) {
  const lowered = labels.map(
    (label) => label.charAt(0).toLowerCase() + label.slice(1),
  );

  if (lowered.length === 1) {
    return lowered[0];
  }

  return `${lowered.slice(0, -1).join(", ")} and ${lowered[lowered.length - 1]}`;
}

export function passwordProblemMessage(password: string) {
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password is too long. Use at most ${PASSWORD_MAX_LENGTH} characters.`;
  }

  const missing = unmetPasswordRules(password);

  if (missing.length === 0) {
    return null;
  }

  return `Your password still needs ${joinLabels(missing.map((rule) => rule.label))}.`;
}
