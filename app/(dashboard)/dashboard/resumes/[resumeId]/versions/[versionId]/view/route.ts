import { NextResponse } from "next/server";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { findResumeVersionForUser } from "@/features/resumes/server/resume-version.repository";
import { readImprovedResumeBytes } from "@/features/documents/server/improved-resume.service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ versionId: string }> },
) {
  const user = await requireDatabaseUser();
  const { versionId } = await params;

  const version = await findResumeVersionForUser({
    userId: user.id,
    publicId: versionId,
  });

  if (!version) {
    return new NextResponse("Not found", { status: 404 });
  }

  const file = await readImprovedResumeBytes({
    userId: user.id,
    fileAssetId: version.fileAssetId,
  });

  if (!file) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(file.bytes.byteLength),
      "Content-Disposition": `inline; filename="${file.filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
