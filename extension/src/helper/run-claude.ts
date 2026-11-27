import { spawn } from "node:child_process";
import { tmpdir } from "node:os";

const TIMEOUT_MS = 150_000;
const MAX_OUTPUT = 200_000;

export function claudeArguments(path: string) {
  const empty = /\.cmd$/i.test(path) ? '""' : "";

  return ["-p", "--output-format", "text", "--tools", empty, "--no-session-persistence"];
}

export function composePrompt(system: string, prompt: string) {
  return [system, "", "<task_input>", prompt, "</task_input>"].join("\n");
}

export function runClaude(path: string, system: string, prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(path, claudeArguments(path), {
      cwd: tmpdir(),
      shell: /\.cmd$/i.test(path),
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let output = "";
    let errors = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("Claude took too long to answer."));
    }, TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => {
      output = (output + chunk.toString("utf8")).slice(0, MAX_OUTPUT);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      errors = (errors + chunk.toString("utf8")).slice(-2_000);
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);

      if (code === 0 && output.trim()) resolve(output.trim());
      else reject(new Error(errors.trim() || output.trim() || `Claude stopped with code ${code}.`));
    });
    child.stdin.end(composePrompt(system, prompt));
  });
}
