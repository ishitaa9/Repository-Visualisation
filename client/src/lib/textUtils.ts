export function pseudoCommit(text: string): string {
  // simple, deterministic hex-ish id from text
  let h1 = 0, h2 = 0;
  for (let i = 0; i < text.length; i++) {
    h1 = (h1 * 31 + text.charCodeAt(i)) >>> 0;
    h2 = (h2 * 17 + text.charCodeAt(i)) >>> 0;
  }
  const hex = (n: number) => n.toString(16).padStart(8, "0");
  return (hex(h1) + hex(h2) + hex(h1 ^ h2) + hex(h1 >>> 1)).slice(0, 40);
}

export async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}
