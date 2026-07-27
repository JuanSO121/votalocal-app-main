import { useMemo } from "react";
import { motion } from "framer-motion";
import { Crown, PartyPopper } from "lucide-react";
import type { RankedCandidate } from "@/lib/use-vote-results";
import { CANDIDATE_PALETTE } from "@/lib/candidates";

interface Props {
  ranked: RankedCandidate[];
  total: number;
}

const CONFETTI_COLORS = Object.values(CANDIDATE_PALETTE);
const CONFETTI_COUNT = 26;

interface ConfettiPiece {
  id: number;
  left: number; // %
  color: string;
  size: number; // px
  delay: number; // s
  duration: number; // s
  drift: number; // px, deriva horizontal al caer
}

function buildConfetti(): ConfettiPiece[] {
  return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
    id: i,
    left: Math.round((i / CONFETTI_COUNT) * 100 + (Math.random() * 8 - 4)),
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.round(Math.random() * 6),
    delay: Math.random() * 1.2,
    duration: 3.2 + Math.random() * 1.8,
    drift: Math.random() * 40 - 20,
  }));
}

/**
 * Se muestra solo cuando la votación cerró, ya pasó el tiempo de espera
 * configurado (ver useResultsReveal) y hay un ganador claro (no empate).
 * En caso de empate, se renderiza una variante más sobria en su lugar.
 *
 * Va SIEMPRE arriba del podio (<ResultsPodium />) — es el primer elemento
 * que la persona ve al entrar a resultados una vez cerrada la votación.
 */
export function WinnerAnnouncement({ ranked, total }: Props) {
  // useMemo: las posiciones/colores del confetti se generan una sola vez,
  // no en cada render (evita que "baile" con cada re-render del padre).
  const confetti = useMemo(buildConfetti, []);

  if (total === 0 || ranked.length === 0) return null;

  const topVotes = ranked[0].votos;
  const leaders = ranked.filter((c) => c.votos === topVotes);
  const isTie = leaders.length > 1;
  const ganador = leaders[0];

  return (
    <div className="relative mb-6 overflow-hidden rounded-[2rem] px-6 py-12 text-center sm:py-16">
      {/* Fondo oscuro + resplandor central en el color del ganador — mismo
          lenguaje visual del hero de CandidateProfile (gradiente oscuro +
          texto con drop-shadow), para que se sienta parte de la misma app. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(65% 90% at 50% 15%, oklch(0.3 0.1 260 / 0.95) 0%, oklch(0.14 0.04 260) 65%)",
        }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-4 h-56 w-56 -translate-x-1/2 rounded-full sm:h-72 sm:w-72"
        style={{ background: ganador.color, opacity: 0.4, filter: "blur(56px)" }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Confetti: cae en loop, colores del abanico institucional completo
          (no solo el del ganador) para que se sienta festivo y de "todos". */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {confetti.map((p) => (
          <motion.span
            key={p.id}
            className="absolute top-0 rounded-sm"
            style={{
              left: `${p.left}%`,
              width: p.size,
              height: p.size * 1.6,
              backgroundColor: p.color,
            }}
            initial={{ y: "-10%", x: 0, opacity: 0, rotate: 0 }}
            animate={{ y: "620%", x: p.drift, opacity: [0, 1, 1, 0], rotate: 340 }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <div className="relative">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white/85 backdrop-blur-sm"
        >
          <PartyPopper className="h-3.5 w-3.5" />
          Cultura de la Organización · Enero – Junio 2026
        </motion.span>

        <motion.div
          initial={{ opacity: 0, scale: 0.5, rotate: -25 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 14 }}
          className="mt-6 flex justify-center"
        >
          <Crown
            className="h-10 w-10 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] sm:h-12 sm:w-12"
            style={{ color: ganador.color }}
            fill="currentColor"
          />
        </motion.div>

        {isTie ? (
          <>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-3 text-2xl font-bold text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-3xl"
            >
              ¡Empate en el primer puesto!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mx-auto mt-3 max-w-md text-base text-white/80 sm:text-lg"
            >
              {leaders.map((l) => l.nombre).join(" y ")} quedaron empatados como
              Mejores Servidores Públicos de la Secretaría General.
            </motion.p>
          </>
        ) : (
          <>
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 220, damping: 16 }}
              className="mt-3 flex justify-center"
            >
              <img
                src={ganador.foto}
                alt={ganador.nombre}
                className="h-20 w-20 rounded-full border-4 object-cover shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)] sm:h-24 sm:w-24"
                style={{ borderColor: ganador.color }}
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mt-4 text-sm font-semibold uppercase tracking-widest text-white/70"
            >
              Felicidades al Mejor Servidor Público
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42 }}
              className="mt-1 text-3xl font-bold text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] sm:text-4xl"
            >
              {ganador.nombre}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="mt-2 text-sm text-white/60"
            >
              {ganador.votos} {ganador.votos === 1 ? "voto" : "votos"} ·{" "}
              {ganador.porcentaje.toFixed(0)}% de los {total} votos totales
            </motion.p>
          </>
        )}
      </div>
    </div>
  );
}