import { NextResponse } from "next/server";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { readResumeDesignSelection } from "@/lib/resume-design";
import { renderResumeDesignPreview } from "@/features/documents/server/resume-design.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const user = await requireDatabaseUser();
  const { documentId } = await params;
  const query = new URL(request.url).searchParams;
  const selection = readResumeDesignSelection({
    template: query.get("template"),
    typography: query.get("typography"),
    spacing: query.get("spacing"),
  });

  const preview = await renderResumeDesignPreview({
    userId: user.id,
    publicId: documentId,
    selection,
  });

  if (!preview) {
    return NextResponse.json(
      { error: "This document cannot be previewed." },
      { status: 404 },
    );
  }

  return NextResponse.json(preview, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
