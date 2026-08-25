"use client";

import { useEffect, useRef, useState } from "react";

export function SignaturePad({
  name,
  label,
  required = false,
  defaultValue = "",
}: {
  name: string;
  label: string;
  required?: boolean;
  defaultValue?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [dataUrl, setDataUrl] = useState(defaultValue);
  const [empty, setEmpty] = useState(!defaultValue);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.floor(w * ratio);
    canvas.height = Math.floor(h * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111";
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, w, h);

    if (defaultValue) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, w, h);
        setDataUrl(defaultValue);
        setEmpty(false);
      };
      img.src = defaultValue;
    }
  }, [defaultValue]);

  function pos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onPointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    canvas.setPointerCapture(e.pointerId);
    drawing.current = true;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function onPointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setEmpty(false);
  }

  function onPointerUp() {
    if (!drawing.current) return;
    drawing.current = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setDataUrl(canvas.toDataURL("image/png"));
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    setDataUrl("");
    setEmpty(true);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[var(--ink-muted)]">
          {label}
          {required ? " *" : ""}
        </span>
        <button
          type="button"
          onClick={clear}
          className="text-xs text-[var(--ink-muted)] hover:text-white"
        >
          Borrar
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="h-36 w-full touch-none rounded-xl border border-[var(--line)] bg-white"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <input
        type="hidden"
        name={name}
        value={dataUrl}
        required={required && empty}
      />
      {required && empty ? (
        <p className="text-xs text-[var(--danger,#f87171)]">
          Firmá en el recuadro blanco.
        </p>
      ) : null}
    </div>
  );
}
