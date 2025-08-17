import express from "express";
import cors from "cors";
import { z } from "zod";
import { analyzeRepo } from "./analysis/analyze";
import { detectLanguage } from "./analysis/universalGraph";

const app = express();
app.use(cors());
app.use(express.json());

const AnalyzeReq = z.object({
  repoUrl: z.string().url(),
  ref: z.string().optional(),
});

function parseGithubUrl(input: string): { owner: string; name: string; ref?: string } {
  const u = new URL(input.trim());
  if (u.hostname !== "github.com") throw new Error("Only github.com URLs are supported");
  const [owner, name, kind, maybeBranch] = u.pathname.replace(/^\/+/, "").split("/");
  if (!owner || !name) throw new Error("Invalid GitHub URL");
  return { owner, name, ref: kind === "tree" ? maybeBranch : undefined };
}

app.get("/api/health", (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

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
        durationMs: 0,
      },
      graph: {
        nodes: result.files.map((f) => ({
          id: f,
          path: f,
          type: "file" as const,
          lang: detectLanguage(f),
        })),
        edges: result.edges,
      },
      insights: { cycles: 0, orphans: 0, topHubs: [] }, // TODO: compute later
      analytics: {
        license: result.license,
        depsTotal: result.depsTotal,
        depsOutdated: result.depsOutdated,
        outdatedList: result.outdatedList,
        testFiles: result.testFiles,
        testFrameworks: result.testFrameworks,
      },
    });
  } catch (e: any) {
    console.error("[/api/analyze] failed:", e?.message ?? e);
    res.status(500).json({ error: String(e?.message ?? e) });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));
