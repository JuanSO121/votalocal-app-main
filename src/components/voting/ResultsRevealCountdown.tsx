import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { Countdown } from "@/lib/voting-window";

interface Props {
  countdown: Countdown;
}

/**
 * Se muestra en el lugar del podio mientras la votación ya cerró pero aún
 * no pasa el tiempo de espera configurado (RESULTS_REVEAL_DELAY_MINUTES).
 * Mismo lenguaje visual "cinematográfico" oscuro que WinnerAnnouncement,
 * pero sin revelar todavía nada — genera expectativa en vez de spoilear.
 */
export function ResultsRevealCountdown({ countdown }: Props) {
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="relative overflow-hidden rounded-[2rem] px-6 py-12 text-center sm:py-16">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 90% at 50% 10%, oklch(0.32 0.11 260 / 0.9) 0%, oklch(0.16 0.05 260) 60%)",
        }}
      />

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-8 h-40 w-40 -translate-x-1/2 rounded-full sm:h-56 sm:w-56"
        style={{ background: "var(--accent)", opacity: 0.35, filter: "blur(48px)" }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/80 backdrop-blur-sm"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Contando los votos
        </motion.span>

        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-5 text-2xl font-bold text-white sm:text-3xl"
        >
          El Mejor Servidor Público se revela en...
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 16 }}
          className="mt-6 flex items-center justify-center gap-2 font-mono text-3xl font-bold tabular-nums text-white sm:gap-3 sm:text-5xl"
        >
          {[
            { v: countdown.hours + countdown.days * 24, l: "hrs" },
            { v: countdown.minutes, l: "min" },
            { v: countdown.seconds, l: "seg" },
          ].map((u, i) => (
            <span key={u.l} className="flex items-center gap-2 sm:gap-3">
              <span className="flex flex-col items-center">
                <span>{pad(u.v)}</span>
                <span className="text-[0.6rem] font-medium uppercase tracking-widest text-white/50 sm:text-xs">
                  {u.l}
                </span>
              </span>
              {i < 2 && <span className="text-white/30">:</span>}
            </span>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-5 text-sm text-white/60"
        >
          Cultura de la Organización · Secretaría General · Enero – Junio 2026
        </motion.p>
      </div>
    </div>
  );
}