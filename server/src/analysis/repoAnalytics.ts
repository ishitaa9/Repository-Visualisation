import path from "node:path";
import fs from "node:fs/promises";

export async function computeRepoAnalytics(rootAbs: string, files: string[]): Promise<RepoAnalytics> {
  // License detection
  const licenseFile = files.find(f => /^license(\.|$)/i.test(path.basename(f)));
  let license: string | null = null;
  if (licenseFile) {
    try {
      const txt = await fs.readFile(path.join(rootAbs, licenseFile), "utf8");
      if (/mit/i.test(txt)) license = "MIT";
      else if (/apache/i.test(txt)) license = "Apache-2.0";
      else if (/gpl/i.test(txt)) license = "GPL";
      else license = "Other";
    } catch {}
  }

  // Dependencies (only package.json for MVP)
  let depsTotal = 0;
  try {
    const pkgFile = files.find(f => f.endsWith("package.json"));
    if (pkgFile) {
      const pkgRaw = await fs.readFile(path.join(rootAbs, pkgFile), "utf8");
      const pkg = JSON.parse(pkgRaw);
      depsTotal =
        Object.keys(pkg.dependencies || {}).length +
        Object.keys(pkg.devDependencies || {}).length;
    }
  } catch {}

  // Tests
  const testFiles = files.filter(f =>
    /(test|spec)/i.test(f) || f.includes("__tests__")
  ).length;

  // Security policy
  const hasSecurityPolicy = files.some(f =>
    /^security\.md$/i.test(path.basename(f))
  );

  return {
    license,
    depsTotal,
    depsOutdated: null,  // optional later
    contributors: null,  // needs GitHub API
    busFactor: null,
    hasSecurityPolicy,
    testFiles,
    vulnsCritical: null,
    vulnsHigh: null,
    vulnsMedium: null,
  };
}
