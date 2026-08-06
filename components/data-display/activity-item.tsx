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
    <li className="border-l-2 border-gray-200 pl-4">
      <p className="text-sm font-semibold text-gray-950">{title}</p>
      {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
      {time ? <time className="mt-1 block text-xs text-gray-500">{time}</time> : null}
    </li>
  );
}
