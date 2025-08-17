import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { parseGithubUrl } from "../lib/parseRepo";
import { analyzeRepoServer as analyzeRepo } from "../api/analyze";
import type { Analysis } from "../api/analyze";
import { makeDirectoryTreeText } from "../lib/makeTree";
import { PanelShell, CodeBlock, CopyButton } from "../components/InfoPanels";
import GraphView from "../components/GraphView";
import RepoAnalyticsCard from "../components/RepoAnalyticsCard";
import { useTranslation } from "react-i18next";

export default function DiagramPage() {
  const { t } = useTranslation();
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
      .then((result) => {
        console.log("✅ Backend analytics:", result.analytics);
        setData(result);
      })
      .catch((e: any) => {
        if (e?.name !== "AbortError") setError(e?.message || t("errors.unknown"));
      })
      .finally(() => setLoading(false));

    return () => ctrl.abort();
  }, [repoUrl, parsed, navigate, t]);

  if (!parsed) return null;

  const repoSlug = `${parsed.owner}/${parsed.name}`;
  const filePaths = data?.graph.nodes.map((n) => n.path) ?? [];
  const treeText = `${t("diagramPage.directoryStructure")}:\n${makeDirectoryTreeText(filePaths, repoSlug)}`;

  return (
    <section className="container" style={{ padding: "32px 0 40px" }}>
      {/* Top row: two columns */}
      <div className="dashboard-top">
        <PanelShell
          title={t("diagramPage.directoryStructure")}
          rightAction={
            !loading && !error ? (
              <CopyButton label={t("actions.copy")} getText={() => treeText} />
            ) : null
          }
        >
          {loading ? (
            <div className="skeleton-box tall" />
          ) : error ? (
            <div className="error">⚠️ {error}</div>
          ) : (
            <CodeBlock
              text={treeText}
              ariaLabel={t("diagramPage.directoryStructure")}
              scrollable
              maxHeight={250}
            />
          )}
        </PanelShell>

        <PanelShell title={t("diagramPage.repositoryAnalytics")}>
          <RepoAnalyticsCard loading={loading} error={error} {...(data?.analytics ?? {})} />
        </PanelShell>
      </div>

      {/* Bottom row: full-width */}
      <div className="dashboard-bottom">
        <PanelShell title={t("diagramPage.graphVisualization")}>
          {loading ? (
            <div className="skeleton-box tall" />
          ) : error ? (
            <div className="error">⚠️ {error}</div>
          ) : (
            <GraphView nodes={data?.graph?.nodes ?? []} edges={data?.graph?.edges ?? []} height={460} />
          )}
        </PanelShell>
      </div>

      <div style={{ marginTop: 18 }}>
        <Link to={`/?repo=${encodeURIComponent(repoUrl)}`}>← {t("diagramPage.editUrl")}</Link>
      </div>
    </section>
  );
}
