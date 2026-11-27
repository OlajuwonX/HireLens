import { join } from "node:path";
import { EXTENSION_ID, NATIVE_HOST } from "../shared/native-host";

export const BROWSERS = ["Chrome", "Brave", "Edge"] as const;

export type Browser = (typeof BROWSERS)[number];

const REGISTRY_KEYS: Record<Browser, string> = {
  Chrome: "HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts",
  Brave: "HKCU\\Software\\BraveSoftware\\Brave-Browser\\NativeMessagingHosts",
  Edge: "HKCU\\Software\\Microsoft\\Edge\\NativeMessagingHosts",
};

const MAC_FOLDERS: Record<Browser, string> = {
  Chrome: "Google/Chrome",
  Brave: "BraveSoftware/Brave-Browser",
  Edge: "Microsoft Edge",
};

const LINUX_FOLDERS: Record<Browser, string> = {
  Chrome: "google-chrome",
  Brave: "BraveSoftware/Brave-Browser",
  Edge: "microsoft-edge",
};

export function hostManifest(launcherPath: string) {
  return {
    name: NATIVE_HOST,
    description: "Lets the HireLens extension write with your Claude subscription",
    path: launcherPath,
    type: "stdio",
    allowed_origins: [`chrome-extension://${EXTENSION_ID}/`],
  };
}

export function registryKey(browser: Browser) {
  return `${REGISTRY_KEYS[browser]}\\${NATIVE_HOST}`;
}

export function manifestFolder(browser: Browser, platform: NodeJS.Platform, home: string) {
  return platform === "darwin"
    ? join(home, "Library", "Application Support", MAC_FOLDERS[browser], "NativeMessagingHosts")
    : join(home, ".config", LINUX_FOLDERS[browser], "NativeMessagingHosts");
}

export function launcherScript(platform: NodeJS.Platform, nodePath: string, hostPath: string) {
  return platform === "win32"
    ? `@echo off\r\n"${nodePath}" "${hostPath}" %*\r\n`
    : `#!/bin/sh\nexec "${nodePath}" "${hostPath}" "$@"\n`;
}
