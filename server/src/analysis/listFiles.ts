import fs from "node:fs/promises";
import path from "node:path";
import ignore from "ignore";

const DEFAULT_IGNORES = [
  "node_modules/",
  "dist/",
  "build/",
  ".next/",
  ".git/",
  ".cache/",
  "coverage/",
  "**/*.min.*",
  "**/*.map"
];

export type ListOptions = {
  maxFiles?: number;
  includeHidden?: boolean;
};

export async function readGitignore(rootAbs: string) {
  try {
    const data = await fs.readFile(path.join(rootAbs, ".gitignore"), "utf8");
    return data.split(/\r?\n/).filter(Boolean);
  } catch {
    return [];
  }
}

export async function listAllFiles(rootAbs: string, opts: ListOptions = {}) {
  const ig = ignore().add(DEFAULT_IGNORES).add(await readGitignore(rootAbs));
  const results: string[] = [];
  const maxFiles = opts.maxFiles ?? 5000;

  async function walk(dirAbs: string, relBase = ""): Promise<void> {
    const entries = await fs.readdir(dirAbs, { withFileTypes: true });
    for (const e of entries) {
      const rel = path.posix.join(relBase, e.name);
      if (!opts.includeHidden && e.name.startsWith(".")) continue;
      if (ig.ignores(rel + (e.isDirectory() ? "/" : ""))) continue;

      const full = path.join(dirAbs, e.name);
      if (e.isDirectory()) {
        await walk(full, rel);
      } else {
        results.push(rel);
        if (results.length >= maxFiles) return;
      }
    }
  }

  await walk(rootAbs, "");
  return results.sort((a, b) => a.localeCompare(b));
}
