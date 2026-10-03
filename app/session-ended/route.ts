import { signOut } from "@/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export async function GET() {
  await signOut({ redirect: false });
  redirect("/sign-in");
}
