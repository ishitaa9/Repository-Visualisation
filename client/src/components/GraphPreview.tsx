import type { GraphEdge, GraphNode } from "../api/analyze";

export function GraphPreview({ nodes, edges }: { nodes: GraphNode[]; edges: GraphEdge[] }) {
  // Lay nodes on a simple circle for now
  const size = 360;
  const r = 130;
  const cx = size / 2, cy = size / 2;
  const N = nodes.length || 1;

  const positions = nodes.map((n, i) => {
    const a = (i / N) * Math.PI * 2 - Math.PI / 2;
    return { id: n.id, x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), label: n.path.split("/").pop()! };
  });

  const pos = Object.fromEntries(positions.map(p => [p.id, p]));

  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
      <svg width={size} height={size} style={{ border: "4px solid var(--ink)", borderRadius: 16, boxShadow: "6px 6px 0 0 var(--ink)", background: "white" }}>
        {/* edges */}
        {edges.map((e, idx) => (
          <line key={idx}
            x1={pos[e.source].x} y1={pos[e.source].y}
            x2={pos[e.target].x} y2={pos[e.target].y}
            stroke="black" strokeWidth={2} />
        ))}
        {/* nodes */}
        {positions.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r={12} fill="var(--c-2)" stroke="black" strokeWidth={3} />
            <text x={p.x} y={p.y - 16} textAnchor="middle" fontWeight={800} fontSize={12} fill="#0f1719">
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="stats-card">
        <div className="stat"><span>Files</span><strong>{nodes.length}</strong></div>
        <div className="stat"><span>Edges</span><strong>{edges.length}</strong></div>
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
