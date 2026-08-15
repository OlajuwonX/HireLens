"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Archive, ArchiveRestore, MoreVertical } from "lucide-react";
import { DeleteConfirmButton } from "@/components/ui/delete-confirm-button";
import { notify } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  archiveApplicationAction,
  deleteApplicationAction,
} from "../actions/application-actions";

export function SavedJobCardMenu({
  publicId,
  title,
  archived,
}: {
  publicId: string;
  title: string;
  archived: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggleArchive() {
    const formData = new FormData();

    formData.set("publicId", publicId);
    formData.set("archived", archived ? "false" : "true");

    startTransition(async () => {
      await archiveApplicationAction(formData);
      setOpen(false);
      notify.success(archived ? `${title} restored.` : `${title} archived.`);
    });
  }

  return (
    <div ref={containerRef} className="relative z-10">
      <button
        type="button"
        aria-label={`Actions for ${title}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "flex size-8 items-center justify-center rounded-control text-text-muted transition-colors",
          "hover:bg-surface-elevated hover:text-text-primary",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-hover",
          open && "bg-surface-elevated text-text-primary",
        )}
      >
        <MoreVertical className="size-4" aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          aria-label={`Actions for ${title}`}
          className="absolute bottom-full right-0 z-20 mb-1 min-w-40 rounded-card border border-border bg-surface p-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            disabled={pending}
            onClick={toggleArchive}
            className="flex w-full items-center gap-2 rounded-control px-2.5 py-2 text-left text-meta text-text-primary transition-colors hover:bg-surface-elevated disabled:opacity-60"
          >
            {archived ? (
              <ArchiveRestore className="size-4 shrink-0" aria-hidden />
            ) : (
              <Archive className="size-4 shrink-0" aria-hidden />
            )}
            {archived ? "Unarchive" : "Archive"}
          </button>

          <div role="none" className="my-1 h-px bg-border" />

          <DeleteConfirmButton
            action={deleteApplicationAction}
            publicId={publicId}
            title={`Delete ${title}?`}
            description="This permanently deletes the saved job, its analysis and any documents generated from it. This action cannot be undone."
            confirmLabel="Delete saved job"
            toastLabel={title}
            variant="menuitem"
            label="Delete"
          />
        </div>
      ) : null}
    </div>
  );
}
