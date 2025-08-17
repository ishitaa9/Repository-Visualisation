// backend/src/analysis/universalGraph.ts
import fs from "node:fs/promises";
import path from "node:path";

export type GraphNode = {
  id: string;      // unique ID (repo-relative path)
  path: string;    // repo-relative path
  type: string;    // e.g., "file"
  language?: string;
};

export type GraphEdge = {
  source: string;  // node.id
  target: string;  // node.id
  kind: "import" | "require" | "dynamic";
};

/** Lightweight language detector based on file extension. */
export function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".ts": return "TypeScript";
    case ".tsx": return "TSX";
    case ".js": return "JavaScript";
    case ".jsx": return "JSX";
    case ".mjs": return "JavaScript";
    case ".cjs": return "JavaScript";
    case ".py": return "Python";
    case ".go": return "Go";
    case ".rs": return "Rust";
    case ".java": return "Java";
    case ".kt": return "Kotlin";
    case ".cs": return "C#";
    case ".php": return "PHP";
    case ".rb": return "Ruby";
    case ".cpp":
    case ".cc":
    case ".cxx": return "C++";
    case ".c": return "C";
    case ".swift": return "Swift";
    case ".scala": return "Scala";
    case ".hs": return "Haskell";
    default: return "Other";
  }
}

/**
 * Build a universal graph (multi-language) from a list of repo-relative files.
 * Ensures node IDs match exactly the paths used by edges.
 */
export async function buildUniversalGraph(
  rootDir: string,
  relFiles: string[]
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  // Normalize paths to POSIX style for consistency
  const files = relFiles.map(f => f.replace(/\\/g, "/"));

  const nodes: GraphNode[] = files.map((relPath) => ({
    id: relPath,
    path: relPath,
    type: "file",
    language: detectLanguage(relPath),
  }));

  const edges: GraphEdge[] = [];
  const fileSet = new Set(files);

  for (const relPath of files) {
    const absPath = path.join(rootDir, relPath);
    let content = "";
    try {
      content = await fs.readFile(absPath, "utf8");
    } catch {
      continue;
    }

    const ext = path.extname(relPath).toLowerCase();

    // --- JS / TS (import / require) ---
    if ([".js", ".ts", ".jsx", ".tsx", ".mjs", ".cjs"].includes(ext)) {
      const importRegex = /import\s+?(?:[^'"]*?\sfrom\s)?['"](.*?)['"]/g;
      const requireRegex = /require\(['"](.*?)['"]\)/g;
      let m: RegExpExecArray | null;

      while ((m = importRegex.exec(content))) {
        const target = resolveJsLike(relPath, m[1], fileSet);
        if (target) edges.push({ source: relPath, target, kind: "import" });
      }
      while ((m = requireRegex.exec(content))) {
        const target = resolveJsLike(relPath, m[1], fileSet);
        if (target) edges.push({ source: relPath, target, kind: "require" });
      }
    }

    // --- Python (import / from ... import ...) ---
    if (ext === ".py") {
      const importRegex = /^\s*(?:from|import)\s+([a-zA-Z_][\w\.]*)/gm;
      let m: RegExpExecArray | null;
      while ((m = importRegex.exec(content))) {
        const mod = m[1].replace(/\./g, "/");
        // try exact file, then package __init__.py
        const candidates = [`${mod}.py`, `${mod}/__init__.py`];
        const hit = candidates.find((c) => fileSet.has(c));
        if (hit) edges.push({ source: relPath, target: hit, kind: "import" });
      }
    }

    // --- Go (import "pkg") ---
    if (ext === ".go") {
      const importBlock = /import\s*\(([\s\S]*?)\)|import\s+["']([^"']+)["']/g;
      let m: RegExpExecArray | null;
      while ((m = importBlock.exec(content))) {
        const block = m[1];
        const single = m[2];
        const pkgs: string[] = [];
        if (block) {
          const inner = block.match(/["']([^"']+)["']/g) || [];
          inner.forEach(s => pkgs.push(s.replace(/["']/g, "")));
        }
        if (single) pkgs.push(single);
        // Try mapping import path to a local file (best-effort)
        for (const p of pkgs) {
          // Heuristic: same-folder file with same basename
          const base = p.split("/").pop() || p;
          const guess = `${base}.go`;
          if (fileSet.has(guess)) edges.push({ source: relPath, target: guess, kind: "import" });
        }
      }
    }

    // --- Rust (use crate::x::y) ---
    if (ext === ".rs") {
      const useRegex = /use\s+([a-zA-Z_][\w:]+)/g;
      let m: RegExpExecArray | null;
      while ((m = useRegex.exec(content))) {
        const mod = m[1].replace(/::/g, "/");
        const candidates = [`${mod}.rs`, `${mod}/mod.rs`, `${mod}/lib.rs`];
        const hit = candidates.find((c) => fileSet.has(c));
        if (hit) edges.push({ source: relPath, target: hit, kind: "import" });
      }
    }

    // --- Java (import a.b.C;) ---
    if (ext === ".java") {
      const importRegex = /import\s+([a-zA-Z_][\w\.]*)\s*;/g;
      let m: RegExpExecArray | null;
      while ((m = importRegex.exec(content))) {
        const mod = m[1].replace(/\./g, "/");
        const candidate = `${mod}.java`;
        if (fileSet.has(candidate)) edges.push({ source: relPath, target: candidate, kind: "import" });
      }
    }

    // --- C# (using A.B;) ---
    if (ext === ".cs") {
      const usingRegex = /using\s+([a-zA-Z_][\w\.]*)\s*;/g;
      let m: RegExpExecArray | null;
      while ((m = usingRegex.exec(content))) {
        const mod = m[1].replace(/\./g, "/");
        const candidate = `${mod}.cs`;
        if (fileSet.has(candidate)) edges.push({ source: relPath, target: candidate, kind: "import" });
      }
    }
  }

  // Keep only edges that connect existing nodes (paranoia)
  const idSet = new Set(nodes.map(n => n.id));
  const cleanEdges = edges.filter(e => idSet.has(e.source) && idSet.has(e.target));

  return { nodes, edges: cleanEdges };
}

/** Resolve relative module specs for JS/TS-like imports. */
function resolveJsLike(fromRel: string, spec: string, fileSet: Set<string>): string | null {
  // Only resolve relative paths; ignore packages
  if (!spec.startsWith(".") && !spec.startsWith("/")) return null;
  const baseDir = path.posix.dirname(fromRel.replace(/\\/g, "/"));
  const base = path.posix.normalize(path.posix.join(baseDir, spec)).replace(/\\/g, "/");

  const tryPaths = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.js`,
    `${base}.jsx`,
    path.posix.join(base, "index.ts"),
    path.posix.join(base, "index.tsx"),
    path.posix.join(base, "index.js"),
    path.posix.join(base, "index.jsx"),
  ];

  for (const p of tryPaths) {
    if (fileSet.has(p)) return p;
  }
  return null;
}
