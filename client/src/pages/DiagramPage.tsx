import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { parseGithubUrl } from "../lib/parseRepo";
import { analyzeRepoServer as analyzeRepo } from "../api/analyze";
import type { Analysis } from "../api/analyze";
import { makeDirectoryTreeText } from "../lib/makeTree";
import { PanelShell, CodeBlock, CopyButton } from "../components/InfoPanels";
import GraphView from "../components/GraphView";

export default function DiagramPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const repoUrl = params.get("repo") ?? "";
  const parsed = useMemo(() => parseGithubUrl(repoUrl), [repoUrl]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Analysis | null>(null);

  useEffect(() => {
    if (!repoUrl || !parsed) {
      navigate(`/?repo=${encodeURIComponent(repoUrl)}`, { replace: true });
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    setData(null);

    analyzeRepo(repoUrl, ctrl.signal)
      .then(setData)
      .catch((e: any) => {
        if (e?.name !== "AbortError") setError(e?.message || "Unknown error");
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [repoUrl, parsed, navigate]);

  if (!parsed) return null;

  const repoSlug = `${parsed.owner}/${parsed.name}`;
  const filePaths = data?.graph.nodes.map((n) => n.path) ?? [];
  const treeText = `Directory structure:\n${makeDirectoryTreeText(filePaths, repoSlug)}`;

  return (
    <section className="container" style={{ padding: "32px 0 40px" }}>
      {/* Top row: two columns */}
      <div className="dashboard-top">
        <PanelShell
          title="Directory Structure"
          rightAction={
            !loading && !error ? <CopyButton label="Copy" getText={() => treeText} /> : null
          }
        >
          {loading ? (
            <div className="skeleton-box tall" />
          ) : error ? (
            <div className="error">⚠️ {error}</div>
          ) : (
            <CodeBlock
              text={treeText}
              ariaLabel="Directory structure"
              scrollable
              maxHeight={250}
            />
          )}
        </PanelShell>

        <PanelShell title="Repo Info (placeholder)">
          <p style={{ fontSize: "0.9rem" }}>
            This space can show repository metadata, stats, or insights later.
          </p>
        </PanelShell>
      </div>

      {/* Bottom row: full-width */}
      <div className="dashboard-bottom">
        <PanelShell title="Graph Visualization">
          {loading ? (
            <div className="skeleton-box tall" />
          ) : error ? (
            <div className="error">⚠️ {error}</div>
          ) : (
            <GraphView
              nodes={data?.graph?.nodes ?? []}
              edges={data?.graph?.edges ?? []}
              height={460}
            />
          )}
        </PanelShell>
      </div>

      <div style={{ marginTop: 18 }}>
        <Link to={`/?repo=${encodeURIComponent(repoUrl)}`}>← Edit repository URL</Link>
      </div>
    </section>
  );
}
