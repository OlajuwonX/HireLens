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
import { requestAccountDeletionAction } from "@/features/account/actions/account-actions";
import { initialAccountFormState } from "@/features/account/actions/account-form-state";
import {
  DELETE_CONFIRM_PHRASE,
  DELETION_GRACE_DAYS,
} from "@/features/account/constants";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="danger" disabled={pending || disabled}>
      {pending ? "Scheduling…" : "Delete my account"}
    </Button>
  );
}

export function DeleteAccountCard() {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [state, formAction] = useActionState(
    requestAccountDeletionAction,
    initialAccountFormState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delete your account</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-meta text-text-secondary">
          If HireLens is not useful to you, you can close your account at any
          time and for any reason. You do not have to explain why, and we will
          not hold your data against your wishes.
        </p>
        <p className="text-meta text-text-secondary">
          Access stops straight away. Everything is kept for{" "}
          {DELETION_GRACE_DAYS} days in case you change your mind, and is then
          permanently deleted.
        </p>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="danger">
              Delete my account
            </Button>
          </DialogTrigger>
          <DialogContent className="border border-border">
            <div className="space-y-2 pr-8">
              <DialogTitle className="text-section-title font-semibold text-text-primary">
                Delete your account
              </DialogTitle>
              <DialogDescription className="text-meta leading-relaxed text-text-secondary">
                This closes your account immediately. After{" "}
                {DELETION_GRACE_DAYS} days your resumes, saved jobs,
                applications, documents, uploaded files and notifications are
                permanently deleted and cannot be recovered.
              </DialogDescription>
            </div>

            <form action={formAction} className="mt-6 space-y-4">
              {state.status === "error" ? (
                <Alert tone="error">{state.message}</Alert>
              ) : null}

              <Alert tone="warning">
                You can restore the account yourself at any point during the{" "}
                {DELETION_GRACE_DAYS} days. After that it is gone for good.
              </Alert>

              <div className="space-y-1.5">
                <Label htmlFor="deleteConfirm">
                  Type {DELETE_CONFIRM_PHRASE} to confirm
                </Label>
                <Input
                  id="deleteConfirm"
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
                    Keep my account
                  </Button>
                </DialogClose>
                <SubmitButton
                  disabled={
                    confirm.trim().toUpperCase() !== DELETE_CONFIRM_PHRASE
                  }
                />
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
