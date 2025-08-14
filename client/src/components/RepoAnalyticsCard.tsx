import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Beaker,
  Scale,
  Package,
} from "lucide-react";

type OutdatedDep = {
  name: string;
  current: string;
  latest: string;
  isOutdated: boolean;
};

type Props = {
  loading?: boolean;
  error?: string | null;
  license?: string | null;
  depsTotal?: number | null;
  depsOutdated?: number | null;
  outdatedList?: OutdatedDep[];
  contributors?: number | null;
  busFactor?: number | null;
  hasSecurityPolicy?: boolean | null;
  testFiles?: number | null;
  vulnsCritical?: number | null;
  vulnsHigh?: number | null;
  vulnsMedium?: number | null;
};

export default function RepoAnalyticsCard({
  loading,
  error,
  license = "—",
  depsTotal = 0,
  depsOutdated = 0,
  outdatedList = [],
  contributors = 0,
  busFactor = 0,
  hasSecurityPolicy = false,
  testFiles = 0,
  vulnsCritical = 0,
  vulnsHigh = 0,
  vulnsMedium = 0,
}: Props) {
  if (loading) return <div className="skeleton-box tall" />;
  if (error) return <div className="error">⚠️ {error}</div>;

  return (
    <div className="analytics-grid">
      {/* License & Dependencies */}
      <section className="analytics-section">
        <div className="analytics-title">
          <Scale size={16} /> License & Dependencies
        </div>
        <ul className="analytics-list">
          <li>
            <strong>License:</strong> {license || "Missing"}
          </li>
          <li>
            <strong>Dependencies:</strong> {depsTotal}{" "}
            {typeof depsOutdated === "number" && (
              <>
                (<span className={depsOutdated ? "warn" : "ok"}>
                  {depsOutdated} outdated
                </span>)
              </>
            )}
          </li>
        </ul>

        {/* Show outdated list if available */}
        {outdatedList.length > 0 && (
          <details style={{ marginTop: "0.5rem" }}>
            <summary>
              <Package size={14} style={{ marginRight: 4 }} />
              Outdated dependencies
            </summary>
            <ul style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
              {outdatedList.slice(0, 5).map(dep => (
                <li key={dep.name}>
                  {dep.name} — <span className="warn">{dep.current}</span>{" "}
                  → <span className="ok">{dep.latest}</span>
                </li>
              ))}
              {outdatedList.length > 5 && (
                <li>…and {outdatedList.length - 5} more</li>
              )}
            </ul>
          </details>
        )}
      </section>

      {/* Contributors */}
      <section className="analytics-section">
        <div className="analytics-title">
          <Users size={16} /> Contributors
        </div>
        <ul className="analytics-list">
          <li>
            <strong>Active contributors:</strong> {contributors}
          </li>
          <li>
            <strong>Bus factor:</strong> {busFactor}
          </li>
        </ul>
      </section>

      {/* Security & Quality */}
      <section className="analytics-section">
        <div className="analytics-title">
          <ShieldCheck size={16} /> Security & Quality
        </div>
        <ul className="analytics-list">
          <li>
            <strong>Security policy:</strong>{" "}
            {hasSecurityPolicy ? "Present" : "Missing"}
          </li>
          <li>
            <Beaker size={14} style={{ marginRight: 4 }} />
            <strong>Tests:</strong> {testFiles} files
          </li>
          <li>
            <ShieldAlert size={14} style={{ marginRight: 4 }} />
            <strong>Vulnerabilities:</strong>{" "}
            <span className={vulnsCritical ? "warn" : "ok"}>
              {vulnsCritical} critical
            </span>
            ,{" "}
            <span className={vulnsHigh ? "warn" : "ok"}>
              {vulnsHigh} high
            </span>
            ,{" "}
            <span className={vulnsMedium ? "warn" : "ok"}>
              {vulnsMedium} medium
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
