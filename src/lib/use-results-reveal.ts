import { useEffect, useState } from "react";
import { getCountdown, getVotingPhase, isResultsRevealed, type Countdown, type VotingPhase, type VotingWindow } from "./voting-window";

interface UseResultsReveal {
  phase: VotingPhase;
  /** true solo cuando la votación ya cerró Y ya pasó la espera configurada. */
  revealed: boolean;
  /** Cuenta regresiva hasta revealAt. */
  countdown: Countdown;
}

/**
 * Arranca "vacío" y calcula fechas solo tras montar en el cliente (evita
 * desajustes de hidratación SSR). Recibe la ventana ya cargada (o null).
 */
export function useResultsReveal(win: VotingWindow | null): UseResultsReveal {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  if (!now || !win) {
    return { phase: "before", revealed: false, countdown: { days: 0, hours: 0, minutes: 0, seconds: 0, done: false } };
  }
  return {
    phase: getVotingPhase(win, now),
    revealed: isResultsRevealed(win, now),
    countdown: getCountdown(win.revealAt, now),
  };
}