import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchInputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, ...props }, ref) => (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
      <input
        ref={ref}
        type="search"
        className={cn(
          "h-11 w-full rounded-lg border border-gray-200 bg-white pl-9 pr-3 text-sm text-gray-950 shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600",
          className,
        )}
        {...props}
      />
    </div>
  ),
);

SearchInput.displayName = "SearchInput";
