// backend/src/analysis/analyze.ts
import path from "node:path";
import fs from "node:fs/promises";
import { downloadAndExtractRepo, type RepoRef } from "./github";
import { listAllFiles } from "./listFiles";
import { buildJsTsEdges } from "./jsGraph";
import { collectAllDependencies, checkOutdatedDependencies } from "./dependencyUtils";
import { analyzeVulnerabilities } from "./vulnerabilities";

export type OutdatedDep = { name: string; current: string; latest: string; isOutdated: boolean };

export type AnalysisResult = {
  repoUrl: string;
  commitSha: string;
  files: string[];
  edges: { source: string; target: string; kind: "import" | "require" | "dynamic" }[];
  vulns: { critical: number; high: number; medium: number };
  depsTotal: number;
  depsOutdated: number;
  outdatedList: OutdatedDep[];
};

export async function analyzeRepo(ref: RepoRef): Promise<AnalysisResult> {
  const { workdir, rootDirName } = await downloadAndExtractRepo(ref);
  const rootAbs = path.join(workdir, rootDirName);

  try {
    const files = await listAllFiles(rootAbs, { maxFiles: 8000 });
    const edges = await buildJsTsEdges(rootAbs, files);

    // ✅ monorepo-aware dependency collection
    const deps = await collectAllDependencies(rootAbs, files);
    const outdated = await checkOutdatedDependencies(deps);

    // ✅ use deps map for OSV
    const vulns = await analyzeVulnerabilities(deps);

    const commitSha = rootDirName.split("-").pop() ?? "unknown";

    return {
      repoUrl: `https://github.com/${ref.owner}/${ref.name}`,
      commitSha,
      files,
      edges,
      vulns,
      depsTotal: Object.keys(deps).length,
      depsOutdated: outdated.filter(d => d.isOutdated).length,
      outdatedList: outdated.filter(d => d.isOutdated),
    };
  } finally {
    fs.rm(workdir, { recursive: true, force: true }).catch(() => {});
  }
}
