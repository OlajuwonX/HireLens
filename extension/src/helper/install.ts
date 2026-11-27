import { execFileSync } from "node:child_process";
import { chmodSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { NATIVE_HOST } from "../shared/native-host";
import { findClaude } from "./claude-path";
import { BROWSERS, hostManifest, launcherScript, manifestFolder, registryKey } from "./registration";

const folder = dirname(fileURLToPath(import.meta.url));
const platform = process.platform;
const uninstall = process.argv.includes("--uninstall");
const manifestPath = join(folder, `${NATIVE_HOST}.json`);
const launcherPath = join(folder, platform === "win32" ? "hirelens-helper.bat" : "hirelens-helper.sh");

function registerWindows() {
  for (const browser of BROWSERS) {
    const args = uninstall
      ? ["delete", registryKey(browser), "/f"]
      : ["add", registryKey(browser), "/ve", "/t", "REG_SZ", "/d", manifestPath, "/f"];

    try {
      execFileSync("reg", args, { stdio: "ignore" });
      console.log(`${uninstall ? "Removed from" : "Registered for"} ${browser}`);
    } catch {
      console.log(`Skipped ${browser}`);
    }
  }
}

function registerUnix() {
  for (const browser of BROWSERS) {
    const target = join(manifestFolder(browser, platform, homedir()), `${NATIVE_HOST}.json`);

    if (uninstall) {
      rmSync(target, { force: true });
    } else {
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, JSON.stringify(hostManifest(launcherPath), null, 2));
    }

    console.log(`${uninstall ? "Removed from" : "Registered for"} ${browser}`);
  }
}

if (!uninstall) {
  writeFileSync(launcherPath, launcherScript(platform, process.execPath, join(folder, "host.mjs")));
  writeFileSync(manifestPath, JSON.stringify(hostManifest(launcherPath), null, 2));

  if (platform !== "win32") chmodSync(launcherPath, 0o755);
}

if (platform === "win32") registerWindows();
else registerUnix();

if (uninstall) {
  console.log("The HireLens Claude helper is uninstalled.");
} else {
  const claude = findClaude();

  console.log(
    claude
      ? `Claude Code found at ${claude}. Restart your browser, then choose Claude in the HireLens extension.`
      : "Claude Code was not found. Install it, sign in with your Claude account, then run this again.",
  );
}
