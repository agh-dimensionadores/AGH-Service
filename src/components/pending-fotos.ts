"use client";

import { useEffect, useRef, useState } from "react";

export type PendingFoto = { file: File; url: string };

export function revokePendingFotos(items: PendingFoto[]) {
  items.forEach((p) => URL.revokeObjectURL(p.url));
}

export function assignFilesToInput(
  input: HTMLInputElement | null,
  files: File[]
) {
  if (!input) return;
  const dt = new DataTransfer();
  for (const file of files) dt.items.add(file);
  input.files = dt.files;
}

/** Maneja previews + FileList del input para poder quitar una foto antes de enviar. */
export function usePendingFotos(maxSlots: number) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingFoto[]>([]);

  useEffect(() => {
    return () => revokePendingFotos(pending);
    // Solo al desmontar; al cambiar pending se revoca en los setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function replaceFromInput(fileList: FileList | null) {
    const files = Array.from(fileList ?? []).slice(0, Math.max(0, maxSlots));
    setPending((old) => {
      revokePendingFotos(old);
      return files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    });
  }

  function removeAt(index: number) {
    setPending((old) => {
      const next = old.filter((_, i) => i !== index);
      const removed = old[index];
      if (removed) URL.revokeObjectURL(removed.url);
      assignFilesToInput(
        inputRef.current,
        next.map((p) => p.file)
      );
      return next;
    });
  }

  function clearAll() {
    setPending((old) => {
      revokePendingFotos(old);
      assignFilesToInput(inputRef.current, []);
      return [];
    });
  }

  return { inputRef, pending, replaceFromInput, removeAt, clearAll };
}
