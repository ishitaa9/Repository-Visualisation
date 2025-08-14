// backend/src/analysis/dependencyUtils.ts
import fs from "node:fs/promises";
import path from "node:path";
import { fetch } from "undici";

export type DependencyMap = Record<string, string>;
export type OutdatedDep = { name: string; current: string; latest: string; isOutdated: boolean };

export async function collectAllDependencies(rootAbs: string, files: string[]): Promise<DependencyMap> {
  // find every package.json except inside node_modules
  const manifests = files
    .filter(f => f.endsWith("package.json"))
    .filter(f => !/\/node_modules\//.test(f));

  const aggregate: DependencyMap = {};

  for (const relPkg of manifests) {
    const dirRel = relPkg.replace(/\/[^/]+$/, "");
    const lockRel = path.posix.join(dirRel, "package-lock.json");

    // prefer exact versions from lockfile in same folder
    const lockDeps = await readLockfile(rootAbs, lockRel);
    if (lockDeps) {
      for (const [n, v] of Object.entries(lockDeps)) aggregate[n] = v;
      continue;
    }

    // fallback to ranges in this package.json
    const pkgDeps = await readManifestDeps(rootAbs, relPkg);
    for (const [n, v] of Object.entries(pkgDeps)) aggregate[n] = v;
  }

  return aggregate;
}

async function readManifestDeps(rootAbs: string, relPkg: string): Promise<DependencyMap> {
  try {
    const raw = await fs.readFile(path.join(rootAbs, relPkg), "utf8");
    const pkg = JSON.parse(raw);
    return {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    };
  } catch {
    return {};
  }
}

// npm v7+ and v6 lockfile support (package-lock.json)
async function readLockfile(rootAbs: string, lockRel: string): Promise<DependencyMap | null> {
  try {
    const raw = await fs.readFile(path.join(rootAbs, lockRel), "utf8");
    const lock = JSON.parse(raw);
    const out: DependencyMap = {};

    if (lock.packages) {
      for (const [pkgPath, info] of Object.entries<any>(lock.packages)) {
        if (!info?.version) continue;
        if (pkgPath?.startsWith("node_modules/")) {
          const name = pkgPath.replace(/^node_modules\//, "");
          out[name] = info.version;
        }
      }
      return out;
    }

    if (lock.dependencies) {
      const walk = (deps: any) => {
        for (const [name, info] of Object.entries<any>(deps)) {
          if (info?.version) out[name] = info.version;
          if (info?.dependencies) walk(info.dependencies);
        }
      };
      walk(lock.dependencies);
      return out;
    }

    return null;
  } catch {
    return null;
  }
}

export async function checkOutdatedDependencies(deps: DependencyMap): Promise<OutdatedDep[]> {
  const results: OutdatedDep[] = [];
  for (const [name, currentRaw] of Object.entries(deps)) {
    const current = sanitizeSemver(currentRaw);
    if (!current) {
      results.push({ name, current: currentRaw, latest: "unknown", isOutdated: false });
      continue;
    }
    try {
      const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}/latest`);
      if (!res.ok) {
        results.push({ name, current, latest: "unknown", isOutdated: false });
        continue;
      }
      const meta: any = await res.json();
      const latest = sanitizeSemver(String(meta.version || ""));
      results.push({ name, current, latest: latest || "unknown", isOutdated: latest ? compareVersions(current, latest) < 0 : false });
    } catch {
      results.push({ name, current, latest: "unknown", isOutdated: false });
    }
  }
  return results;
}

function sanitizeSemver(v: string): string | null {
  if (!v) return null;
  if (/^(git|ssh|https?:|workspace:|file:)/i.test(v)) return null;
  const m = v.match(/(\d+)\.(\d+)\.(\d+)/);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : null;
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(n => parseInt(n, 10));
  const pb = b.split(".").map(n => parseInt(n, 10));
  for (let i = 0; i < 3; i++) {
    const av = pa[i] ?? 0, bv = pb[i] ?? 0;
    if (av < bv) return -1;
    if (av > bv) return 1;
  }
  return 0;
}
