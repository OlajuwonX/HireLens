"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const PostingDialog = dynamic(
  () =>
    import("@/features/discovery/components/posting-dialog").then(
      (module) => module.PostingDialog,
    ),
  { ssr: false },
);

export function OpenPostingButton({ publicId }: { publicId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" size="compact" onClick={() => setOpen(true)}>
        View and save
      </Button>
      {open ? <PostingDialog publicId={publicId} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
