// components/voting/CountdownTimer.tsx
import { useEffect, useState } from "react";
import { getCountdown, type Countdown } from "@/lib/voting-window";

interface Props {
  target: Date;
  label: string;
}

export function CountdownTimer({ target, label }: Props) {
  // Arranca en null: el HTML del servidor y el primer render del cliente son idénticos
  // (ambos muestran el placeholder) y no hay desajuste de hidratación.
  const [countdown, setCountdown] = useState<Countdown | null>(null);

  useEffect(() => {
    setCountdown(getCountdown(target));
    const interval = setInterval(() => setCountdown(getCountdown(target)), 1000);
    return () => clearInterval(interval);
  }, [target]);

  const pad = (n: number) => String(n).padStart(2, "0");
  const value = countdown
    ? `${pad(countdown.days)}:${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)}`
    : "--:--:--:--";

  return (
    <div className="inline-flex shrink-0 items-center gap-2.5 rounded-full border border-border bg-white/85 px-4 py-2 text-xs shadow-sm backdrop-blur sm:text-sm">
      <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
      <span className="font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}