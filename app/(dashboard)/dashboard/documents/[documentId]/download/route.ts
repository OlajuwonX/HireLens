import { NextResponse } from "next/server";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { findDocumentRowForUser } from "@/features/documents/server/document.repository";
import { readImprovedResumeBytes } from "@/features/documents/server/improved-resume.service";
import {
  documentDesignSelection,
  renderResumeDesignDownload,
} from "@/features/documents/server/resume-design.service";
import { readResumeDesignSelection } from "@/lib/resume-design";

function attachment(filename: string) {
  return `attachment; filename="${filename.replace(/["\\\r\n]/g, "")}"`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  const user = await requireDatabaseUser();
  const { documentId } = await params;
  const row = await findDocumentRowForUser({
    userId: user.id,
    publicId: documentId,
  });

  if (!row) {
    return new NextResponse("Not found", { status: 404 });
  }

  const query = new URL(request.url).searchParams;
  const format = query.get("format")?.toUpperCase() === "DOCX" ? "DOCX" : "PDF";

  if (row.document.type === "IMPROVED_RESUME") {
    const saved = documentDesignSelection(row);
    const selection = readResumeDesignSelection({
      template: query.get("template") ?? saved.template,
      typography: query.get("typography") ?? saved.typography,
      spacing: query.get("spacing") ?? saved.spacing,
    });
    const rendered = await renderResumeDesignDownload({
      userId: user.id,
      publicId: documentId,
      selection,
      format,
    });

    if (rendered) {
      return new NextResponse(new Uint8Array(rendered.bytes), {
        headers: {
          "Content-Type": rendered.contentType,
          "Content-Length": String(rendered.bytes.byteLength),
          "Content-Disposition": attachment(rendered.filename),
          "Cache-Control": "private, no-store",
        },
      });
    }
  }

  if (format === "DOCX" || !row.document.fileAssetId) {
    return new NextResponse("Not found", { status: 404 });
  }

  const file = await readImprovedResumeBytes({
    userId: user.id,
    fileAssetId: row.document.fileAssetId,
  });

  if (!file) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(new Uint8Array(file.bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(file.bytes.byteLength),
      "Content-Disposition": attachment(file.filename),
      "Cache-Control": "private, no-store",
    },
  });
}
