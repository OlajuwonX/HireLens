import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, join } from "node:path";

export type FileSystem = { exists: (path: string) => boolean; list: (path: string) => string[] };

export type Environment = { platform: NodeJS.Platform; env: NodeJS.ProcessEnv; home: string };

const nodeFiles: FileSystem = {
  exists: existsSync,
  list: (path) => {
    try {
      return readdirSync(path);
    } catch {
      return [];
    }
  },
};

const currentEnvironment = (): Environment => ({ platform: process.platform, env: process.env, home: homedir() });

const binaryNames = (platform: NodeJS.Platform) => (platform === "win32" ? ["claude.exe", "claude.cmd"] : ["claude"]);

export function versionOf(folder: string) {
  return (folder.match(/(\d+)\.(\d+)\.(\d+)/)?.slice(1) ?? ["0", "0", "0"]).map(Number);
}

export function newestFirst(folders: string[]) {
  return [...folders].sort((a, b) => {
    const [x, y] = [versionOf(a), versionOf(b)];

    return y[0] - x[0] || y[1] - x[1] || y[2] - x[2];
  });
}

function editorBinaries(environment: Environment, files: FileSystem) {
  const binary = environment.platform === "win32" ? "claude.exe" : "claude";

  return [".vscode", ".vscode-insiders", ".cursor", ".windsurf"].flatMap((editor) => {
    const root = join(environment.home, editor, "extensions");
    const folders = files.list(root).filter((name) => name.startsWith("anthropic.claude-code"));

    return newestFirst(folders).map((folder) => join(root, folder, "resources", "native-binary", binary));
  });
}

export function claudeCandidates(environment: Environment = currentEnvironment(), files: FileSystem = nodeFiles) {
  const names = binaryNames(environment.platform);
  const fromPath = (environment.env.PATH ?? environment.env.Path ?? "")
    .split(delimiter)
    .filter(Boolean)
    .flatMap((folder) => names.map((name) => join(folder, name)));
  const installed = names.map((name) => join(environment.home, ".local", "bin", name));

  return [environment.env.HIRELENS_CLAUDE_PATH ?? "", ...fromPath, ...installed, ...editorBinaries(environment, files)].filter(Boolean);
}

export function findClaude(environment: Environment = currentEnvironment(), files: FileSystem = nodeFiles) {
  return claudeCandidates(environment, files).find((path) => files.exists(path)) ?? null;
}
