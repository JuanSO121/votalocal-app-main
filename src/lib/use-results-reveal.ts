import { useEffect, useState } from "react";
import {
  RESULTS_REVEAL_AT,
  getCountdown,
  getVotingPhase,
  isResultsRevealed,
  type Countdown,
  type VotingPhase,
} from "./voting-window";

interface UseResultsReveal {
  phase: VotingPhase;
  /** true solo cuando la votación ya cerró Y ya pasó la espera configurada. */
  revealed: boolean;
  /** Cuenta regresiva hasta RESULTS_REVEAL_AT (solo relevante mientras phase === "closed" && !revealed). */
  countdown: Countdown;
}

/**
 * Igual que CountdownTimer: arranca "vacío" y solo calcula fechas después de
 * montar en el cliente, para no romper la hidratación SSR (ver nota en
 * voting-window.ts sobre `new Date()` sin argumentos).
 */
export function useResultsReveal(): UseResultsReveal {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!now) {
    return {
      phase: "before",
      revealed: false,
      countdown: { days: 0, hours: 0, minutes: 0, seconds: 0, done: false },
    };
  }

  return {
    phase: getVotingPhase(now),
    revealed: isResultsRevealed(now),
    countdown: getCountdown(RESULTS_REVEAL_AT, now),
  };
}