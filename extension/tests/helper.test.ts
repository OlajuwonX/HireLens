import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { claudeCandidates, findClaude, newestFirst } from "../src/helper/claude-path";
import { handleRequest } from "../src/helper/host";
import { createMessageReader, encodeMessage } from "../src/helper/protocol";
import { hostManifest, launcherScript, manifestFolder, registryKey } from "../src/helper/registration";
import { claudeArguments, composePrompt, runClaude } from "../src/helper/run-claude";
import { EXTENSION_ID, NATIVE_HOST } from "../src/shared/native-host";

describe("native messaging frames", () => {
  it("round-trips messages split across chunks", () => {
    const received: unknown[] = [];
    const read = createMessageReader((message) => received.push(message));
    const bytes = Buffer.concat([encodeMessage({ type: "ping" }), encodeMessage({ type: "complete", prompt: "é" })]);

    read(bytes.subarray(0, 3));
    read(bytes.subarray(3, 15));
    read(bytes.subarray(15));

    expect(received).toEqual([{ type: "ping" }, { type: "complete", prompt: "é" }]);
  });
});

describe("finding Claude Code", () => {
  const environment = { platform: "win32" as const, env: { PATH: "C:\\bin" }, home: "C:\\Users\\ada" };

  it("prefers an explicit path, then PATH, then the native installer, then the newest editor copy", () => {
    const candidates = claudeCandidates(
      { ...environment, env: { ...environment.env, HIRELENS_CLAUDE_PATH: "D:\\claude.exe" } },
      { exists: () => false, list: () => ["anthropic.claude-code-2.1.9-win32-x64", "anthropic.claude-code-2.1.30-win32-x64", "other"] },
    );

    expect(candidates[0]).toBe("D:\\claude.exe");
    expect(candidates[1]).toBe(join("C:\\bin", "claude.exe"));
    expect(candidates).toContain(join("C:\\Users\\ada", ".local", "bin", "claude.exe"));
    expect(candidates.find((path) => path.includes("claude-code"))).toContain("2.1.30");
  });

  it("returns the first copy that exists, or null", () => {
    const editorCopy = join("C:\\Users\\ada", ".vscode", "extensions", "anthropic.claude-code-2.1.330-win32-x64", "resources", "native-binary", "claude.exe");
    const files = { exists: (path: string) => path === editorCopy, list: () => ["anthropic.claude-code-2.1.330-win32-x64"] };

    expect(findClaude(environment, files)).toBe(editorCopy);
    expect(findClaude(environment, { exists: () => false, list: () => [] })).toBeNull();
  });

  it("orders editor versions numerically", () => {
    expect(newestFirst(["a-2.1.9", "a-2.1.330", "a-2.0.99"])).toEqual(["a-2.1.330", "a-2.1.9", "a-2.0.99"]);
  });
});

describe("browser registration", () => {
  it("only lets this extension talk to the helper", () => {
    expect(hostManifest("C:\\h\\hirelens-helper.bat")).toEqual({
      name: NATIVE_HOST,
      description: expect.any(String),
      path: "C:\\h\\hirelens-helper.bat",
      type: "stdio",
      allowed_origins: [`chrome-extension://${EXTENSION_ID}/`],
    });
  });

  it("pins the extension id to the key in the manifest", () => {
    const manifest = JSON.parse(readFileSync("static/manifest.json", "utf8")) as { key: string };
    const hash = createHash("sha256").update(Buffer.from(manifest.key, "base64")).digest("hex").slice(0, 32);
    const id = [...hash].map((digit) => String.fromCharCode(97 + Number.parseInt(digit, 16))).join("");

    expect(id).toBe(EXTENSION_ID);
  });

  it("registers for Brave, Chrome and Edge in the places each browser reads", () => {
    expect(registryKey("Brave")).toBe(`HKCU\\Software\\BraveSoftware\\Brave-Browser\\NativeMessagingHosts\\${NATIVE_HOST}`);
    expect(manifestFolder("Brave", "darwin", "/Users/ada")).toBe(
      join("/Users/ada", "Library", "Application Support", "BraveSoftware/Brave-Browser", "NativeMessagingHosts"),
    );
    expect(manifestFolder("Chrome", "linux", "/home/ada")).toBe(join("/home/ada", ".config", "google-chrome", "NativeMessagingHosts"));
  });

  it("launches the helper with the node that installed it", () => {
    expect(launcherScript("win32", "C:\\node.exe", "C:\\h\\host.mjs")).toBe('@echo off\r\n"C:\\node.exe" "C:\\h\\host.mjs" %*\r\n');
  });
});

describe("the helper host", () => {
  it("reports whether Claude Code is available", async () => {
    expect(await handleRequest({ type: "ping" }, () => "claude")).toEqual({ ok: true, version: "1.0.0", claude: true });
    expect(await handleRequest({ type: "ping" }, () => null)).toMatchObject({ claude: false });
  });

  it("returns Claude's text or a readable failure", async () => {
    const request = { type: "complete" as const, system: "S", prompt: "P" };

    expect(await handleRequest(request, () => "claude", async () => "Hello")).toEqual({ ok: true, text: "Hello" });
    expect(await handleRequest(request, () => "claude", async () => Promise.reject(new Error("Not signed in")))).toEqual({
      ok: false,
      message: "Not signed in",
    });
    expect(await handleRequest(request, () => null)).toMatchObject({ ok: false });
  });

  it("runs Claude with no tools and no saved session", () => {
    expect(claudeArguments("C:\\claude.exe")).toEqual(["-p", "--output-format", "text", "--tools", "", "--no-session-persistence"]);
    expect(claudeArguments("C:\\claude.cmd")).toContain('""');
    expect(composePrompt("Rules", "Input")).toBe("Rules\n\n<task_input>\nInput\n</task_input>");
  });
});

describe.skipIf(process.platform !== "win32")("running a Claude command", () => {
  it("passes the prompt on stdin and returns the output", async () => {
    const folder = mkdtempSync(join(tmpdir(), "hirelens-claude-"));
    const script = join(folder, "fake.mjs");
    const command = join(folder, "claude.cmd");

    writeFileSync(script, "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>process.stdout.write('ARGS='+process.argv.slice(2).join('|')+' LEN='+s.length+' '+s.slice(0,5)));");
    writeFileSync(command, `@echo off\r\n"${process.execPath}" "${script}" %*\r\n`);

    const output = await runClaude(command, "Rules", "Question");

    expect(output).toContain("ARGS=-p|--output-format|text|--tools|");
    expect(output).toContain("--no-session-persistence");
    expect(output).toContain(" Rules");
  });
});

describe("the built helper", () => {
  it("answers a browser ping over stdio", async () => {
    const child = spawn(process.execPath, ["helper-dist/host.mjs"], { stdio: ["pipe", "pipe", "inherit"] });
    const reply = await new Promise<unknown>((resolve) => {
      const read = createMessageReader(resolve);

      child.stdout.on("data", read);
      child.stdin.write(encodeMessage({ type: "ping" }));
    });

    expect(reply).toMatchObject({ ok: true, version: "1.0.0" });
  });
});
