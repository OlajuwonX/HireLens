"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { notify } from "@/components/ui/toast";
import { setAccountPasswordAction } from "@/features/auth/actions/password-actions";
import { initialPasswordFormState } from "@/features/auth/actions/password-form-state";
import { PasswordRequirements } from "@/features/auth/components/password-requirements";
import { unmetPasswordRules } from "@/features/auth/schemas/password-rules";
import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton({ hasPassword }: { hasPassword: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="primary" block disabled={pending}>
      {pending ? "Saving…" : hasPassword ? "Change password" : "Add password"}
    </Button>
  );
}

function PasswordFields({ hasPassword }: { hasPassword: boolean }) {
  const [password, setPassword] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);

  const highlightUnmet =
    unmetPasswordRules(password).length > 0 && passwordTouched;

  return (
    <>
      {hasPassword ? (
        <div className="space-y-1.5">
          <Label htmlFor="currentPassword">Current password</Label>
          <PasswordInput
            id="currentPassword"
            name="currentPassword"
            autoComplete="current-password"
            required
          />
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="password">
          {hasPassword ? "New password" : "Password"}
        </Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          aria-describedby="account-password-hint"
          aria-invalid={highlightUnmet}
          onChange={(event) => setPassword(event.target.value)}
          onBlur={() => setPasswordTouched(true)}
        />
        <PasswordRequirements
          id="account-password-hint"
          value={password}
          highlightUnmet={highlightUnmet}
        />
      </div>

      {hasPassword ? null : (
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            required
          />
        </div>
      )}
    </>
  );
}

export function PasswordDialog({ hasPassword }: { hasPassword: boolean }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(
    setAccountPasswordAction,
    initialPasswordFormState,
  );
  const handled = useRef(initialPasswordFormState);

  useEffect(() => {
    if (state === handled.current || state.status === "idle") {
      return;
    }

    handled.current = state;

    if (state.status === "error") {
      notify.error(state.message);
      return;
    }

    notify.success(state.message);
    setOpen(false);
  }, [state]);

  const title = hasPassword ? "Change password" : "Add password";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="primary">
          {title}
        </Button>
      </DialogTrigger>

      <DialogContent aria-describedby="password-dialog-description">
        <DialogTitle className="text-section-title font-semibold text-text-primary">
          {title}
        </DialogTitle>
        <DialogDescription
          id="password-dialog-description"
          className="mt-1.5 text-meta text-text-secondary"
        >
          {hasPassword
            ? "Enter your current password, then choose a new one."
            : "Choose a password so you can sign in with your email as well as Google."}
        </DialogDescription>

        <form action={formAction} className="mt-5 space-y-4">
          <PasswordFields hasPassword={hasPassword} />
          <SubmitButton hasPassword={hasPassword} />
        </form>
      </DialogContent>
    </Dialog>
  );
}
