import { parseGithubUrl } from "../lib/parseRepo";

export type GraphNode = { id: string; path: string; type: "file" | "dir" };
export type GraphEdge = { source: string; target: string; kind: "import" | "require" | "dynamic" };
export type Analysis = {
  repoUrl: string;
  stats: { fileCount: number; edgeCount: number; durationMs: number };
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  insights: { cycles: number; orphans: number; topHubs: string[] };
};

export async function analyzeRepoMock(repoUrl: string, signal?: AbortSignal): Promise<Analysis> {
  // basic validation using existing helper
  const parsed = parseGithubUrl(repoUrl);
  if (!parsed) throw new Error("Invalid GitHub URL");

  // Simulate server latency (800–1400ms)
  const delay = 800 + Math.floor(Math.random() * 600);
  await new Promise((res, rej) => {
    const t = setTimeout(res, delay);
    signal?.addEventListener("abort", () => { clearTimeout(t); rej(new DOMException("Aborted", "AbortError")); });
  });

  // Make a tiny deterministic-ish mock graph from owner/repo
  const seed = (parsed.owner.length + parsed.name.length) % 5;
  const files = [
    "src/index.tsx",
    "src/App.tsx",
    "src/components/Graph.tsx",
    "src/components/Sidebar.tsx",
    "src/utils/resolveImports.ts",
    "src/analysis/buildGraph.ts",
  ].slice(0, 3 + seed);

  const nodes: GraphNode[] = files.map((f) => ({ id: f, path: f, type: "file" }));
  const edges: GraphEdge[] = nodes.slice(1).map((n, i) => ({
    source: nodes[i].id,
    target: n.id,
    kind: "import",
  }));

  return {
    repoUrl,
    stats: { fileCount: nodes.length, edgeCount: edges.length, durationMs: delay },
    graph: { nodes, edges },
    insights: { cycles: 0, orphans: 0, topHubs: [nodes[0].id] },
  };
}

/** Real backend call (we'll use this later) */
export async function analyzeRepoServer(repoUrl: string, signal?: AbortSignal) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoUrl }),
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Server error: ${res.status}`);
  return data;
}

