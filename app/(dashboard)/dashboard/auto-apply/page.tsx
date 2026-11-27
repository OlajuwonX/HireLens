import { redirect } from "next/navigation";
import { stageHref } from "@/features/applications/stages";

export default function AutoApplyPage() {
  redirect(stageHref("ready"));
}
