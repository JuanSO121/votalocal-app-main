/**
 * Ventana de votación.
 *
 * Edite SOLO estas dos fechas para controlar todo el proceso:
 * - Antes de VOTING_START: se puede ingresar y ver a los candidatos en modo
 *   vista previa (sin botón "Votar" en el perfil).
 * - Entre VOTING_START y VOTING_END: votación abierta normalmente.
 * - Después de VOTING_END: se puede seguir consultando resultados, pero ya
 *   no se admiten nuevos votos (el perfil vuelve a modo solo lectura).
 */

// Fecha y hora FIJAS de inicio. Edite este valor cuando necesite cambiar
// la apertura de la votación — NUNCA use `new Date()` sin argumentos aquí,
// porque el servidor (SSR) y el navegador evalúan este archivo en momentos
// distintos, y eso rompe la hidratación de React (mismatch servidor/cliente).
export const VOTING_START = new Date("2026-08-05T14:00:00-05:00");

export const VOTING_END = new Date("2026-08-06T10:00:00-05:00");

export const RESULTS_REVEAL_DELAY_MINUTES = 60;

export type VotingPhase = "before" | "open" | "closed";
 
export function getVotingPhase(now: Date = new Date()): VotingPhase {
  if (now < VOTING_START) return "before";
  if (now > VOTING_END) return "closed";
  return "open";
}


export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
}

export function getCountdown(target: Date, now: Date = new Date()): Countdown {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }
  const totalSeconds = Math.floor(diff / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    done: false,
  };
}

export const RESULTS_REVEAL_AT = new Date(
  VOTING_END.getTime() + RESULTS_REVEAL_DELAY_MINUTES * 60 * 1000
);
 
/** true si ya pasó el tiempo de espera y el ganador puede mostrarse. */
export function isResultsRevealed(now: Date = new Date()): boolean {
  return now >= RESULTS_REVEAL_AT;
}