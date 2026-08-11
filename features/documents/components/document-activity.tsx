import type { DocumentActivity } from "@/lib/db/schema";

const labels: Record<DocumentActivity["kind"], string> = {
  CREATED: "Saved",
  EDITED: "Edited",
  ADDED_TO_LIBRARY: "Added to resume library",
};

function stamp(value: Date) {
  const date = value.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
  const time = value.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  return `${date} ${time}`;
}

export function DocumentActivityLog({
  activities,
}: {
  activities: DocumentActivity[];
}) {
  if (activities.length === 0) {
    return (
      <p className="text-label text-text-muted">No activity recorded yet.</p>
    );
  }

  return (
    <ol className="space-y-2">
      {activities.map((activity) => (
        <li
          key={activity.id}
          className="border-l-2 border-border pl-3 leading-tight"
        >
          <p className="text-label font-medium text-text-primary">
            {labels[activity.kind]}
          </p>
          <time
            dateTime={activity.createdAt.toISOString()}
            className="font-mono text-system text-text-muted"
          >
            {stamp(activity.createdAt)}
          </time>
        </li>
      ))}
    </ol>
  );
}
