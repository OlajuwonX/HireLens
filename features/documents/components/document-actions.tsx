"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Check, Copy, Download, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import { notify } from "@/components/ui/toast";
import {
  addImprovedResumeToLibraryAction,
  deleteDocumentAction,
} from "../actions/document-actions";
import { initialDocumentFormState } from "../actions/document-form-state";
import type { DOCUMENT_TYPES } from "../constants";

function CopyButton({ content, label }: { content: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(content);
        notify.copied(label);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? (
        <Check className="size-4" aria-hidden />
      ) : (
        <Copy className="size-4" aria-hidden />
      )}
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

export function DocumentActions({
  publicId,
  type,
  label,
  content,
  hasFile,
  inLibrary,
}: {
  publicId: string;
  type: (typeof DOCUMENT_TYPES)[number];
  label: string;
  content: string;
  hasFile: boolean;
  inLibrary: boolean;
}) {
  const [libraryState, addToLibrary] = useActionState(
    addImprovedResumeToLibraryAction,
    initialDocumentFormState,
  );
  const announced = useRef(initialDocumentFormState);

  useEffect(() => {
    if (libraryState === announced.current || libraryState.status === "idle") {
      return;
    }

    announced.current = libraryState;

    if (libraryState.status === "error") {
      notify.error(libraryState.message);
    } else {
      notify.success(libraryState.message);
    }
  }, [libraryState]);

  const added = inLibrary || libraryState.status === "saved";

  return (
    <div className="flex flex-wrap gap-2">
      <CopyButton content={content} label={label} />

      {hasFile ? (
        <Button asChild variant="outline">
          <a href={`/dashboard/documents/${publicId}/download`} rel="noopener">
            <Download className="size-4" aria-hidden />
            Download PDF
          </a>
        </Button>
      ) : null}

      {type === "IMPROVED_RESUME" && hasFile ? (
        added ? (
          <Button type="button" variant="outline" disabled>
            <Check className="size-4" aria-hidden />
            Added to resume library
          </Button>
        ) : (
          <form action={addToLibrary}>
            <input type="hidden" name="publicId" value={publicId} />
            <Button type="submit" variant="outline">
              <Library className="size-4" aria-hidden />
              Add to resume library
            </Button>
          </form>
        )
      ) : null}

      <DeleteConfirmButton
        action={deleteDocumentAction}
        publicId={publicId}
        title="Delete this document?"
        description="This removes the document and any generated PDF. It cannot be undone."
        toastLabel={label}
      />
    </div>
  );
}
