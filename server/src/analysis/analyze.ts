import path from "node:path";
import fs from "node:fs/promises";
import { downloadAndExtractRepo, RepoRef } from "./github";
import { listAllFiles } from "./listFiles";

export type AnalysisResult = {
  repoUrl: string;
  commitSha: string; // best-effort extracted from folder name
  files: string[];   // repo-relative paths
};

export async function analyzeRepo(ref: RepoRef): Promise<AnalysisResult> {
  const { workdir, rootDirName } = await downloadAndExtractRepo(ref);
  const rootAbs = path.join(workdir, rootDirName);

  const files = await listAllFiles(rootAbs, { maxFiles: 8000 });

  // Try to get the commit-ish suffix from the folder name "<owner>-<repo>-<sha>"
  const sha = rootDirName.split("-").pop() ?? "unknown";

  // cleanup (best-effort, don't crash if fails)
  fs.rm(workdir, { recursive: true, force: true }).catch(() => {});

  return {
    repoUrl: `https://github.com/${ref.owner}/${ref.name}`,
    commitSha: sha,
    files
  };
}
