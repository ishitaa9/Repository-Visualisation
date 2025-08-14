import fs from "node:fs/promises";
import path from "node:path";

export type GraphEdge = {
  source: string;
  target: string;
  kind: string;
};

/**
 * Entry point: build edges across multiple languages
 */
export async function buildUniversalEdges(rootAbs: string, files: string[]): Promise<GraphEdge[]> {
  const edges: GraphEdge[] = [];

  // JS/TS
  edges.push(...await buildJsTsEdges(rootAbs, files));

  // Python
  edges.push(...await buildPythonEdges(rootAbs, files));

  // Java
  edges.push(...await buildJavaEdges(rootAbs, files));

  // Go
  edges.push(...await buildGoEdges(rootAbs, files));

  // Rust
  edges.push(...await buildRustEdges(rootAbs, files));

  return edges;
}

/** --- Language-specific parsers --- **/

async function buildJsTsEdges(rootAbs: string, files: string[]): Promise<GraphEdge[]> {
  const edges: GraphEdge[] = [];
  const jsFiles = files.filter(f => f.endsWith(".js") || f.endsWith(".ts") || f.endsWith(".jsx") || f.endsWith(".tsx"));

  for (const f of jsFiles) {
    const raw = await fs.readFile(path.join(rootAbs, f), "utf8");
    const regex = /\b(?:import|require)\s+(?:["']([^"']+)["'])?/g;
    let m;
    while ((m = regex.exec(raw))) {
      if (m[1]) edges.push({ source: f, target: m[1], kind: "import" });
    }
  }
  return edges;
}

async function buildPythonEdges(rootAbs: string, files: string[]): Promise<GraphEdge[]> {
  const edges: GraphEdge[] = [];
  const pyFiles = files.filter(f => f.endsWith(".py"));

  for (const f of pyFiles) {
    const raw = await fs.readFile(path.join(rootAbs, f), "utf8");
    const regex = /^\s*(?:from\s+([\w\.]+)|import\s+([\w\.]+))/gm;
    let m;
    while ((m = regex.exec(raw))) {
      const target = (m[1] || m[2])?.split(".")[0];
      if (target) edges.push({ source: f, target, kind: "import" });
    }
  }
  return edges;
}

async function buildJavaEdges(rootAbs: string, files: string[]): Promise<GraphEdge[]> {
  const edges: GraphEdge[] = [];
  const javaFiles = files.filter(f => f.endsWith(".java"));

  for (const f of javaFiles) {
    const raw = await fs.readFile(path.join(rootAbs, f), "utf8");
    const regex = /^\s*import\s+([a-zA-Z0-9_.]+);/gm;
    let m;
    while ((m = regex.exec(raw))) {
      if (m[1]) edges.push({ source: f, target: m[1], kind: "import" });
    }
  }
  return edges;
}

async function buildGoEdges(rootAbs: string, files: string[]): Promise<GraphEdge[]> {
  const edges: GraphEdge[] = [];
  const goFiles = files.filter(f => f.endsWith(".go"));

  for (const f of goFiles) {
    const raw = await fs.readFile(path.join(rootAbs, f), "utf8");
    const regex = /^\s*import\s+"([^"]+)"/gm;
    let m;
    while ((m = regex.exec(raw))) {
      if (m[1]) edges.push({ source: f, target: m[1], kind: "import" });
    }
  }
  return edges;
}

async function buildRustEdges(rootAbs: string, files: string[]): Promise<GraphEdge[]> {
  const edges: GraphEdge[] = [];
  const rsFiles = files.filter(f => f.endsWith(".rs"));

  for (const f of rsFiles) {
    const raw = await fs.readFile(path.join(rootAbs, f), "utf8");
    const regex = /^\s*use\s+([\w:]+)::?/gm;
    let m;
    while ((m = regex.exec(raw))) {
      if (m[1]) edges.push({ source: f, target: m[1], kind: "use" });
    }
  }
  return edges;
}
