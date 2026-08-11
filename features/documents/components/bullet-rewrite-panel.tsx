import type { BulletRewrite } from "@/lib/ai/schemas/bullet-rewrites.schema";

export function BulletRewritePanel({ items }: { items: BulletRewrite[] }) {
  if (items.length === 0) {
    return (
      <p className="text-meta text-text-secondary">
        No bullet rewrites were returned for this application.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((item, index) => (
        <li
          key={`${index}-${item.original}`}
          className="space-y-2 py-3 first:pt-0 last:pb-0"
        >
          <p className="text-meta text-text-muted line-through">
            {item.original}
          </p>
          <p className="text-meta font-medium text-text-primary">
            {item.improved}
          </p>
          <p className="text-label text-text-secondary">{item.reason}</p>
        </li>
      ))}
    </ul>
  );
}
