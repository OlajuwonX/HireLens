export function ActivityItem({
  title,
  description,
  time,
}: {
  title: string;
  description?: string;
  time?: string;
}) {
  return (
    <li className="border-l-2 border-border pl-4">
      <p className="text-meta font-semibold text-text-primary">{title}</p>
      {description ? <p className="mt-1 text-meta text-text-secondary">{description}</p> : null}
      {time ? <time className="mt-1 block text-system text-text-muted">{time}</time> : null}
    </li>
  );
}
