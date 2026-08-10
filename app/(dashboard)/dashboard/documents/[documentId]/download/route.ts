import { NextResponse } from "next/server";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { createOwnedDocumentReadUrl } from "@/features/documents/server/document.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const user = await requireDatabaseUser();
  const { documentId } = await params;

  const readUrl = await createOwnedDocumentReadUrl({
    userId: user.id,
    publicId: documentId,
  });

  if (!readUrl) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.redirect(readUrl.url);
}
