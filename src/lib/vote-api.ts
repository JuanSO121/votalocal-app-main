/**
 * Cliente HTTP para el backend de Google Apps Script (Code.gs).
 *
 * Endpoints:
 *   GET  ?action=config      → { ok, eleccion, candidatas, ahora }   (ver election.ts)
 *   GET  ?action=resultados  → { ok, total, resultados, actualizado, oculto? }
 *   POST (text/plain, JSON)  → registra el voto: { id, usuaria, clave, candidata_id }
 *
 * La URL del Web App va en la variable de entorno VITE_APPS_SCRIPT_URL.
 * Sin URL configurada el front corre en modo demo.
 */

export const APPS_SCRIPT_URL: string =
  (import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined) ?? "";

export interface VotePayload {
  id: string;
  usuaria: string;
  clave: string;
  candidata_id: string;
}

export interface VoteResponse {
  ok: boolean;
  id?: string;
  error?: string;
}

/** ID único del voto. El backend lo usa para no duplicar si hay reintentos de red. */
export function generateVoteId(): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `VOTE-${rnd}`;
}

/**
 * Envía el voto. Reintenta hasta 3 veces solo ante errores de RED.
 * Si el servidor responde ok:false (credenciales malas, ya votó…) NO reintenta:
 * reintentar solo gastaría intentos del límite anti fuerza bruta.
 */
export async function submitVote(payload: VotePayload): Promise<VoteResponse> {
  if (!APPS_SCRIPT_URL) {
    console.warn("[vote-api] VITE_APPS_SCRIPT_URL no configurada. Simulando envío.");
    await new Promise((r) => setTimeout(r, 900));
    return { ok: true, id: payload.id };
  }

  const maxAttempts = 3;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" }, // evita preflight CORS
        body: JSON.stringify(payload),
        redirect: "follow",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as VoteResponse; // ok:true u ok:false con mensaje del servidor
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
    }
  }

  return {
    ok: false,
    error:
      lastError instanceof Error
        ? `Problema de conexión (${lastError.message}). Intente nuevamente.`
        : "No fue posible registrar el voto. Intente nuevamente.",
  };
}

// ─────────────────────────────────────────────────────────────
// RESULTADOS
// ─────────────────────────────────────────────────────────────

export interface CandidateResult {
  candidato_id: string;
  votos: number;
}

export interface ResultsResponse {
  ok: boolean;
  total: number;
  resultados: CandidateResult[];
  actualizado: string;
  /** true si el servidor aún no permite mostrar el conteo. */
  oculto?: boolean;
  error?: string;
}

function seededVotes(id: string, max: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % max;
}

const demoExtraVotes: Record<string, number> = {};

export async function fetchResults(candidateIds: string[]): Promise<ResultsResponse> {
  if (!APPS_SCRIPT_URL) {
    if (Math.random() < 0.35) {
      const id = candidateIds[Math.floor(Math.random() * candidateIds.length)];
      demoExtraVotes[id] = (demoExtraVotes[id] ?? 0) + 1;
    }
    const resultados = candidateIds.map((id) => ({
      candidato_id: id,
      votos: seededVotes(id, 60) + 12 + (demoExtraVotes[id] ?? 0),
    }));
    const total = resultados.reduce((s, r) => s + r.votos, 0);
    return { ok: true, total, resultados, actualizado: new Date().toISOString() };
  }

  try {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=resultados`, { method: "GET" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as ResultsResponse;
    if (!data.ok) throw new Error(data.error ?? "Error desconocido del servidor");
    return data;
  } catch (err) {
    return {
      ok: false,
      total: 0,
      resultados: [],
      actualizado: new Date().toISOString(),
      error: err instanceof Error ? err.message : "No fue posible cargar los resultados. Intente nuevamente.",
    };
  }
}