import { NextResponse } from "next/server";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { findDocumentRowForUser } from "@/features/documents/server/document.repository";
import { createImprovedResumeReadUrl } from "@/features/documents/server/improved-resume.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const user = await requireDatabaseUser();
  const { documentId } = await params;

  const row = await findDocumentRowForUser({
    userId: user.id,
    publicId: documentId,
  });

  if (!row?.document.fileAssetId) {
    return new NextResponse("Not found", { status: 404 });
  }

  const readUrl = await createImprovedResumeReadUrl({
    userId: user.id,
    fileAssetId: row.document.fileAssetId,
  });

  if (!readUrl) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.redirect(readUrl.url);
}
