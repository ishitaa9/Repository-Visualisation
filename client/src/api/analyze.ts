import { parseGithubUrl } from "../lib/parseRepo";

export type OutdatedDep = {
  name: string;
  current: string;
  latest: string;
  isOutdated: boolean;
};
export type GraphNode = {
  id: string;
  path: string;
  type: "file" | "dir";
  lang?: string; // ⬅️ new
};

export type GraphEdge = {
  source: string;
  target: string;
  kind: "import" | "require" | "dynamic"
};

export type Analysis = {
  repoUrl: string;
  stats: { fileCount: number; edgeCount: number; durationMs: number };
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  insights: { cycles: number; orphans: number; topHubs: string[] };
  commit: string;
  analytics: {
    license: string | null;
    depsTotal: number;
    depsOutdated: number;
    outdatedList: OutdatedDep[];
    testFiles: number;
    testFrameworks: string[];
  };
};

export async function analyzeRepoMock(repoUrl: string, signal?: AbortSignal): Promise<Analysis> {
  const parsed = parseGithubUrl(repoUrl);
  if (!parsed) throw new Error("Invalid GitHub URL");

  // Simulate latency (800–1400ms)
  const delay = 800 + Math.floor(Math.random() * 600);
  await new Promise((res, rej) => {
    const t = setTimeout(res, delay);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      rej(new DOMException("Aborted", "AbortError"));
    });
  });

  // Make a small deterministic-ish mock graph
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
    commit: "mock-commit",
    analytics: {
      license: "MIT",
      depsTotal: 12 + seed,
      depsOutdated: Math.max(0, (seed % 3) - 1),
      outdatedList: [
        { name: "react", current: "18.2.0", latest: "18.3.1", isOutdated: true },
        { name: "typescript", current: "5.3.3", latest: "5.5.4", isOutdated: true },
      ].slice(0, Math.max(0, (seed % 3) - 1)),
      testFiles: 1 + seed,
      testFrameworks: seed % 2 ? ["vitest"] : ["jest"],
    },
  };
}

/** Real backend call */
export async function analyzeRepoServer(repoUrl: string, signal?: AbortSignal): Promise<Analysis> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repoUrl }),
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || `Server error: ${res.status}`);
  return data as Analysis;
}
