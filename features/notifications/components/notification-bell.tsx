"use client";

import { IconButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import {
  loadNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "../actions/notification-actions";
import {
  formatRelativeTime,
  formatUnreadBadge,
  type NotificationItem,
} from "../notification-item";

function NotificationBody({ item }: { item: NotificationItem }) {
  return (
    <span className="flex items-start gap-2">
      <span
        aria-hidden="true"
        className={cn(
          "mt-1.5 size-1.5 shrink-0 rounded-full",
          item.read ? "bg-transparent" : "bg-accent",
        )}
      />
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block text-meta",
            item.read ? "text-text-secondary" : "font-medium text-text-primary",
          )}
        >
          {item.title}
        </span>
        {item.body ? (
          <span className="mt-0.5 block text-label text-text-muted">
            {item.body}
          </span>
        ) : null}
        <span className="mt-1 block font-mono text-system text-text-muted">
          {formatRelativeTime(item.createdAt)}
        </span>
      </span>
    </span>
  );
}

type PanelStatus = "idle" | "loading" | "ready" | "error";

export function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [status, setStatus] = useState<PanelStatus>("idle");
  const [unread, setUnread] = useState(unreadCount);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    setUnread(unreadCount);
  }, [unreadCount]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function toggle() {
    const next = !open;

    setOpen(next);

    if (!next || status === "loading" || status === "ready") {
      return;
    }

    setStatus("loading");
    startTransition(async () => {
      try {
        setItems(await loadNotificationsAction());
        setStatus("ready");
      } catch {
        setStatus("error");
      }
    });
  }

  function onSelect(item: NotificationItem) {
    setOpen(false);

    if (item.read) {
      return;
    }

    setItems((current) =>
      current.map((entry) =>
        entry.publicId === item.publicId ? { ...entry, read: true } : entry,
      ),
    );
    setUnread((current) => Math.max(0, current - 1));
    startTransition(async () => {
      try {
        await markNotificationReadAction(item.publicId);
      } catch {
        setStatus("idle");
      }
    });
  }

  function onMarkAll() {
    setItems((current) => current.map((entry) => ({ ...entry, read: true })));
    setUnread(0);
    startTransition(async () => {
      try {
        await markAllNotificationsReadAction();
      } catch {
        setStatus("idle");
      }
    });
  }

  const badge = formatUnreadBadge(unread);
  const itemClassName =
    "block w-full border-b border-border px-3 py-2.5 text-left last:border-b-0 hover:bg-surface-secondary";

  return (
    <div ref={containerRef} className="relative shrink-0">
      <IconButton
        label={badge ? `Notifications, ${unread} unread` : "Notifications"}
        onClick={toggle}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
      >
        <Bell aria-hidden="true" className="size-5" />
        {badge ? (
          <span
            aria-hidden="true"
            className="absolute right-0.5 top-0.5 grid min-w-4 place-items-center rounded-control bg-danger px-1 font-mono text-[10px] font-medium leading-4 text-white"
          >
            {badge}
          </span>
        ) : null}
      </IconButton>

      {open ? (
        <div
          id={panelId}
          aria-label="Notifications"
          className="absolute right-0 top-full z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-panel border border-border bg-surface shadow-lg"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-2.5">
            <p className="text-label font-medium text-text-primary">
              Notifications
            </p>
            {unread > 0 ? (
              <button
                type="button"
                onClick={onMarkAll}
                className="text-label text-text-secondary underline underline-offset-4 hover:text-text-primary"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="hl-scroll max-h-80 overflow-y-auto">
            {status === "loading" ? (
              <p className="px-3 py-6 text-center text-meta text-text-muted">
                Loading…
              </p>
            ) : status === "error" ? (
              <p className="px-3 py-6 text-center text-meta text-text-muted">
                Could not load notifications. Close this and try again.
              </p>
            ) : items.length === 0 ? (
              <p className="px-3 py-6 text-center text-meta text-text-muted">
                Nothing yet. Updates about your applications will show up here.
              </p>
            ) : (
              <ul>
                {items.map((item) => (
                  <li key={item.publicId}>
                    {item.href ? (
                      <Link
                        href={item.href}
                        onClick={() => onSelect(item)}
                        className={itemClassName}
                      >
                        <NotificationBody item={item} />
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelect(item)}
                        className={itemClassName}
                      >
                        <NotificationBody item={item} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
