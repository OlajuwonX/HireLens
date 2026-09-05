"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { disableAccountAction } from "@/features/account/actions/account-actions";
import { initialAccountFormState } from "@/features/account/actions/account-form-state";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

const CONFIRM_PHRASE = "PAUSE";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="danger" disabled={pending || disabled}>
      {pending ? "Pausing…" : "Pause my account"}
    </Button>
  );
}

export function DisableAccountCard() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [state, formAction] = useActionState(
    disableAccountAction,
    initialAccountFormState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pause your account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-meta text-text-secondary">
          Take a break without losing anything. Pausing signs you out of the
          dashboard and keeps every resume, saved job, application and document
          exactly as it is. You can turn it back on whenever you want.
        </p>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline">
              Pause my account
            </Button>
          </DialogTrigger>
          <DialogContent className="border border-border">
            <div className="space-y-2 pr-8">
              <DialogTitle className="text-section-title font-semibold text-text-primary">
                Pause your account
              </DialogTitle>
              <DialogDescription className="text-meta leading-relaxed text-text-secondary">
                Your data stays exactly where it is. Nothing is deleted, and no
                deletion timer starts. Sign back in whenever you are ready.
              </DialogDescription>
            </div>

            <form action={formAction} className="mt-6 space-y-4">
              {state.status === "error" ? (
                <Alert tone="error">{state.message}</Alert>
              ) : null}

              <div className="space-y-1.5">
                <Label htmlFor="confirm">
                  Type {CONFIRM_PHRASE} to confirm
                </Label>
                <Input
                  id="confirm"
                  name="confirm"
                  autoComplete="off"
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  required
                />
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <SubmitButton
                  disabled={confirm.trim().toUpperCase() !== CONFIRM_PHRASE}
                />
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
