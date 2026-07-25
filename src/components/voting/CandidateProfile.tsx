// components/voting/CandidateProfile.tsx
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Lock, Vote, Volume2, VolumeX } from "lucide-react";
import type { Candidate } from "@/lib/candidates";
import type { VoterFormValues } from "@/lib/vote-schema";
import { useVideoAspect } from "@/hooks/useVideoAspect";

import { VoteFlowDialog, type VoteResult } from "./VoteFlowDialog";
import { AdaptiveMedia } from "../AdaptiveMedia";

interface Props {
  candidate: Candidate | null;
  onClose: () => void;
  onVoteSubmit: (candidate: Candidate, voter: VoterFormValues) => Promise<VoteResult>;
  votingOpen: boolean;
  closedMessage: string;
}

const FALLBACK_COLOR = "var(--accent)";

function isDirectVideo(url: string) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

function getDriveFileId(url: string): string | null {
  const byPath = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (byPath) return byPath[1];
  const byQuery = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return byQuery ? byQuery[1] : null;
}

function isDriveFolder(url: string) {
  return /drive\.google\.com\/drive\/folders\//i.test(url);
}

export function CandidateProfile({ candidate, onClose, onVoteSubmit, votingOpen, closedMessage }: Props) {
  const [muted, setMuted] = useState(true);
  const [voteOpen, setVoteOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!candidate) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !voteOpen) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [candidate, onClose, voteOpen]);

  useEffect(() => {
    setMuted(true);
    setVoteOpen(false);
  }, [candidate?.id]);

  const videoUrl = candidate?.video ?? "";
  const hasDirectVideo = !!videoUrl && isDirectVideo(videoUrl);
  const driveFileId =
    !hasDirectVideo && videoUrl && !isDriveFolder(videoUrl) ? getDriveFileId(videoUrl) : null;
  const hasDriveVideo = !!driveFileId;
  useVideoAspect(hasDirectVideo ? videoUrl : undefined, hasDirectVideo);
  const accent = candidate?.color ?? FALLBACK_COLOR;

  const hasBody =
    !!candidate?.descripcion ||
    !!candidate?.propuesta ||
    (candidate?.trayectoria?.length ?? 0) > 0 ||
    (candidate?.reconocimientos?.length ?? 0) > 0;

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
          {/* HERO */}
          <div className="relative h-[46vh] min-h-[300px] w-full shrink-0 overflow-hidden rounded-b-[2rem] sm:h-[58vh] sm:min-h-[420px] sm:rounded-b-[2.75rem]">
            <motion.div layoutId={`candidate-photo-${candidate.id}`} className="absolute inset-0">
              {hasDirectVideo ? (
                <AdaptiveMedia
                  ref={videoRef}
                  kind="video"
                  src={videoUrl}
                  poster={candidate.foto}
                  autoPlay
                  loop
                  muted={muted}
                  playsInline
                />
              ) : hasDriveVideo ? (
                <iframe
                  key={candidate.id}
                  src={`https://drive.google.com/file/d/${driveFileId}/preview`}
                  title={`Video de ${candidate.nombre}`}
                  allow="autoplay"
                  className="h-full w-full"
                />
              ) : (
                <AdaptiveMedia
                  kind="image"
                  src={candidate.foto}
                  alt={`Fotografía de ${candidate.nombre}`}
                  darken={false}
                />
              )}
            </motion.div>

            {!hasDriveVideo && (
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `linear-gradient(to top, oklch(0.16 0.05 260) 0%, ${accent}40 30%, transparent 65%)`,
                }}
              />
            )}

            <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4 sm:p-6">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-black/45"
              >
                <ArrowLeft className="h-4 w-4" /> Volver
              </button>
              {hasDirectVideo && (
                <button
                  type="button"
                  aria-label={muted ? "Activar sonido" : "Silenciar"}
                  onClick={() => setMuted((m) => !m)}
                  className="rounded-full border border-white/20 bg-black/30 p-2.5 text-white backdrop-blur-md transition hover:bg-black/45"
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              )}
            </div>

            {!hasDriveVideo && (
              <div className="absolute inset-x-0 bottom-0 px-6 pb-6 sm:px-10 sm:pb-10">
                <p
                  className="text-xs font-semibold uppercase tracking-widest"
                  style={{ color: accent }}
                >
                  {candidate.dependencia}
                </p>
                <h1 className="mt-2 text-[clamp(1.5rem,4.5vw,2.75rem)] font-bold leading-[1.05] text-white">
                  {candidate.nombre}
                </h1>
                <p className="mt-1 text-base text-white/70 sm:text-lg">{candidate.cargo}</p>
              </div>
            )}
          </div>

          {hasDriveVideo && (
            <div className="mx-auto w-full max-w-3xl shrink-0 px-6 pt-6 sm:px-10">
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: accent }}>
                {candidate.dependencia}
              </p>
              <h1 className="mt-1 text-3xl font-bold text-foreground sm:text-4xl">{candidate.nombre}</h1>
              <p className="mt-1 text-base text-muted-foreground">{candidate.cargo}</p>
            </div>
          )}

          <div
            className="relative min-h-0 flex-1 overflow-y-auto"
            style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
          >
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-60"
              style={{ background: `radial-gradient(60% 100% at 50% 0%, ${accent}14 0%, transparent 70%)` }}
            />
            <div className="relative mx-auto max-w-3xl px-6 pb-32 pt-8 sm:px-10 sm:pb-36 sm:pt-10">
              {candidate.descripcion && (
                <p className="text-[1.05rem] leading-relaxed text-foreground">{candidate.descripcion}</p>
              )}

              {candidate.propuesta && (
                <section className="mt-8">
                  <h2
                    className="text-xs font-semibold uppercase tracking-[0.14em]"
                    style={{ color: accent }}
                  >
                    Propuesta
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{candidate.propuesta}</p>
                </section>
              )}

              {candidate.trayectoria && candidate.trayectoria.length > 0 && (
                <section className="mt-8">
                  <h2
                    className="text-xs font-semibold uppercase tracking-[0.14em]"
                    style={{ color: accent }}
                  >
                    Trayectoria
                  </h2>
                  <ul className="mt-3 space-y-3">
                    {candidate.trayectoria.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: accent }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {candidate.reconocimientos && candidate.reconocimientos.length > 0 && (
                <section className="mt-8">
                  <h2
                    className="text-xs font-semibold uppercase tracking-[0.14em]"
                    style={{ color: accent }}
                  >
                    Reconocimientos
                  </h2>
                  <ul className="mt-3 space-y-3">
                    {candidate.reconocimientos.map((item, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                        <span
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: accent }}
                        />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {!hasBody && (
                <p className="text-sm text-muted-foreground">
                  Este candidato aún no tiene una biografía registrada.
                </p>
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-5 z-30 flex justify-center px-4 sm:bottom-7">
            {votingOpen ? (
              <motion.button
                type="button"
                onClick={(e) => {
                  // Suelta el foco antes de que Radix marque este árbol como
                  // aria-hidden al abrir el diálogo — evita el warning de
                  // accesibilidad de foco retenido en elemento oculto.
                  e.currentTarget.blur();
                  setVoteOpen(true);
                }}
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.1 }}
                className="pointer-events-auto relative flex items-center gap-2.5 py-3.5 pl-6 pr-7 text-sm font-semibold text-white shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)] backdrop-blur-md transition hover:brightness-105 active:scale-[0.98]"
                style={{
                  backgroundColor: `${accent}F2`,
                  WebkitMaskImage: `url("data:image/svg+xml,${encodeURIComponent(
                    ticketMaskSvg
                  )}")`,
                  maskImage: `url("data:image/svg+xml,${encodeURIComponent(ticketMaskSvg)}")`,
                  WebkitMaskSize: "100% 100%",
                  maskSize: "100% 100%",
                }}
              >
                <Vote className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">Votar por {candidate.nombre.split(" ")[0]}</span>
              </motion.button>
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
            open={voteOpen}
            onOpenChange={setVoteOpen}
            onVoteSubmit={onVoteSubmit}
            onVoted={() => {
              setVoteOpen(false);
              onClose();
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const ticketMaskSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
  <path d="
    M 8,0
    H 92
    A 8,8 0 0 1 100,8
    V 42
    A 6,6 0 0 0 100,58
    V 92
    A 8,8 0 0 1 92,100
    H 8
    A 8,8 0 0 1 0,92
    V 58
    A 6,6 0 0 0 0,42
    V 8
    A 8,8 0 0 1 8,0
    Z
  " fill="white" />
</svg>
`.trim();