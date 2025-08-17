import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  repoUrl: string;
  setRepoUrl: (v: string) => void;
  isValid: boolean;
  onSubmit: () => void;
  onPickExample: (url: string) => void;
};

export default function Hero({ repoUrl, setRepoUrl, isValid, onSubmit, onPickExample }: Props) {
  const { t } = useTranslation();

  const examples = [
    "https://github.com/facebook/react",
    "https://github.com/pallets/flask",
    "https://github.com/tiangolo/fastapi",
  ];

  const sparkles = useMemo(() => {
    const total = 10;
    return Array.from({ length: total }, () => ({
      top: `${Math.random() * 90}%`,
      left: `${Math.random() * 90}%`,
      delay: `${Math.random() * 2.5}s`,
      size: `${12 + Math.random() * 12}px`
    }));
  }, []);

  return (
    <section className="hero">
      <h1 className="hero-title-wrap">
        <svg className="sparkle-title" viewBox="0 0 64 64" aria-hidden>
          <path d="M32 6l6 20 20 6-20 6-6 20-6-20-20-6 20-6 6-20z" />
        </svg>

        <span className="hero-title">{t("hero.title")}</span>

        <svg className="sparkle-title" viewBox="0 0 64 64" aria-hidden>
          <path d="M32 6l6 20 20 6-20 6-6 20-6-20-20-6 20-6 6-20z" />
        </svg>
      </h1>

      <p className="hero-sub">{t("hero.subtitle1")}</p>
      <p className="hero-sub">{t("hero.subtitle2")}</p>

      <div className="input-card">
        <div className="input-row">
          <input
            className="repo-input"
            placeholder={t("hero.placeholder")}
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") onSubmit(); }}
            aria-label={t("hero.inputAria")}
          />
          <button
            className="btn-primary"
            onClick={onSubmit}
            disabled={!isValid}
            aria-disabled={!isValid}
            title={isValid ? t("hero.visualizeTooltip") : t("hero.invalidTooltip")}
          >
            {t("hero.visualize")}
          </button>
        </div>

        <div className="examples">
          <span className="examples-label">{t("hero.examplesLabel")}</span>
          <div className="chip-row">
            {examples.map((ex) => (
              <button key={ex} className="chip" onClick={() => onPickExample(ex)}>
                {new URL(ex).pathname.split("/").slice(1,3).join("/")}
              </button>
            ))}
          </div>
        </div>
      </div>

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
