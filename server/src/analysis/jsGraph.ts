import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";

export type Edge = {
  source: string;
  target: string;
  kind: "import" | "require" | "dynamic";
};

const CODE_EXTS = [".ts", ".tsx", ".js", ".jsx"];
const INDEX_BASENAMES = ["index.ts", "index.tsx", "index.js", "index.jsx"];

/**
 * Build import edges for .js/.jsx/.ts/.tsx files in the repo.
 * @param rootAbs Absolute path to repo root.
 * @param files List of repo-relative file paths.
 */
export async function buildJsTsEdges(
  rootAbs: string,
  files: string[]
): Promise<Edge[]> {
  const codeFiles = files.filter((p) =>
    CODE_EXTS.includes(path.extname(p).toLowerCase())
  );
  const edges: Edge[] = [];

  // Map for quick file existence check
  const fileSet = new Set(files.map((n) => n.replace(/\\/g, "/")));

  for (const rel of codeFiles) {
    const abs = path.join(rootAbs, rel);
    const srcId = normalize(rel);

    let code = "";
    try {
      code = await fs.readFile(abs, "utf8");
    } catch {
      continue;
    }

    let ast: any;
    try {
      ast = parse(code, {
        sourceType: "unambiguous",
        plugins: [
          "typescript",
          "jsx",
          "importAssertions",
          "classProperties",
          "dynamicImport",
        ],
      });
    } catch (err) {
      console.warn(`Parse failed for ${rel}:`, (err as any)?.message);
      continue;
    }

    traverse(ast, {
      ImportDeclaration(p) {
        const spec = p.node.source.value;
        const tgt = resolveImport(rootAbs, rel, spec, fileSet);
        if (tgt)
          edges.push({ source: srcId, target: tgt, kind: "import" });
      },
      CallExpression(p) {
        const callee = p.node.callee;
        if (callee?.type === "Identifier" && callee.name === "require") {
          const arg = p.node.arguments?.[0];
          if (arg && arg.type === "StringLiteral") {
            const tgt = resolveImport(rootAbs, rel, arg.value, fileSet);
            if (tgt)
              edges.push({ source: srcId, target: tgt, kind: "require" });
          }
        }
      },
      Import(p) {
        const arg = (p.parent as any)?.arguments?.[0];
        if (arg && arg.type === "StringLiteral") {
          const tgt = resolveImport(rootAbs, rel, arg.value, fileSet);
          if (tgt)
            edges.push({ source: srcId, target: tgt, kind: "dynamic" });
        }
      },
    });
  }

  return edges;
}

function normalize(p: string) {
  return p.replace(/\\/g, "/");
}

/**
 * Resolve a module specifier to a repo-relative file path.
 * Only handles relative imports for MVP.
 */
function resolveImport(
  rootAbs: string,
  fromRel: string,
  spec: string,
  fileSet: Set<string>
): string | null {
  // Skip external packages
  if (!spec.startsWith(".") && !spec.startsWith("/")) return null;

  const fromDir = path.posix.dirname(fromRel.replace(/\\/g, "/"));
  const base = path.posix.normalize(path.posix.join(fromDir, spec));

  // Direct with extension
  if (fileSet.has(base)) return base;

  // Try known extensions
  for (const ext of CODE_EXTS) {
    if (fileSet.has(base + ext)) return base + ext;
  }

  // Try index.* inside a directory
  for (const idx of INDEX_BASENAMES) {
    const candidate = path.posix.join(base, idx);
    if (fileSet.has(candidate)) return candidate;
  }

  return null;
}
