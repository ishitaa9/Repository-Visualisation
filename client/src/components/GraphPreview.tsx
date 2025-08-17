import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { GraphEdge, GraphNode } from "../api/analyze";

export function GraphPreview({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  const { t } = useTranslation();

  // Lay nodes on a simple circle
  const size = 360;
  const r = 130;
  const cx = size / 2, cy = size / 2;
  const N = nodes.length || 1;

  const positions = useMemo(() => {
    return nodes.map((n, i) => {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      return {
        id: n.id,
        x: cx + r * Math.cos(a),
        y: cy + r * Math.sin(a),
        label: n.path.split("/").pop() || n.id
      };
    });
  }, [nodes, N, cx, r]);

  const pos = useMemo(() => Object.fromEntries(positions.map(p => [p.id, p])), [positions]);

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      <svg
        width={size}
        height={size}
        style={{
          border: "4px solid var(--ink)",
          borderRadius: 16,
          boxShadow: "6px 6px 0 0 var(--ink)",
          background: "white"
        }}
        role="img"
        aria-label={t("graphPreview.ariaDiagram")}
      >
        {/* edges (skip any edge that points to a missing node just in case) */}
        {edges.map((e, idx) => {
          const s = pos[e.source];
          const tpos = pos[e.target];
          if (!s || !tpos) return null;
          return (
            <line
              key={idx}
              x1={s.x}
              y1={s.y}
              x2={tpos.x}
              y2={tpos.y}
              stroke="black"
              strokeWidth={2}
            />
          );
        })}

        {/* nodes */}
        {positions.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r={12} fill="var(--c-2)" stroke="black" strokeWidth={3} />
            <text
              x={p.x}
              y={p.y - 16}
              textAnchor="middle"
              fontWeight={800}
              fontSize={12}
              fill="#0f1719"
            >
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="stats-card" aria-label={t("graphPreview.ariaStats")}>
        <div className="stat">
          <span>{t("graphPreview.files")}</span>
          <strong>{nodes.length}</strong>
        </div>
        <div className="stat">
          <span>{t("graphPreview.edges")}</span>
          <strong>{edges.length}</strong>
        </div>
      </div>
    </div>
  );
}

export function GraphSkeleton() {
  return (
    <div className="skeleton-wrap">
      <div className="skeleton-box" />
      <div className="skeleton-stats">
        <div className="skeleton-pill" />
        <div className="skeleton-pill" />
      </div>
    </div>
  );
}
