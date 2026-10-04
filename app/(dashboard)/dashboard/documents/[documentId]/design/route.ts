import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireDatabaseUser } from "@/features/auth/server/require-database-user";
import { saveResumeDesignSchema } from "@/features/documents/schemas/resume-design.schema";
import { saveResumeDesignSelection } from "@/features/documents/server/resume-design.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return new NextResponse(null, { status: 403 });
  }

  const user = await requireDatabaseUser();
  const { documentId } = await params;
  const form = await request.formData();
  const parsed = saveResumeDesignSchema.safeParse({
    publicId: documentId,
    template: form.get("template"),
    typography: form.get("typography"),
    spacing: form.get("spacing"),
  });

  if (!parsed.success) {
    return new NextResponse(null, { status: 400 });
  }

  const result = await saveResumeDesignSelection({
    userId: user.id,
    publicId: parsed.data.publicId,
    selection: {
      template: parsed.data.template,
      typography: parsed.data.typography,
      spacing: parsed.data.spacing,
    },
  });

  if (!result.ok) {
    return new NextResponse(null, { status: 404 });
  }

  revalidatePath(`/dashboard/documents/${parsed.data.publicId}`);

  return new NextResponse(null, { status: 204 });
}
