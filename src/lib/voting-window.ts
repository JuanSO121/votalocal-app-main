/**
 * Ventana de votación. Ya no hay fechas fijas aquí: salen de la hoja CONFIG
 * (INICIO, FIN, ESPERA_REVELAR_MIN) vía useElection(). El servidor también las valida.
 */
import type { Election } from "./election";

export type VotingPhase = "before" | "open" | "closed";

export interface VotingWindow {
  start: Date;
  end: Date;
  revealAt: Date;
}

export function buildWindow(e: Pick<Election, "inicio" | "fin" | "esperaRevelarMin">): VotingWindow {
  const start = new Date(e.inicio);
  const end = new Date(e.fin);
  return { start, end, revealAt: new Date(end.getTime() + (e.esperaRevelarMin ?? 0) * 60_000) };
}

export function getVotingPhase(w: VotingWindow, now: Date = new Date()): VotingPhase {
  if (now < w.start) return "before";
  if (now > w.end) return "closed";
  return "open";
}

/** true si ya pasó el tiempo de espera y el resultado puede mostrarse. */
export function isResultsRevealed(w: VotingWindow, now: Date = new Date()): boolean {
  return now >= w.revealAt;
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
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  const s = Math.floor(diff / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: false,
  };
}