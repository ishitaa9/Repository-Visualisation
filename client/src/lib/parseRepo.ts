export type RepoRef = { owner: string; name: string; branch?: string };

export function parseGithubUrl(input: string): RepoRef | null {
  try {
    const u = new URL(input.trim());
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.replace(/^\/+/, "").split("/");
    const [owner, name, kind, maybeBranch] = parts;
    if (!owner || !name) return null;
    const ref = kind === "tree" && maybeBranch ? { branch: decodeURIComponent(maybeBranch) } : {};
    return { owner, name, ...ref };
  } catch {
    return null;
  }
}
