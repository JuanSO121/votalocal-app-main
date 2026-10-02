// components/voting/CandidateProfile.tsx
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ChevronLeft, ChevronRight, Lock, MapPin, Vote } from "lucide-react";
import { BLANCO_ID, type Candidate } from "@/lib/election";
import type { VoterFormValues } from "@/lib/vote-schema";
import { VoteFlowDialog, type LoginLabels, type VoteResult } from "./VoteFlowDialog";
import { AdaptiveMedia } from "../AdaptiveMedia";

interface Props {
  candidate: Candidate | null;
  labels: LoginLabels;
  onClose: () => void;
  onVoteSubmit: (candidate: Candidate, voter: VoterFormValues) => Promise<VoteResult>;
  votingOpen: boolean;
  closedMessage: string;
  onPrev?: () => void;
  onNext?: () => void;
  /** Se dispara cuando la votante pulsa "Continuar" tras registrar su voto. */
  onVoteDone?: () => void;
}

/** Oscurece un color hex; sirve para títulos legibles sobre blanco y para el degradado del botón. */
function darken(hex: string, amount = 0.32): string {
  const m = hex.replace("#", "");
  const num = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  const ch = (shift: number) =>
    Math.max(0, Math.round(((num >> shift) & 0xff) * (1 - amount)))
      .toString(16)
      .padStart(2, "0");
  return `#${ch(16)}${ch(8)}${ch(0)}`;
}

export function CandidateProfile({
  candidate,
  labels,
  onClose,
  onVoteSubmit,
  votingOpen,
  closedMessage,
  onPrev,
  onNext,
  onVoteDone,
}: Props) {
  const [voteOpen, setVoteOpen] = useState(false);

  useEffect(() => {
    if (!candidate) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (voteOpen) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [candidate, onClose, voteOpen, onPrev, onNext]);

  useEffect(() => {
    setVoteOpen(false);
  }, [candidate?.id]);

  const accent = candidate?.color ?? "#2f8f4e";
  const titleColor = darken(accent);
  const accentDark = darken(accent, 0.28);
  const esBlanco = candidate?.id === BLANCO_ID;

  const arrowClass =
    "pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/45 sm:h-11 sm:w-11";

  return (
    <AnimatePresence>
      {candidate && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col voting-shell"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label={`Perfil de ${candidate.nombre}`}
        >
          {/* Botón volver (overlay fijo, no bloquea el scroll) */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between p-4 sm:p-6">
            <button
              type="button"
              onClick={onClose}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-black/45"
            >
              <ArrowLeft className="h-4 w-4" /> Volver
            </button>
          </div>

          {/* Flechas para pasar de perfil sin cerrar */}
          {(onPrev || onNext) && (
            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-40 flex items-center justify-between px-2 sm:px-4">
              {onPrev ? (
                <button type="button" onClick={onPrev} aria-label="Anterior" className={arrowClass}>
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : (
                <span />
              )}
              {onNext ? (
                <button type="button" onClick={onNext} aria-label="Siguiente" className={arrowClass}>
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : (
                <span />
              )}
            </div>
          )}

          <div
            className="relative min-h-0 flex-1 overflow-y-auto"
            style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
          >
            {/* HERO: foto + nombre */}
            <div className="relative h-[46vh] min-h-[300px] w-full shrink-0 overflow-hidden rounded-b-[2rem] sm:h-[58vh] sm:min-h-[420px] sm:rounded-b-[2.75rem]">
              <div className="absolute inset-0">
                <AdaptiveMedia kind="image" src={candidate.foto} alt={`Fotografía de ${candidate.nombre}`} darken={false} />
              </div>
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, oklch(0 0 0 / 0.85) 0%, oklch(0 0 0 / 0.5) 30%, oklch(0 0 0 / 0.05) 65%, transparent 100%)",
                }}
              />
              <div className="absolute inset-x-0 bottom-0 px-6 pb-6 sm:px-10 sm:pb-10">
                {candidate.municipio && (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white"
                    style={{ backgroundColor: `${accent}E6` }}
                  >
                    <MapPin className="h-3 w-3" /> {candidate.municipio}
                  </span>
                )}
                <h1 className="mt-2 text-[clamp(1.5rem,4.5vw,2.75rem)] font-bold leading-[1.05] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
                  {candidate.nombre}
                </h1>
                {candidate.frase && (
                  <p className="mt-1 max-w-2xl text-base text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] sm:text-lg">
                    {candidate.frase}
                  </p>
                )}
              </div>
            </div>

            {/* CUERPO */}
            <div className="relative">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-60"
                style={{ background: `radial-gradient(60% 100% at 50% 0%, ${accent}14 0%, transparent 70%)` }}
              />
              <div className="relative mx-auto max-w-3xl px-6 pb-32 pt-8 sm:px-10 sm:pb-36 sm:pt-10">
                {!esBlanco && (
                  <section>
                    <h2 className="text-sm font-bold uppercase tracking-[0.1em] sm:text-base" style={{ color: titleColor }}>
                      Propuesta
                    </h2>
                    {candidate.propuesta ? (
                      <p className="mt-3 whitespace-pre-line text-[1.05rem] leading-relaxed text-foreground">
                        {candidate.propuesta}
                      </p>
                    ) : (
                      <p className="mt-3 text-sm text-muted-foreground">La propuesta se publicará próximamente.</p>
                    )}
                  </section>
                )}
                {esBlanco && (
                  <p className="text-[1.05rem] leading-relaxed text-foreground">
                    Seleccione esta opción si considera que ninguna de las candidatas representa su elección.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Botón de votar */}
          <div className="pointer-events-none absolute inset-x-0 bottom-5 z-30 flex justify-center px-4 sm:bottom-7">
            {votingOpen ? (
              <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.1 }}
                className="pointer-events-auto relative"
              >
                <motion.div
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 rounded-full blur-2xl"
                  style={{ backgroundColor: accent }}
                  animate={{ opacity: [0.35, 0.55, 0.35], scale: [1.05, 1.15, 1.05] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur(); // evita warning de foco retenido al abrir el diálogo
                    setVoteOpen(true);
                  }}
                  className="group relative flex items-center gap-2.5 rounded-full py-3.5 pl-6 pr-7 text-sm font-semibold text-white transition-transform duration-200 active:scale-[0.97]"
                  style={{
                    background: `linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)`,
                    boxShadow: `0 8px 24px -6px ${accent}66, 0 2px 6px rgba(0,0,0,0.25)`,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/25 transition group-hover:ring-white/40"
                  />
                  <Vote className="relative h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span className="relative whitespace-nowrap">
                    {esBlanco ? "Votar en blanco" : `Votar por ${candidate.nombre.split(" ")[0]}`}
                  </span>
                </button>
              </motion.div>
            ) : (
              <motion.span
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.1 }}
                className="pointer-events-auto relative flex items-center gap-2 rounded-full border border-border bg-background/90 px-6 py-3 text-sm font-medium text-muted-foreground shadow-[0_14px_32px_-14px_rgba(0,0,0,0.35)] backdrop-blur-md"
              >
                <Lock className="h-4 w-4 shrink-0" />
                {closedMessage}
              </motion.span>
            )}
          </div>

          <VoteFlowDialog
            candidate={candidate}
            labels={labels}
            open={voteOpen}
            onOpenChange={setVoteOpen}
            onVoteSubmit={onVoteSubmit}
            onVoted={() => {
              setVoteOpen(false);
              onVoteDone?.();
              onClose();
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}