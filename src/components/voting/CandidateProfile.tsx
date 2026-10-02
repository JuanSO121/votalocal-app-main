// components/voting/CandidateProfile.tsx
// Tarjeta grande (no pantalla completa): solo hay nombre, municipio y frase.
// Si más adelante se llena PROPUESTA en el Sheet, aparece automáticamente una sección extra.
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Lock, MapPin, Quote, Vote, X } from "lucide-react";
import { BLANCO_ID, type Candidate } from "@/lib/election";
import type { VoterFormValues } from "@/lib/vote-schema";
import { VoteFlowDialog, type LoginLabels, type VoteResult } from "./VoteFlowDialog";

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

/** Oscurece un color hex; sirve para el degradado del encabezado y del botón. */
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
  const accentDark = darken(accent, 0.32);
  const titleColor = darken(accent, 0.25);
  const esBlanco = candidate?.id === BLANCO_ID;

  const navBtn =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-foreground transition hover:bg-secondary/70";

  return (
    <AnimatePresence>
      {candidate && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label={`Perfil de ${candidate.nombre}`}
        >
          <motion.div
            key={candidate.id}
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-[2rem] bg-card shadow-[0_40px_90px_-20px_rgba(0,0,0,0.6)]"
          >
            {/* Encabezado de color */}
            <div
              className="relative h-28 shrink-0 sm:h-32"
              style={{
                background: `radial-gradient(80% 120% at 20% 0%, ${accent} 0%, transparent 70%), linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)`,
              }}
            >
              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/25 bg-black/25 text-white backdrop-blur-md transition hover:bg-black/40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Avatar que se monta sobre el encabezado */}
            <div className="relative z-10 -mt-14 flex shrink-0 justify-center">
              <div
                className="h-28 w-28 overflow-hidden rounded-full border-4 border-card bg-secondary shadow-lg sm:h-32 sm:w-32"
                style={{ boxShadow: `0 12px 30px -10px ${accent}99` }}
              >
                <img
                  src={candidate.foto}
                  alt={`Fotografía de ${candidate.nombre}`}
                  className="h-full w-full object-cover object-top"
                />
              </div>
            </div>

            {/* Contenido */}
            <div
              className="min-h-0 flex-1 overflow-y-auto px-6 pb-2 pt-4 text-center"
              style={{ overscrollBehavior: "contain" }}
            >
              {candidate.municipio && !esBlanco && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white"
                  style={{ backgroundColor: accent }}
                >
                  <MapPin className="h-3 w-3" /> {candidate.municipio}
                </span>
              )}

              <h2 className="mt-3 text-2xl font-bold leading-tight text-foreground sm:text-[1.7rem]">
                {candidate.nombre}
              </h2>

              {candidate.frase && (
                <div className="mt-4">
                  {!esBlanco && <Quote className="mx-auto h-5 w-5" style={{ color: accent }} fill="currentColor" />}
                  <p className="mt-2 text-base leading-relaxed text-foreground/90">
                    {esBlanco ? candidate.frase : `“${candidate.frase}”`}
                  </p>
                </div>
              )}

              {/* Solo aparece si el Sheet trae propuesta */}
              {candidate.propuesta && (
                <section className="mt-5 text-left">
                  <h3 className="text-sm font-bold uppercase tracking-[0.1em]" style={{ color: titleColor }}>
                    Propuesta
                  </h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {candidate.propuesta}
                  </p>
                </section>
              )}
            </div>

            {/* Acción: anterior · votar · siguiente */}
            <div className="flex shrink-0 items-center gap-2 px-5 pb-5 pt-4">
              {onPrev ? (
                <button type="button" onClick={onPrev} aria-label="Anterior" className={navBtn}>
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : (
                <span className="w-11" />
              )}

              {votingOpen ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur(); // evita warning de foco retenido al abrir el diálogo
                    setVoteOpen(true);
                  }}
                  className="group relative flex min-w-0 flex-1 items-center justify-center gap-2.5 rounded-full py-3.5 text-sm font-semibold text-white transition-transform duration-200 active:scale-[0.97]"
                  style={{
                    background: `linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)`,
                    boxShadow: `0 8px 24px -6px ${accent}66, 0 2px 6px rgba(0,0,0,0.25)`,
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/25 transition group-hover:ring-white/40"
                  />
                  <Vote className="relative h-4 w-4 shrink-0" />
                  <span className="relative truncate">
                    {esBlanco ? "Votar en blanco" : `Votar por ${candidate.nombre.split(" ")[0]}`}
                  </span>
                </button>
              ) : (
                <span className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-background/90 px-4 py-3 text-sm font-medium text-muted-foreground">
                  <Lock className="h-4 w-4 shrink-0" />
                  <span className="truncate">{closedMessage}</span>
                </span>
              )}

              {onNext ? (
                <button type="button" onClick={onNext} aria-label="Siguiente" className={navBtn}>
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : (
                <span className="w-11" />
              )}
            </div>
          </motion.div>

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