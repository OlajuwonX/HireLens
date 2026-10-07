#!/usr/bin/env bash
# Fails if a commit carries the signs of the force-push malware seen on
# 2026-09-26 and 2026-10-06: a payload hidden behind long runs of spaces in a
# config file, a root api.js wired into package.json scripts, fake
# public/fonts/fa-* files, and a .vscode task that runs on folder open.
#
# Reads the commit through git only. It never installs or runs project code,
# so it is safe to run before `pnpm install`.
#
# Usage: scripts/security/check-tamper.sh [<commit>]   (default: HEAD)
set -euo pipefail

rev="${1:-HEAD}"
found=0

flag() {
  echo "::error title=Possible malware::$1"
  found=1
}

files="$(git ls-tree -r --name-only "$rev")"

# 1. Files the malware adds. None of them belong in this repository.
while IFS= read -r path; do
  case "$path" in
    api.js | branch_structure.json | temp_*.bat | .vscode/tasks.json | \
      public/fonts/fa-* | *.eot)
      flag "unexpected file: $path"
      ;;
  esac
done <<<"$files"

# 2. package.json scripts that run something other than the toolchain.
while IFS= read -r path; do
  case "$path" in
    package.json | */package.json) ;;
    *) continue ;;
  esac
  case "$path" in node_modules/*) continue ;; esac
  if git cat-file -p "$rev:$path" |
    grep -nE '"[^"]+": *"[^"]*node +(\./)?(api\.js|public/)' >/dev/null; then
    flag "$path has a script that runs api.js or a file under public/"
  fi
  if git cat-file -p "$rev:$path" |
    grep -nE '"(pre|post)?install" *:' >/dev/null; then
    flag "$path defines an install lifecycle script"
  fi
done <<<"$files"

# 3. Code and config hidden behind padding: 100+ spaces then more text.
#    Real source never does this; the payloads were ~13-32 KB on one line.
while IFS= read -r path; do
  case "$path" in
    *.js | *.mjs | *.cjs | *.ts | *.mts | *.cts | *.jsx | *.tsx | *.json | \
      .vscode/*) ;;
    *) continue ;;
  esac
  case "$path" in
    pnpm-lock.yaml | package-lock.json | public/pdf.worker.min.js) continue ;;
  esac
  if git cat-file -p "$rev:$path" | LC_ALL=C grep -qE ' {100,}[^ ]'; then
    flag "$path hides content after a long run of spaces"
  fi
done <<<"$files"

# 4. Build-time config files are short. A large one is a red flag.
while IFS= read -r path; do
  case "$path" in
    */*) continue ;;
    *.config.js | *.config.mjs | *.config.cjs | *.config.ts | *.config.mts)
      size="$(git cat-file -s "$rev:$path")"
      if [ "$size" -gt 8192 ]; then
        flag "$path is $size bytes; config files here are under 2 KB"
      fi
      ;;
  esac
done <<<"$files"

# 5. Editor tasks that start a process when the folder is opened.
while IFS= read -r path; do
  case "$path" in .vscode/*) ;; *) continue ;; esac
  if git cat-file -p "$rev:$path" | grep -q '"runOn" *: *"folderOpen"'; then
    flag "$path runs a task automatically when the folder is opened"
  fi
done <<<"$files"

if [ "$found" -ne 0 ]; then
  echo "Tamper check failed for $(git rev-parse --short "$rev"). Do not install, build or open this commit in an editor."
  exit 1
fi
echo "Tamper check passed for $(git rev-parse --short "$rev")."
