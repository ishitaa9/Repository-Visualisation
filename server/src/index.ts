import express from "express";
import cors from "cors";
import { z } from "zod";
import { analyzeRepo } from "./analysis/analyze";

const app = express();
app.use(cors());
app.use(express.json());

const AnalyzeReq = z.object({
  repoUrl: z.string().url(),
  ref: z.string().optional(),
});

app.get("/api/health", (_req, res) =>
  res.json({ ok: true, ts: new Date().toISOString() })
);

app.post("/api/analyze", async (req, res) => {
  const parsed = AnalyzeReq.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  try {
    const { owner, name, ref } = parseGithubUrl(parsed.data.repoUrl);
    const result = await analyzeRepo({ owner, name, ref });

    res.json({
      repoUrl: result.repoUrl,
      commit: result.commitSha,
      stats: {
        fileCount: result.files.length,
        edgeCount: result.edges.length,
        durationMs: 0, // TODO: measure with performance.now()
      },
      graph: {
        nodes: result.files.map(f => ({ id: f, path: f, type: "file" as const })),
        edges: result.edges,
      },
      insights: { cycles: 0, orphans: 0, topHubs: [] },
      analytics: {
        depsTotal: result.depsTotal,
        depsOutdated: result.depsOutdated,
        outdatedList: result.outdatedList,
        vulnsCritical: result.vulns.critical,
        vulnsHigh: result.vulns.high,
        vulnsMedium: result.vulns.medium,
      },
    });
  } catch (e: any) {
    console.error("[/api/analyze] failed:", e?.message ?? e);
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));

function parseGithubUrl(input: string): { owner: string; name: string; ref?: string } {
  const u = new URL(input.trim());
  if (u.hostname !== "github.com") throw new Error("Only github.com URLs are supported");

  const [owner, name, kind, maybeBranch] = u.pathname.replace(/^\/+/, "").split("/");
  if (!owner || !name) throw new Error("Invalid GitHub URL");

  return { owner, name, ref: kind === "tree" ? maybeBranch : undefined };
}
