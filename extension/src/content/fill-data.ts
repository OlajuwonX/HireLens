import { ask } from "../shared/messages";
import type { FillData } from "../shared/types";

let data: Promise<FillData> | null = null;
const files = new Map<string, Promise<File | null>>();

export function loadData() {
  data ??= ask<FillData>({ type: "fill-data", url: location.href }).then((reply) => {
    if (!reply.ok) {
      data = null;
      throw new Error(reply.message);
    }

    return reply.value;
  });

  return data;
}

export function reloadData() {
  data = null;
  files.clear();

  return loadData();
}

export function toFile(base64: string, name: string) {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  return new File([bytes], name, { type: "application/pdf" });
}

export function fileName(fill: FillData, kind: string) {
  const name = [fill.candidate.firstName, fill.candidate.lastName].filter(Boolean).join("-");

  return `${[name, kind].filter(Boolean).join("-").replace(/[^A-Za-z0-9-]/g, "")}.pdf`;
}

export function loadPdf(path: string, name: string) {
  const cached = files.get(path);

  if (cached) return cached;

  const file = ask<string>({ type: "pdf", path }).then((reply) => (reply.ok ? toFile(reply.value, name) : null));

  files.set(path, file);

  return file;
}
