import CytoscapeComponent from "react-cytoscapejs";
import cytoscape from "cytoscape";
import fcose from "cytoscape-fcose";
import popper from "cytoscape-popper";
import { createPopper } from "@popperjs/core";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import "tippy.js/dist/tippy.css";
import { useState, useRef, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";

cytoscape.use(fcose);
cytoscape.use(popper(createPopper));

type Node = { id: string; path: string; type: string };
type Edge = { source: string; target: string; kind: "import" | "require" | "dynamic" };

type ExtendedLayoutOptions = cytoscape.LayoutOptions & {
  animate?: boolean;
  padding?: number;
  nodeRepulsion?: number;
  idealEdgeLength?: number;
  edgeElasticity?: number;
  startAngle?: number;
  directed?: boolean;
  spacingFactor?: number;
};

const LAYOUTS = [
  { name: "fcose", label: "fCoSE" },
  { name: "cose", label: "COSE (force)" },
  { name: "concentric", label: "Concentric" },
  { name: "breadthfirst", label: "Breadth-first" }
] as const;

const CODE_EXTS = [".ts", ".tsx", ".js", ".jsx"];
const LABEL_ZOOM = 0.7;

export default function GraphView({
  nodes,
  edges,
  height = 460,
}: {
  nodes: Node[];
  edges: Edge[];
  height?: number;
}) {
  const { t } = useTranslation();
  const [layoutName, setLayoutName] = useState<(typeof LAYOUTS)[number]["name"]>("fcose");
  const [onlyConnected, setOnlyConnected] = useState(true);
  const [hideAssets, setHideAssets] = useState(true);
  const [query, setQuery] = useState("");

  const cyRef = useRef<cytoscape.Core | null>(null);
  const tippiesRef = useRef<Map<string, TippyInstance>>(new Map());

  // compute degree (used for node size)
  const degree = useMemo(() => {
    const d = new Map<string, number>();
    edges.forEach((e) => {
      d.set(e.source, (d.get(e.source) ?? 0) + 1);
      d.set(e.target, (d.get(e.target) ?? 0) + 1);
    });
    return d;
  }, [edges]);

  // color based on extension
  function colorFor(path: string) {
    if (path.endsWith(".tsx")) return "#57cc99";
    if (path.endsWith(".ts"))  return "#38a3a5";
    if (path.endsWith(".jsx")) return "#80ed99";
    if (path.endsWith(".js"))  return "#22577a";
    return "#c7f9cc";
  }

  const isAsset = (p: string) =>
    /\.(png|jpg|jpeg|svg|gif|ico|json|md|html|css|scss|txt|lock|map)$/i.test(p);

  const nodeIds = useMemo(() => new Set(nodes.map((n) => n.id)), [nodes]);

  // build Cytoscape elements
  const elements = useMemo(() => {
    const nodeElems = nodes.map((n) => {
      const deg = degree.get(n.id) ?? 0;
      const size = Math.min(64, Math.max(12, 12 + Math.sqrt(deg) * 6));
      const ext = n.path.slice(n.path.lastIndexOf("."));
      const isCode = CODE_EXTS.includes(ext as any);
      return {
        data: {
          id: n.id,
          label: basename(n.path),
          full: n.path,
          color: colorFor(n.path),
          size,
          isCode: isCode ? "1" : "0",
          isAsset: isAsset(n.path) ? "1" : "0",
          deg
        }
      };
    });

    const edgeElems = edges
      .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
      .map((e) => ({ data: { source: e.source, target: e.target, kind: e.kind } }));

    return [...nodeElems, ...edgeElems];
  }, [nodes, edges, degree, nodeIds]);

  // run layout when nodes/edges change
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    runLayout(cy, layoutName);
  }, [elements, layoutName]);

  // zoom labels + filtering
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const applyZoomLabels = () => {
      const show = cy.zoom() >= LABEL_ZOOM;
      cy.nodes().toggleClass("label-on", show);
    };
    applyZoomLabels();
    cy.on("zoom", applyZoomLabels);

    const onNodeTap = (evt: cytoscape.EventObject) => {
      const n = evt.target;
      const neighborhood = n.closedNeighborhood();
      cy.elements().removeClass("faded");
      cy.elements().difference(neighborhood).addClass("faded");
    };
    const onBgTap = (evt: cytoscape.EventObject) => {
      if (evt.target === cy) cy.elements().removeClass("faded");
    };
    cy.on("tap", "node", onNodeTap);
    cy.on("tap", onBgTap);

    const applyFilters = () => {
      cy.nodes().forEach((n) => {
        const deg = n.data("deg") ?? 0;
        if (deg === 0) n.addClass("orphan"); else n.removeClass("orphan");

        const asset = n.data("isAsset") === "1";
        n.toggleClass("hidden", (hideAssets && asset) || (onlyConnected && n.hasClass("orphan")));
      });
      cy.elements().removeClass("faded");
      setTimeout(() => cy.fit(undefined, 40), 60);
    };
    applyFilters();

    return () => {
      cy.off("zoom", applyZoomLabels);
      cy.off("tap", "node", onNodeTap);
      cy.off("tap", onBgTap);
    };
  }, [elements, onlyConnected, hideAssets]);

  // tooltips
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    tippiesRef.current.forEach((t) => t.destroy());
    tippiesRef.current.clear();

    cy.nodes().forEach((n) => {
      const ref = (n as any).popperRef();
      const content = document.createElement("div");
      const indeg = n.indegree(false);
      const outdeg = n.outdegree(false);
      content.innerHTML = `
        <div style="font-weight:800;margin-bottom:4px">${n.data("label")}</div>
        <div style="font-size:12px;color:#223"><code>${n.data("full")}</code></div>
        <div style="font-size:12px; margin-top:6px">in: ${indeg} &nbsp; out: ${outdeg}</div>
      `;
      const tip = tippy(document.createElement("div"), {
        getReferenceClientRect: () => ref.getBoundingClientRect(),
        content,
        trigger: "manual",
        placement: "top",
        hideOnClick: true,
        theme: "light-border",
      });
      tippiesRef.current.set(n.id(), tip);

      n.on("mouseover", () => tip.show());
      n.on("mouseout", () => tip.hide());
      n.on("position", () => tip.popperInstance?.update());
      cy.on("zoom pan", () => tip.popperInstance?.update());
    });

    return () => {
      tippiesRef.current.forEach((t) => t.destroy());
      tippiesRef.current.clear();
    };
  }, [elements]);

  // search
  const onSearch = () => {
    const cy = cyRef.current; if (!cy) return;
    const q = query.trim().toLowerCase();
    cy.elements().removeClass("matched");
    if (!q) { cy.fit(undefined, 40); return; }
    const matches = cy.nodes().filter((n) =>
      n.data("full").toLowerCase().includes(q) || n.data("label").toLowerCase().includes(q)
    );
    matches.addClass("matched");
    if (matches.nonempty()) cy.fit(matches, 80);
  };

  return (
    <div className="graph-card">
      <div className="graph-toolbar">
        <div className="graph-left">
          <strong>{t("graph.layout")}:</strong>
          <select
            className="graph-select"
            value={layoutName}
            onChange={(e) => setLayoutName(e.target.value as any)}
          >
            {LAYOUTS.map((l) => (
              <option key={l.name} value={l.name}>{l.label}</option>
            ))}
          </select>
          <label className="graph-check">
            <input
              type="checkbox"
              checked={onlyConnected}
              onChange={(e) => setOnlyConnected(e.target.checked)}
            />
            {t("graph.showOnlyConnected")}
          </label>
          <label className="graph-check">
            <input
              type="checkbox"
              checked={hideAssets}
              onChange={(e) => setHideAssets(e.target.checked)}
            />
            {t("graph.hideAssets")}
          </label>
        </div>
        <div className="graph-right">
          <input
            className="graph-search"
            placeholder={t("graph.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
          />
          <button className="btn-neo small" onClick={onSearch}>{t("graph.find")}</button>
          <button className="btn-neo small" onClick={() => cyRef.current?.fit(undefined, 30)}>
            {t("graph.fit")}
          </button>
          <button
            className="btn-neo small"
            onClick={() => {
              const cy = cyRef.current; if (!cy) return;
              const url = cy.png({ full: true, scale: 2, bg: "#ffffff" });
              const a = document.createElement("a");
              a.href = url;
              a.download = "graph.png";
              a.click();
            }}
          >
            {t("graph.exportPng")}
          </button>
        </div>
      </div>

      <div className="graph-legend">
        <span><span className="legend-box" style={{ background: "#57cc99" }}></span> {t("graph.ext.tsx")}</span>
        <span><span className="legend-box" style={{ background: "#38a3a5" }}></span> {t("graph.ext.ts")}</span>
        <span><span className="legend-box" style={{ background: "#80ed99" }}></span> {t("graph.ext.jsx")}</span>
        <span><span className="legend-box" style={{ background: "#22577a" }}></span> {t("graph.ext.js")}</span>
        <span><span className="legend-box" style={{ background: "#c7f9cc" }}></span> {t("graph.ext.other")}</span>
      </div>

      <div
        style={{
          height,
          width: "100%",
          border: "4px solid var(--ink)",
          borderRadius: 16,
          boxShadow: "8px 8px 0 0 var(--ink)",
          background: "#fff",
        }}
      >
        <CytoscapeComponent
          cy={(cy) => (cyRef.current = cy)}
          elements={elements as any}
          style={{ width: "100%", height: "100%" }}
          layout={{ name: layoutName, animate: false }}
          minZoom={0.1}
          maxZoom={3}
          wheelSensitivity={0.25}
          stylesheet={[
            {
              selector: "node",
              style: {
                label: "",
                "background-color": "data(color)",
                "border-width": 3,
                "border-color": "#0f1b22",
                width: "data(size)",
                height: "data(size)",
              }
            },
            {
              selector: "node.label-on, node:selected, node:hover, node.matched",
              style: {
                label: "data(label)",
                "font-size": 9,
                "text-wrap": "wrap",
                "text-max-width": 90,
                "text-valign": "top",
                "text-margin-y": -6,
                "text-outline-width": 2,
                "text-outline-color": "#ffffff",
                "text-background-color": "#ffffff",
                "text-background-opacity": 0.85,
                "text-background-padding": 2,
                "text-background-shape": "roundrectangle",
              }
            },
            {
              selector: "edge",
              style: {
                width: 1.6,
                "line-color": "rgba(15,27,34,0.6)",
                "target-arrow-shape": "triangle",
                "target-arrow-color": "rgba(15,27,34,0.6)",
                "curve-style": "unbundled-bezier",
                "control-point-step-size": 20
              }
            },
            { selector: "edge[kind = 'dynamic']", style: { "line-style": "dashed", "line-color": "rgba(255,111,0,0.6)", "target-arrow-color": "rgba(255,111,0,0.6)" } },
            { selector: "edge[kind = 'require']", style: { "line-color": "rgba(34,34,34,0.6)", "target-arrow-color": "rgba(34,34,34,0.6)" } },
            { selector: ".faded", style: { opacity: 0.15 } },
            { selector: ".matched", style: { "border-width": 5, "border-color": "#ff6f00" } },
            { selector: ".hidden", style: { display: "none" } },
          ]}
        />
      </div>
    </div>
  );
}

function basename(p: string) {
  const idx = p.lastIndexOf("/");
  return idx >= 0 ? p.slice(idx + 1) : p;
}

function runLayout(cy: cytoscape.Core, name: string) {
  const opts: ExtendedLayoutOptions =
    name === "fcose"
      ? { name: "fcose", animate: false, padding: 30, nodeRepulsion: 6500, idealEdgeLength: 110, edgeElasticity: 0.2 }
      : name === "concentric"
      ? { name, animate: false, padding: 30, startAngle: (3 * Math.PI) / 2 }
      : name === "breadthfirst"
      ? { name, animate: false, padding: 30, directed: true, spacingFactor: 1.15 }
      : { name: "cose", animate: false, padding: 30, nodeRepulsion: 9000 };
  cy.layout(opts).run();
  setTimeout(() => cy.fit(undefined, 30), 60);
}
