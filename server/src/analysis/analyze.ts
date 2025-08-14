import path from "node:path";
import fs from "node:fs/promises";
import { downloadAndExtractRepo, type RepoRef } from "./github";
import { listAllFiles } from "./listFiles";
import { buildJsTsEdges } from "./jsGraph";

export type AnalysisResult = {
  repoUrl: string;
  commitSha: string;
  files: string[];
  edges: { source: string; target: string; kind: "import" | "require" | "dynamic" }[];
};

export async function analyzeRepo(ref: RepoRef): Promise<AnalysisResult> {
  // 1) download + extract
  const { workdir, rootDirName } = await downloadAndExtractRepo(ref);
  const rootAbs = path.join(workdir, rootDirName);

  try {
    // 2) list files (respecting .gitignore and defaults)
    const files = await listAllFiles(rootAbs, { maxFiles: 8000 });

    // 3) build JS/TS dependency edges
    const edges = await buildJsTsEdges(rootAbs, files);

    // 4) derive commit-like sha from extracted folder name "<repo>-<sha>"
    const commitSha = rootDirName.split("-").pop() ?? "unknown";

    return {
      repoUrl: `https://github.com/${ref.owner}/${ref.name}`,
      commitSha,
      files,
      edges,
    };
  } finally {
    // 5) cleanup temp folder (best-effort)
    fs.rm(workdir, { recursive: true, force: true }).catch(() => {});
  }
}
