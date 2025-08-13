// src/components/InfoPanels.tsx
import { copyToClipboard, downloadText } from "../lib/textUtils";

export function PanelShell({
  title,
  rightAction,
  children,
}: {
  title: string;
  rightAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card-section">
      <div className="card-header">
        <h3 className="card-title">{title}</h3>
        <div className="card-actions">{rightAction}</div>
      </div>
      <div className="card-body">{children}</div>
    </section>
  );
}

export function CodeBlock({
  text,
  ariaLabel,
  scrollable = false,
  maxHeight = 420, // default scroll height
}: {
  text: string;
  ariaLabel?: string;
  scrollable?: boolean;
  maxHeight?: number | string;
}) {
  return (
    <pre
      className={`code-block${scrollable ? " scrollable" : ""}`}
      aria-label={ariaLabel}
      style={scrollable ? { maxHeight } : undefined}
    >
      {text}
    </pre>
  );
}

export function CopyButton({ label = "Copy", getText }: { label?: string; getText: () => string }) {
  return (
    <button
      className="btn-neo small"
      onClick={() => copyToClipboard(getText())}
      title="Copy to clipboard"
    >
      📋 {label}
    </button>
  );
}

export function DownloadButton({ filename, getText }: { filename: string; getText: () => string }) {
  return (
    <button
      className="btn-neo small"
      onClick={() => downloadText(filename, getText())}
      title="Download as file"
    >
      ⬇️ Download
    </button>
  );
}
