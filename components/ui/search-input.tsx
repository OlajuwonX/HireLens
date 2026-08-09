import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, ...props }, ref) => (
    <div className="relative">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted"
      />
      <input
        ref={ref}
        type="search"
        className={cn(
          "h-10 w-full rounded-control border border-border bg-surface pl-9 pr-3 text-body text-text-primary transition-colors",
          "placeholder:text-text-muted",
          "hover:border-border-strong",
          "focus:border-accent-hover focus:outline-none focus-visible:outline-none",
          className,
        )}
        {...props}
      />
    </div>
  ),
);

SearchInput.displayName = "SearchInput";
