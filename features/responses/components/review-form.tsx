"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dropdown } from "@/components/ui/dropdown";
import { notify } from "@/components/ui/toast";
import { RESPONSE_KINDS, type ResponseKind } from "@/lib/responses/classify";
import { confirmResponseAction, dismissResponseAction } from "../actions/response-actions";
import { kindLabels } from "../constants";

export function ReviewForm({
  publicId,
  kind,
  applications,
}: {
  publicId: string;
  kind: ResponseKind;
  applications: { publicId: string; label: string }[];
}) {
  const router = useRouter();
  const [chosenKind, setChosenKind] = useState<ResponseKind>(kind);
  const [application, setApplication] = useState("");

  const confirm = useMutation({
    mutationFn: () => confirmResponseAction({ publicId, kind: chosenKind, applicationPublicId: application }),
    onSuccess: (result) => {
      if (!result.ok) {
        notify.error(result.message);
        return;
      }

      notify.success("Saved.");
      router.refresh();
    },
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Dropdown
        label="Message type"
        value={chosenKind}
        onChange={setChosenKind}
        options={RESPONSE_KINDS.map((value) => ({ value, label: kindLabels[value] }))}
      />
      <Dropdown
        label="Application"
        placeholder="Which application?"
        value={application}
        onChange={setApplication}
        options={applications.map((item) => ({ value: item.publicId, label: item.label }))}
      />
      <Button type="button" size="compact" disabled={confirm.isPending} onClick={() => confirm.mutate()}>
        {confirm.isPending ? "Saving..." : "Confirm"}
      </Button>
      <form action={dismissResponseAction}>
        <input type="hidden" name="publicId" value={publicId} />
        <Button type="submit" size="compact" variant="outline">
          Not job related
        </Button>
      </form>
    </div>
  );
}
