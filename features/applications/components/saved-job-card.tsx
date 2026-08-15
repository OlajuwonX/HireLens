"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Archive, ArchiveRestore, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { notify } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import {
  archiveApplicationAction,
  deleteApplicationAction,
} from "../actions/application-actions";

function isRedirect(error: unknown) {
  return error instanceof Error && error.message.includes("NEXT_REDIRECT");
}

export function SavedJobCard({
  publicId,
  title,
  archived,
  statusBadge,
  children,
}: {
  publicId: string;
  title: string;
  archived: boolean;
  statusBadge: React.ReactNode;
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [removed, setRemoved] = useState(false);
  const [archivedNow, setArchivedNow] = useState(archived);
  const [pending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  if (removed || archivedNow !== archived) {
    return null;
  }

  function toggleArchive() {
    const next = !archived;
    const formData = new FormData();

    formData.set("publicId", publicId);
    formData.set("archived", next ? "true" : "false");

    setMenuOpen(false);
    setArchivedNow(next);
    notify.success(next ? `${title} archived.` : `${title} restored.`);

    startTransition(async () => {
      try {
        await archiveApplicationAction(formData);
      } catch (error) {
        if (isRedirect(error)) {
          return;
        }

        setArchivedNow(archived);
        notify.error(
          next
            ? `${title} could not be archived.`
            : `${title} could not be restored.`,
        );
      }
    });
  }

  function confirmDelete() {
    const formData = new FormData();

    formData.set("publicId", publicId);

    setConfirmOpen(false);
    setRemoved(true);
    notify.deleted(title);

    startTransition(async () => {
      try {
        await deleteApplicationAction(formData);
      } catch (error) {
        if (isRedirect(error)) {
          return;
        }

        setRemoved(false);
        notify.error(`${title} could not be deleted.`);
      }
    });
  }

  return (
    <li className="relative flex h-full flex-col gap-3 rounded-card border border-border bg-surface p-3 transition-colors hover:border-border-strong hover:bg-surface-secondary focus-within:border-accent-hover sm:p-4">
      {children}

      <div className="mt-auto flex items-center justify-between gap-2 pt-0.5">
        {statusBadge}

        <div ref={menuRef} className="relative z-10">
          <button
            type="button"
            aria-label={`Actions for ${title}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((value) => !value)}
            className={cn(
              "flex size-8 items-center justify-center rounded-control text-text-muted transition-colors",
              "hover:bg-surface-elevated hover:text-text-primary",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-hover",
              menuOpen && "bg-surface-elevated text-text-primary",
            )}
          >
            <MoreVertical className="size-4" aria-hidden />
          </button>

          {menuOpen ? (
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

              <button
                type="button"
                role="menuitem"
                disabled={pending}
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmOpen(true);
                }}
                className="flex w-full items-center gap-2 rounded-control px-2.5 py-2 text-left text-meta text-danger transition-colors hover:bg-surface-elevated disabled:opacity-60"
              >
                <Trash2 className="size-4 shrink-0" aria-hidden />
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="border border-border">
          <div className="space-y-2 pr-8">
            <DialogTitle className="text-section-title font-semibold text-text-primary">
              Delete {title}?
            </DialogTitle>
            <DialogDescription className="text-meta leading-relaxed text-text-secondary">
              This permanently deletes the saved job, its analysis and any
              documents generated from it. This action cannot be undone.
            </DialogDescription>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" variant="danger" onClick={confirmDelete}>
              Delete saved job
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </li>
  );
}
