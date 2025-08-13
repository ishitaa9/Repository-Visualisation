import { fetch } from "undici";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import * as tar from "tar";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

export type RepoRef = { owner: string; name: string; ref?: string };

async function tryDownload(url: string, destPath: string) {
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`);
  }
  // Undici gives a Web ReadableStream; convert to Node stream
  const src = Readable.fromWeb(res.body as any);
  const out = fs.createWriteStream(destPath);
  await pipeline(src, out);
}

export async function downloadAndExtractRepo(ref: RepoRef): Promise<{ workdir: string; rootDirName: string }> {
  const candidates = [
    ref.ref,             // explicit ref if provided
    "HEAD",              // latest default branch (works for most repos)
    "main",
    "master",
  ].filter(Boolean) as string[];

  const tmpBase = await fsp.mkdtemp(path.join(os.tmpdir(), "repoviz-"));
  const archivePath = path.join(tmpBase, "repo.tar.gz");

  let lastErr: unknown = null;
  for (const r of candidates) {
    const url = `https://codeload.github.com/${ref.owner}/${ref.name}/tar.gz/${encodeURIComponent(r)}`;
    try {
      await tryDownload(url, archivePath);
      // success, break out
      break;
    } catch (e) {
      lastErr = e;
      // try next candidate
      continue;
    }
  }

  // If archive doesn't exist or is empty, throw the last error
  try {
    const stat = await fsp.stat(archivePath);
    if (!stat.size) throw lastErr ?? new Error("Downloaded archive is empty");
  } catch {
    throw lastErr ?? new Error("Failed to download repository tarball");
  }

  // Extract
  await tar.x({
    file: archivePath,
    cwd: tmpBase,
    gzip: true,
  });

  // GitHub wraps contents in "<owner>-<repo>-<sha>/" dir
  const entries = await fsp.readdir(tmpBase, { withFileTypes: true });
  // const root = entries.find(
  //   (e) => e.isDirectory() && e.name.startsWith(`${ref.owner}-${ref.name}-`)
  // );
  // if (!root) {
  //   throw new Error("Extraction failed: could not find root directory");
  // }

  // Gather directories only
  const dirNames = entries.filter(e => e.isDirectory()).map(e => e.name);

  // Prefer "<repo>-..." if present; otherwise fall back to the first directory.
  const preferredPrefix = `${ref.name}-`;
  const rootName =
    dirNames.find(n => n.startsWith(preferredPrefix)) ??
    dirNames[0];

  if (!rootName) {
    // Helpful diagnostics
    const allNames = entries.map(e => (e.isDirectory() ? `[D]` : `[F]`) + e.name).join(", ");
    throw new Error(
      `Extraction failed: could not find root directory. Entries: ${allNames}`
    );
  }

  return { workdir: tmpBase, rootDirName: rootName };
}
