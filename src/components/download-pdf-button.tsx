"use client";

import { useState } from "react";

export function DownloadPdfButton({
  href,
  className = "btn-ghost inline-flex",
  children = "Descargar PDF",
}: {
  href: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  async function download() {
    if (status === "loading") return;
    setStatus("loading");
    setError("");
    try {
      const res = await fetch(href, { cache: "no-store" });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error || "No se pudo generar el PDF");
      }
      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition") || "";
      const m = /filename="?([^"]+)"?/i.exec(cd);
      const name = m?.[1] || "orden.pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus("done");
      window.setTimeout(() => setStatus("idle"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo descargar");
      setStatus("error");
    }
  }

  const label =
    status === "loading"
      ? "Generando PDF…"
      : status === "done"
        ? "PDF descargado"
        : children;

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        className={className}
        disabled={status === "loading"}
        onClick={() => void download()}
      >
        {label}
      </button>
      {status === "loading" ? (
        <span className="text-xs text-[var(--accent)]">
          Armando el archivo, esperá un momento…
        </span>
      ) : null}
      {error ? (
        <span className="text-xs text-[var(--danger)]">{error}</span>
      ) : null}
    </span>
  );
}
