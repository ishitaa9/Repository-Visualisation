import { Beaker, Scale, Package } from "lucide-react";
import { useTranslation } from "react-i18next";

type OutdatedDep = {
  name: string;
  current: string;
  latest: string;
  isOutdated: boolean;
};

type Props = {
  loading?: boolean;
  error?: string | null;

  // Basics
  license?: string | null;

  // Dependencies
  depsTotal?: number | null;
  depsOutdated?: number | null;
  outdatedList?: OutdatedDep[];

  // Tests
  testFiles?: number | null;
  testFrameworks?: string[]; // optional; pass from backend if available
};

export default function RepoAnalyticsCard({
  loading,
  error,
  license = "—",
  depsTotal = 0,
  depsOutdated = 0,
  outdatedList = [],
  testFiles = 0,
  testFrameworks = [],
}: Props) {
  const { t } = useTranslation();
  if (loading) return <div className="skeleton-box tall" />;
  if (error) return <div className="error">⚠️ {error}</div>;

  const hasFrameworks = Array.isArray(testFrameworks) && testFrameworks.length > 0;
  const hasOutdated = Array.isArray(outdatedList) && outdatedList.length > 0;

  return (
    <div className="analytics-grid">
      <section className="analytics-section">
        <ul className="analytics-list">
          <li>
            <Beaker size={14} style={{ marginRight: 4 }} aria-hidden />
            <strong>{t("tests")}:</strong> {testFiles ?? 0} file{(testFiles ?? 0) === 1 ? "" : "s"}
            {hasFrameworks && (
              <>
                {" "}
                · <strong>{t("framework")}:</strong> {testFrameworks.join(", ")}
              </>
            )}
          </li>

          <li>
            <Scale size={14} style={{ marginRight: 4 }} aria-hidden />
            <strong>{t("license")}:</strong> {license || "Missing"}
          </li>

          <li>
            <Package size={14} style={{ marginRight: 4 }} aria-hidden />
            <strong>{t("dependencies")}:</strong> {depsTotal ?? 0}{" "}
            {typeof depsOutdated === "number" && (
              <>
                (
                <span className={depsOutdated ? "warn" : "ok"}>
                  {depsOutdated} outdated
                </span>
                )
              </>
            )}
          </li>
        </ul>

        {hasOutdated && (
          <details style={{ marginTop: "0.5rem" }}>
            <summary>{t("outdatedDeps")}</summary>
            <ul style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
              {outdatedList.slice(0, 5).map((dep) => (
                <li key={dep.name}>
                  {dep.name} — <span className="warn">{dep.current || "?"}</span> →{" "}
                  <span className="ok">{dep.latest || "?"}</span>
                </li>
              ))}
              {outdatedList.length > 5 && (
                <li>…and {outdatedList.length - 5} more</li>
              )}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}
