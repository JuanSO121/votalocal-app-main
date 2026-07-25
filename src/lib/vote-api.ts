/**
 * Cliente HTTP para el backend de Google Apps Script.
 *
 * ─────────────────────────────────────────────────────────────
 * CONFIGURACIÓN
 * ─────────────────────────────────────────────────────────────
 * 1) Cree un Google Sheets con las columnas:
 *    id | fecha_hora | nombre | documento | correo | dependencia | candidato_id | candidato_nombre
 * 2) Extensiones → Apps Script → pegue el script incluido en README.md
 *    y publique como Web App (Ejecutar como: usted; Acceso: cualquiera con enlace).
 * 3) Copie la URL del Web App y expóngala como variable de entorno
 *    VITE_APPS_SCRIPT_URL (o defínala directamente aquí para pruebas locales).
 * 4) El ID del Sheets se configura dentro del propio Apps Script (SHEET_ID).
 * 5) Para el panel de resultados en vivo, el Apps Script también debe
 *    responder a GET `?action=resultados` con:
 *    { ok: true, total: number, resultados: [{ candidato_id, votos }], actualizado: isoString }
 *    (agrupando y contando filas del Sheet por candidato_id). Ver el
 *    snippet de referencia en README.md.
 */

export const APPS_SCRIPT_URL: string =
  (import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined) ?? "";

export interface VotePayload {
  id: string;
  nombre: string;
  documento: string;
  correo: string;
  dependencia: string;
  candidato_id: string;
  candidato_nombre: string;
  fecha_hora: string;
}

export interface VoteResponse {
  ok: boolean;
  id?: string;
  error?: string;
}

/**
 * Genera un ID único para el voto (evita duplicados en condiciones de carrera).
 * Combina timestamp + random para minimizar colisiones incluso con miles
 * de usuarios simultáneos.
 */
export function generateVoteId(): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `VOTE-${rnd}`;
}

/**
 * Envía el voto al Apps Script.
 * - Reintenta hasta 3 veces con backoff exponencial en errores de red.
 * - Usa `text/plain` para evitar preflight CORS (patrón estándar Apps Script).
 * - El backend debe deduplicar por `id` (ver README.md).
 */
export async function submitVote(payload: VotePayload): Promise<VoteResponse> {
  if (!APPS_SCRIPT_URL) {
    // Modo demo: sin backend configurado.
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
        // text/plain evita preflight CORS con Apps Script
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        redirect: "follow",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as VoteResponse;
      if (!data.ok) throw new Error(data.error ?? "Error desconocido del servidor");
      return data;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
      }
    }
  }

  return {
    ok: false,
    error:
      lastError instanceof Error
        ? lastError.message
        : "No fue posible registrar el voto. Intente nuevamente.",
  };
}

// ─────────────────────────────────────────────────────────────
// RESULTADOS (panel en vivo)
// ─────────────────────────────────────────────────────────────

export interface CandidateResult {
  candidato_id: string;
  votos: number;
}

export interface ResultsResponse {
  ok: boolean;
  total: number;
  resultados: CandidateResult[];
  /** ISO timestamp de cuándo se generó este conteo. */
  actualizado: string;
  error?: string;
}

/** Hash determinístico simple, usado solo para generar la demo estable. */
function seededVotes(id: string, max: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % max;
}

// Acumulador en memoria (solo modo demo) para simular votos llegando
// mientras la persona mira el panel de resultados.
const demoExtraVotes: Record<string, number> = {};

/**
 * Obtiene el conteo de votos por candidato.
 * - Sin backend configurado (`APPS_SCRIPT_URL` vacío): genera resultados de
 *   demostración estables por candidato, con pequeños incrementos
 *   aleatorios en cada consulta para simular votación en vivo.
 * - Con backend: hace GET a `${APPS_SCRIPT_URL}?action=resultados`.
 */
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
    const total = resultados.reduce((sum, r) => sum + r.votos, 0);
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
      error:
        err instanceof Error
          ? err.message
          : "No fue posible cargar los resultados. Intente nuevamente.",
    };
  }
}