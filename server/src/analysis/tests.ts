import path from "node:path";
import fs from "node:fs/promises";

export type TestAnalytics = {
  testFiles: number;
  byExt: Record<string, number>;
  testFrameworks: string[];
};

export async function computeTestAnalytics(
  files: string[],
  deps: Record<string, string>,
  rootAbs?: string
): Promise<TestAnalytics> {
  const CODE_EXTS = new Set([".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"]);
  const byExt: Record<string, number> = {};
  let testFiles = 0;

  for (const rel of files) {
    const ext = path.extname(rel).toLowerCase();
    const base = path.basename(rel).toLowerCase();
    const inTestDir = rel.split("/").some(seg => seg === "__tests__" || seg === "tests");
    const nameIsTest =
      /\.test\.(js|jsx|ts|tsx|mjs|cjs)$/i.test(base) ||
      /\.spec\.(js|jsx|ts|tsx|mjs|cjs)$/i.test(base);

    if ((inTestDir && CODE_EXTS.has(ext)) || nameIsTest) {
      testFiles++;
      byExt[ext] = (byExt[ext] ?? 0) + 1;
    }
  }

  // --- Framework detection ---
  const depNames = Object.keys(deps);
  const hasDep = (pkg: string) =>
    depNames.includes(pkg) || depNames.some(n => n === pkg || n.endsWith(`/${pkg}`));

  const frameworksSet = new Set<string>();
  if (hasDep("jest") || hasDep("@jest/globals") || hasDep("ts-jest")) frameworksSet.add("jest");
  if (hasDep("vitest")) frameworksSet.add("vitest");
  if (hasDep("mocha")) frameworksSet.add("mocha");
  if (hasDep("jasmine")) frameworksSet.add("jasmine");
  if (hasDep("ava")) frameworksSet.add("ava");
  if (hasDep("tap")) frameworksSet.add("tap");
  if (hasDep("cypress")) frameworksSet.add("cypress");
  if (hasDep("@playwright/test") || hasDep("playwright")) frameworksSet.add("playwright");
  if (hasDep("karma")) frameworksSet.add("karma");

  // Config-file hints
  const configNames: [string, string[]][] = [
    ["jest", ["jest.config.js", "jest.config.ts", "jest.config.mjs", "jest.config.cjs"]],
    ["vitest", ["vitest.config.ts", "vitest.config.js", "vite.config.ts", "vite.config.js"]],
    ["mocha", [".mocharc.js", ".mocharc.cjs", "mocha.opts"]],
    ["cypress", ["cypress.json", "cypress.config.ts", "cypress.config.js"]],
    ["playwright", ["playwright.config.ts", "playwright.config.js"]],
    ["karma", ["karma.conf.js", "karma.conf.ts"]],
    ["ava", ["ava.config.js", "ava.config.cjs", "ava.config.mjs"]],
  ];

  for (const [name, cfgs] of configNames) {
    if (files.some(f => cfgs.some((c: string) => f.endsWith(`/${c}`) || f === c))) {
      frameworksSet.add(name);
    }
  }

  // Scripts hints from package.json
  try {
    if (rootAbs) {
      const pkgRaw = await fs.readFile(path.join(rootAbs, "package.json"), "utf8").catch(() => "");
      if (pkgRaw) {
        const pkg = JSON.parse(pkgRaw);
        const scripts: string[] = pkg?.scripts ? Object.values(pkg.scripts as Record<string, string>) : [];
        const scriptHas = (needle: string) => scripts.some(s => s.includes(needle));
        if (scriptHas("jest")) frameworksSet.add("jest");
        if (scriptHas("vitest")) frameworksSet.add("vitest");
        if (scriptHas("mocha")) frameworksSet.add("mocha");
        if (scriptHas("cypress")) frameworksSet.add("cypress");
        if (scriptHas("playwright")) frameworksSet.add("playwright");
        if (scriptHas("ava")) frameworksSet.add("ava");
        if (scriptHas("tap")) frameworksSet.add("tap");
      }
    }
  } catch {
    // ignore
  }

  return {
    testFiles,
    byExt,
    testFrameworks: Array.from(frameworksSet).sort(),
  };
}
