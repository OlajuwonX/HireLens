import { toTextBlocks } from "@/lib/text/blocks";

export function FormattedText({ text, className }: { text: string; className?: string }) {
  const blocks = toTextBlocks(text);

  return (
    <div className={className ? `space-y-3 ${className}` : "space-y-3"}>
      {blocks.map((block, index) => {
        if (block.kind === "heading") {
          return (
            <h4 key={index} className="pt-1 text-meta font-semibold text-text-primary">
              {block.text}
            </h4>
          );
        }

        if (block.kind === "list") {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5 text-meta leading-relaxed text-text-primary">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="text-meta leading-relaxed text-text-primary">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
