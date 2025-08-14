import { useMemo } from "react";

type Props = {
  repoUrl: string;
  setRepoUrl: (v: string) => void;
  isValid: boolean;
  onSubmit: () => void;
  onPickExample: (url: string) => void;
};

export default function Hero({ repoUrl, setRepoUrl, isValid, onSubmit, onPickExample }: Props) {
  const examples = [
    "https://github.com/facebook/react",
    "https://github.com/pallets/flask",
    "https://github.com/tiangolo/fastapi",
  ];

  // Generate random sparkle positions
  const sparkles = useMemo(() => {
    const total = 10; // how many sparkles
    return Array.from({ length: total }, () => ({
      top: `${Math.random() * 90}%`,   // anywhere in hero
      left: `${Math.random() * 90}%`,
      delay: `${Math.random() * 2.5}s`, // stagger animation
      size: `${12 + Math.random() * 12}px` // 12–24px
    }));
  }, []);

  return (
    <section className="hero">
      <h1 className="hero-title-wrap">
        <svg className="sparkle-title" viewBox="0 0 64 64" aria-hidden>
          <path d="M32 6l6 20 20 6-20 6-6 20-6-20-20-6 20-6 6-20z" />
        </svg>

        <span className="hero-title">Repository to<br />diagram</span>

        <svg className="sparkle-title" viewBox="0 0 64 64" aria-hidden>
          <path d="M32 6l6 20 20 6-20 6-6 20-6-20-20-6 20-6 6-20z" />
        </svg>
      </h1>

      <p className="hero-sub">
        Turn any GitHub repository into an interactive diagram for visualization.<br className="hide-sm" />
      </p>

      <div className="input-card">
        <div className="input-row">
          <input
            className="repo-input"
            placeholder="https://github.com/owner/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
            aria-label="GitHub repository URL"
          />
          <button
            className="btn-primary"
            onClick={onSubmit}
            disabled={!isValid}
            aria-disabled={!isValid}
            title={isValid ? "Generate diagram" : "Enter a valid GitHub repo URL"}
          >
            Visualize
          </button>
        </div>

        <div className="examples">
          <span className="examples-label">Try these example repositories:</span>
          <div className="chip-row">
            {examples.map((ex) => (
              <button key={ex} className="chip" onClick={() => onPickExample(ex)}>
                {new URL(ex).pathname.split("/").slice(1,3).join("/")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Render sparkles */}
      {sparkles.map((s, i) => (
        <svg
          key={i}
          className="sparkle"
          viewBox="0 0 64 64"
          aria-hidden
          style={{
            top: s.top,
            left: s.left,
            width: s.size,
            height: s.size,
            animationDelay: s.delay
          }}
        >
          <path d="M32 6l6 20 20 6-20 6-6 20-6-20-20-6 20-6 6-20z" />
        </svg>
      ))}
    </section>
  );
}
