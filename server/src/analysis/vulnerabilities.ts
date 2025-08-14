// backend/src/analysis/vulnerabilities.ts
import { fetch } from "undici";

export type VulnCounts = { critical: number; high: number; medium: number };

export async function analyzeVulnerabilities(deps: Record<string, string>): Promise<VulnCounts> {
  const entries = Object.entries(deps)
    .map(([name, v]) => [name, sanitizeSemver(v)] as const)
    .filter(([, v]) => Boolean(v));

  if (!entries.length) return { critical: 0, high: 0, medium: 0 };

  const queries = entries.map(([name, version]) => ({
    package: { ecosystem: "npm", name },
    version: version!,
  }));

  const results: any[] = [];
  const BATCH = 100;
  for (let i = 0; i < queries.length; i += BATCH) {
    const chunk = queries.slice(i, i + BATCH);
    try {
      const res = await fetch("https://api.osv.dev/v1/querybatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ queries: chunk }),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (Array.isArray(data?.results)) results.push(...data.results);
    } catch {
      // ignore this chunk
    }
  }

  const seen = new Set<string>();
  const counts: VulnCounts = { critical: 0, high: 0, medium: 0 };

  for (const r of results) {
    for (const v of r?.vulns ?? []) {
      const id: string = v.id || v.database_specific?.id || JSON.stringify(v);
      if (seen.has(id)) continue;
      seen.add(id);

      let cvss: number | null = null;
      for (const s of v.severity ?? []) {
        if (s?.type?.toUpperCase?.() === "CVSS_V3") {
          const n = Number(s.score);
          if (!Number.isNaN(n)) { cvss = n; break; }
        }
      }
      if (cvss != null) {
        if (cvss >= 9.0) counts.critical++;
        else if (cvss >= 7.0) counts.high++;
        else if (cvss >= 4.0) counts.medium++;
        continue;
      }

      const label = (v.severity ?? []).map((s: any) => String(s?.type ?? s?.score ?? "")).join(" ").toUpperCase();
      if (label.includes("CRITICAL")) counts.critical++;
      else if (label.includes("HIGH")) counts.high++;
      else if (label.includes("MEDIUM")) counts.medium++;
    }
  }

  return counts;
}

function sanitizeSemver(v: string): string | null {
  if (!v) return null;
  if (/^(git|ssh|https?:|workspace:|file:)/i.test(v)) return null;
  const m = v.match(/(\d+)\.(\d+)\.(\d+)/);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : null;
}
