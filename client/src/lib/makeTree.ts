// Turn ["src/App.tsx","public/index.html"] into a printable ASCII tree.
export function makeDirectoryTreeText(paths: string[], rootLabel: string): string {
  // Normalize & sort (folders before files at each level)
  const norm = paths
    .map(p => p.replace(/^\/+/, "").replace(/\/+/g, "/"))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  type Node = { name: string; children?: Map<string, Node>; isFile?: boolean };
  const root: Node = { name: rootLabel, children: new Map() };

  for (const p of norm) {
    const parts = p.split("/");
    let cur = root;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1 && !p.endsWith("/");
      if (!cur.children) cur.children = new Map();

      if (!cur.children.has(part)) {
        cur.children.set(part, { name: part, isFile });
      }
      const next = cur.children.get(part)!;
      if (isFile) next.isFile = true;
      cur = next;
    }
  }

  function render(node: Node, prefix = "", isLast = true): string[] {
    const line =
      prefix === ""
        ? `└─ ${node.name}/`
        : `${prefix}${isLast ? "└─" : "├─"} ${node.name}${node.isFile ? "" : "/"}`;

    if (!node.children || node.children.size === 0) return [line];

    // folders first, then files
    const entries = Array.from(node.children.values()).sort((a, b) => {
      const af = a.isFile ? 1 : 0;
      const bf = b.isFile ? 1 : 0;
      if (af !== bf) return af - bf;
      return a.name.localeCompare(b.name);
    });

    const out = [line];
    entries.forEach((child, idx) => {
      const last = idx === entries.length - 1;
      const childPrefix = prefix === "" ? "   " : `${prefix}${isLast ? "   " : "│  "}`;
      out.push(...render(child, childPrefix, last));
    });
    return out;
  }

  return render(root).join("\n");
}
