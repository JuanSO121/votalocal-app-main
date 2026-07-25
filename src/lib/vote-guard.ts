/**
 * Restricción cliente: un votante (documento) solo puede votar una vez.
 * Se guarda en localStorage con TTL de 90 días. Es una salvaguarda de UX;
 * la fuente de verdad definitiva es el Apps Script (LockService + hoja).
 */
const KEY = "gvc:votes";
const TTL_MS = 1000 * 60 * 60 * 24 * 90;

type Record = { documento: string; voteId: string; at: number };

function read(): Record[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const now = Date.now();
    return (JSON.parse(raw) as Record[]).filter((r) => now - r.at < TTL_MS);
  } catch {
    return [];
  }
}

export function hasVoted(documento: string): Record | null {
  const doc = documento.trim();
  return read().find((r) => r.documento === doc) ?? null;
}

export function markVoted(documento: string, voteId: string): void {
  if (typeof window === "undefined") return;
  const list = read().filter((r) => r.documento !== documento.trim());
  list.push({ documento: documento.trim(), voteId, at: Date.now() });
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage bloqueado — el backend seguirá bloqueando duplicados */
  }
}