"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Download, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import {
  addImprovedResumeToLibraryAction,
  deleteDocumentAction,
} from "../actions/document-actions";
import { initialDocumentFormState } from "../actions/document-form-state";
import type { DOCUMENT_TYPES } from "../constants";

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      type="button"
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(content);
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
  content,
  hasFile,
}: {
  publicId: string;
  type: (typeof DOCUMENT_TYPES)[number];
  content: string;
  hasFile: boolean;
}) {
  const [libraryState, addToLibrary] = useActionState(
    addImprovedResumeToLibraryAction,
    initialDocumentFormState,
  );
  const notice = libraryState;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <CopyButton content={content} />

        {hasFile ? (
          <Button asChild variant="outline">
            <a
              href={`/dashboard/documents/${publicId}/download`}
              rel="noopener"
            >
              <Download className="size-4" aria-hidden />
              Download PDF
            </a>
          </Button>
        ) : null}

        {type === "IMPROVED_RESUME" && hasFile ? (
          <form action={addToLibrary}>
            <input type="hidden" name="publicId" value={publicId} />
            <Button type="submit" variant="outline">
              <Library className="size-4" aria-hidden />
              Add to resume library
            </Button>
          </form>
        ) : null}

        <DeleteConfirmButton
          action={deleteDocumentAction}
          publicId={publicId}
          title="Delete this document?"
          description="This removes the document and any generated PDF. It cannot be undone."
        />
      </div>

      {notice.status !== "idle" ? (
        <p
          className={
            notice.status === "error"
              ? "text-meta text-danger"
              : "text-meta text-text-secondary"
          }
        >
          {notice.message}
        </p>
      ) : null}
    </div>
  );
}
