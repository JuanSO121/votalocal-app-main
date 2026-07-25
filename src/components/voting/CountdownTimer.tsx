import { useEffect, useState } from "react";
import { getCountdown, type Countdown } from "@/lib/voting-window";

interface Props {
  /** Fecha objetivo hacia la que cuenta el reloj. */
  target: Date;
  /** Texto corto mostrado antes del reloj, ej. "Inicia en" o "Cierra en". */
  label: string;
  className?: string;
}

export function CountdownTimer({ target, label, className = "" }: Props) {
  const [countdown, setCountdown] = useState<Countdown>(() => getCountdown(target));

  useEffect(() => {
    setCountdown(getCountdown(target));
    const id = setInterval(() => setCountdown(getCountdown(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (countdown.done) return null;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/75 backdrop-blur-sm sm:text-xs ${className}`}
    >
      <span>{label}</span>
      <span className="font-mono font-semibold text-white">
        {countdown.days > 0 && `${countdown.days}d `}
        {pad(countdown.hours)}:{pad(countdown.minutes)}:{pad(countdown.seconds)}
      </span>
    </div>
  );
}