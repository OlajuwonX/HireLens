"use client";

import { useEffect, useState } from "react";
import { SearchInput } from "./search-input";

export function DebouncedSearch({
  value,
  onSearch,
  placeholder,
  label,
  delay = 350,
  className,
}: {
  value: string;
  onSearch: (next: string) => void;
  placeholder?: string;
  label: string;
  delay?: number;
  className?: string;
}) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    if (draft === value) {
      return;
    }

    const timer = setTimeout(() => onSearch(draft), delay);

    return () => clearTimeout(timer);
  }, [draft, value, delay, onSearch]);

  return (
    <SearchInput
      value={draft}
      aria-label={label}
      placeholder={placeholder}
      className={className}
      onChange={(event) => setDraft(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          onSearch(draft);
        }
      }}
    />
  );
}
