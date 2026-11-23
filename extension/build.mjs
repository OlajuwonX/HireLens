import { build } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";

const entries = {
  background: "src/background/index.ts",
  content: "src/content/index.ts",
  connect: "src/content/connect.ts",
  popup: "src/popup/index.ts",
};

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });

await build({
  entryPoints: entries,
  outdir: "dist",
  bundle: true,
  format: "iife",
  target: "chrome120",
  minify: false,
  legalComments: "none",
  logLevel: "warning",
});

await cp("static", "dist", { recursive: true });

console.log("Built the HireLens extension into extension/dist");
