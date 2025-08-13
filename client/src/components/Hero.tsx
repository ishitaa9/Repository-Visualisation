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

  return (
    <section className="hero">
      <h1 className="hero-title">Repository to<br />diagram</h1>

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
            Diagram
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
    </section>
  );
}
