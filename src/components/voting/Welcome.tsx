import { motion } from "framer-motion";
import { CountdownTimer } from "./CountdownTimer";
import { getVotingPhase, VOTING_START, VOTING_END } from "@/lib/voting-window";

interface Props {
  onStart: () => void;
}

export function Welcome({ onStart }: Props) {
  const phase = getVotingPhase();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl gradient-hero shadow-elegant">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_40%),radial-gradient(circle_at_80%_60%,white_0,transparent_35%)]" />

        {/* Contador — pequeño, en la esquina, nunca protagonista. */}
        {phase !== "closed" && (
          <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
            <CountdownTimer
              target={phase === "before" ? VOTING_START : VOTING_END}
              label={phase === "before" ? "Inicia en" : "Cierra en"}
            />
          </div>
        )}

        <div className="relative flex flex-col items-center px-6 text-center text-primary-foreground">
          <h1 className="max-w-md text-2xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            Bienvenido a la votación por el
            <span className="block">Mejor Servidor Público</span>
          </h1>
          <p className="mt-2 text-xs text-white/70 sm:text-sm">
            Secretaría General · Cultura Organizacional
          </p>

          <motion.button
            type="button"
            onClick={onStart}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.94 }}
            className="group relative mt-8 flex flex-col items-center gap-2 focus-visible:outline-none sm:mt-10"
            aria-label="Ingresar a la votación"
          >
            <span className="pointer-events-none absolute inset-0 -m-4 rounded-full bg-white/10 opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-100" />
            <BallotIcon className="relative h-20 w-20 drop-shadow-lg sm:h-28 sm:w-28 lg:h-32 lg:w-32" />
            <span className="text-sm font-semibold text-white/90 transition-colors group-hover:text-white">
              Toca para ingresar
            </span>
          </motion.button>

          {phase === "before" && (
            <p className="mt-2 max-w-xs text-[11px] text-white/60 sm:text-xs">
              Ya puede conocer a los candidatos. El botón para votar se habilita cuando inicie
              el período oficial.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Ícono original: tarjeta de votación cayendo dentro de una urna. */
function BallotIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="48" fill="white" fillOpacity="0.12" />

      {/* Urna */}
      <path d="M27 52 H73 L66 83 H34 Z" fill="white" fillOpacity="0.92" />
      <rect x="25" y="45" width="50" height="9" rx="3" fill="white" />
      <rect x="41" y="45" width="18" height="9" rx="1.5" fill="var(--primary)" />

      {/* Tarjeta */}
      <g>
        <rect
          x="37"
          y="15"
          width="26"
          height="18"
          rx="3"
          fill="white"
          stroke="white"
          strokeWidth="1"
        />
        <path
          d="M43 24 L48 29 L58 18"
          stroke="var(--accent)"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </g>
    </svg>
  );
}