const EMAIL_SPLIT = /[,;]+/;

export function parseStoredEmailDestinos(stored?: string | null): string[] {
  if (!stored?.trim()) return [];
  return [
    ...new Set(
      stored
        .split(EMAIL_SPLIT)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.includes("@"))
    ),
  ];
}

export function emailDestinosFromForm(formData: FormData): string[] {
  const list = formData
    .getAll("emailDestino")
    .map((v) => String(v).trim().toLowerCase())
    .filter((e) => e.includes("@"));
  if (list.length) return [...new Set(list)];

  const single = formData.get("emailDestino");
  if (typeof single === "string") {
    return parseStoredEmailDestinos(single);
  }
  return [];
}

export function formatEmailDestinos(emails: string[]): string {
  return emails.join(", ");
}

export function defaultEmailDestinos(
  stored?: string | null,
  clienteEmail?: string | null
): string[] {
  const saved = parseStoredEmailDestinos(stored);
  if (saved.length) return saved;
  const c = (clienteEmail || "").trim().toLowerCase();
  if (c.includes("@")) return [c];
  return [""];
}

export function formatEmailDestinosDisplay(stored?: string | null): string {
  const list = parseStoredEmailDestinos(stored);
  return list.length ? formatEmailDestinos(list) : "";
}

export function resolveEmailDestinosGuardado(formData: FormData): string | null {
  const destinos = emailDestinosFromForm(formData);
  return destinos.length ? formatEmailDestinos(destinos) : null;
}

export function emailDestinosFromFormOrStored(
  formData: FormData,
  stored?: string | null
): string[] {
  const fromForm = emailDestinosFromForm(formData);
  if (fromForm.length) return fromForm;
  return parseStoredEmailDestinos(stored);
}
