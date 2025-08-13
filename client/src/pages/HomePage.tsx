import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import HomeHero from "../components/Hero";
import { parseGithubUrl } from "../lib/parseRepo";

export default function HomePage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  // Read initial value from URL (?repo=)
  const initial = params.get("repo") ?? "";
  const [repoUrl, setRepoUrl] = useState(initial);

  // Keep URL in sync as the user types (no nav yet)
  useEffect(() => {
    const current = params.get("repo") ?? "";
    if (repoUrl !== current) {
      const next = new URLSearchParams(params);
      if (repoUrl) next.set("repo", repoUrl); else next.delete("repo");
      // Replace history entry so typing doesn’t spam back-stack
      window.history.replaceState(null, "", `/?${next.toString()}`);
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoUrl]);

  const isValid = useMemo(() => !!parseGithubUrl(repoUrl), [repoUrl]);

  const onSubmit = () => {
    if (!isValid) return;
    navigate(`/diagram?repo=${encodeURIComponent(repoUrl)}`);
  };

  const onPickExample = (url: string) => {
    setRepoUrl(url);
    navigate(`/diagram?repo=${encodeURIComponent(url)}`);
  };

  return (
    <main className="hero-wrap">
      <div className="container">
        <HomeHero
          repoUrl={repoUrl}
          setRepoUrl={setRepoUrl}
          isValid={isValid}
          onSubmit={onSubmit}
          onPickExample={onPickExample}
        />
      </div>
    </main>
  );
}
