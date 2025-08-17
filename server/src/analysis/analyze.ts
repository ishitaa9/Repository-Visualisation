import path from "node:path";
import fs from "node:fs/promises";
import { downloadAndExtractRepo, type RepoRef } from "./github";
import { listAllFiles } from "./listFiles";
import { buildJsTsEdges } from "./jsGraph";
import { collectAllDependencies, checkOutdatedDependencies } from "./dependencyUtils";
import { computeTestAnalytics } from "./tests";

export type OutdatedDep = {
  name: string;
  current: string;
  latest: string;
  isOutdated: boolean;
};

export type GraphEdge = { source: string; target: string; kind: "import" | "require" | "dynamic" };

export type AnalysisResult = {
  repoUrl: string;
  commitSha: string;
  files: string[];
  edges: GraphEdge[];
  // deps
  depsTotal: number;
  depsOutdated: number;
  outdatedList: OutdatedDep[];
  // tests
  testFiles: number;
  testFrameworks: string[];
  // metadata
  license: string | null;
};

/** Try read license from package.json or LICENSE files. */
async function detectLicense(rootAbs: string, files: string[]): Promise<string | null> {
  try {
    const pkgRaw = await fs.readFile(path.join(rootAbs, "package.json"), "utf8");
    const pkg = JSON.parse(pkgRaw);
    if (typeof pkg.license === "string" && pkg.license.trim()) {
      return pkg.license.trim();
    }
  } catch {
    // ignore
  }

  const licenseRel = files.find((f) => {
    const base = path.basename(f).toLowerCase();
    return base === "license" || base.startsWith("license.");
  });
  if (licenseRel) {
    try {
      const txt = await fs.readFile(path.join(rootAbs, licenseRel), "utf8");
      if (/mit/i.test(txt)) return "MIT";
      if (/apache/i.test(txt)) return "Apache-2.0";
      if (/\bgpl\b/i.test(txt)) return "GPL";
      if (/bsd/i.test(txt)) return "BSD";
      return "Other";
    } catch {
      // ignore
    }
  }

  return null;
}

export async function analyzeRepo(ref: RepoRef): Promise<AnalysisResult> {
  const { workdir, rootDirName } = await downloadAndExtractRepo(ref);
  const rootAbs = path.join(workdir, rootDirName);

  try {
    // Files + edges
    const files = await listAllFiles(rootAbs, { maxFiles: 8000 });
    const edges = await buildJsTsEdges(rootAbs, files);

    // Deps + outdated
    const deps = await collectAllDependencies(rootAbs, files);
    const outdated = await checkOutdatedDependencies(deps);

    // Tests
    const { testFiles, testFrameworks } = await computeTestAnalytics(files, deps, rootAbs);

    // License
    const license = await detectLicense(rootAbs, files);

    // Commit-ish
    const commitSha = rootDirName.split("-").pop() ?? "unknown";

    return {
      repoUrl: `https://github.com/${ref.owner}/${ref.name}`,
      commitSha,
      files,
      edges,
      depsTotal: Object.keys(deps).length,
      depsOutdated: outdated.filter((d) => d.isOutdated).length,
      outdatedList: outdated.filter((d) => d.isOutdated),
      testFiles,
      testFrameworks,
      license,
    };
  } finally {
    // cleanup temp
    fs.rm(workdir, { recursive: true, force: true }).catch(() => {});
  }
}