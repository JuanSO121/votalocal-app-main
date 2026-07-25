// components/voting/CountdownTimer.tsx
import { useEffect, useState } from "react";
import { getCountdown, type Countdown } from "@/lib/voting-window";

interface Props {
  target: Date;
  label: string;
}

export function CountdownTimer({ target, label }: Props) {
  // Clave: arranca en null. Así el HTML del servidor y el primer render
  // del cliente (antes de montar) son IDÉNTICOS — ambos muestran el
  // placeholder de abajo, sin ningún número calculado todavía.
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  useEffect(() => {
    // Este código NUNCA corre en el servidor. Solo se ejecuta después de
    // que React hidrata en el navegador, así que ya no hay nada que
    // comparar contra el HTML del servidor.
    setCountdown(getCountdown(target));
    const interval = setInterval(() => {
      setCountdown(getCountdown(target));
    }, 1000);
    return () => clearInterval(interval);
  }, [target]);

  if (!countdown) {
    return (
      <div className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs text-white/80 sm:text-sm">
        <span className="uppercase tracking-wide text-white/60">{label}</span>
        <span className="font-mono tabular-nums">--:--:--:--</span>
      </div>
    );
  }

  const { days, hours, minutes, seconds } = countdown;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs text-white/80 sm:text-sm">
      <span className="uppercase tracking-wide text-white/60">{label}</span>
      <span className="font-mono tabular-nums">
        {pad(days)}:{pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </div>
  );
}