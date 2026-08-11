"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "./button";

export function LoadMore({
  basePath,
  cursor,
  page,
  label = "Load more",
}: {
  basePath: string;
  cursor?: string;
  page?: number;
  label?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex justify-center pt-1">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => {
          const search = new URLSearchParams(params.toString());

          if (cursor) {
            search.set("cursor", cursor);
          }

          if (page) {
            search.set("page", String(page));
          }

          startTransition(() => {
            router.replace(`${basePath}?${search.toString()}`);
          });
        }}
      >
        {pending ? "Loading..." : label}
      </Button>
    </div>
  );
}
