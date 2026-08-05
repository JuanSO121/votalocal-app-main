// components/voting/CandidateProfile.tsx
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Award, ChevronLeft, ChevronRight, Lock, Play, Vote, Volume2, VolumeX } from "lucide-react";
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
  // Permiten pasar al candidato anterior/siguiente sin cerrar el perfil.
  // Si se omiten (por ejemplo, cuando solo hay un candidato) no se
  // muestran las flechas.
  onPrev?: () => void;
  onNext?: () => void;
}

const FALLBACK_COLOR = "var(--accent)";
const PERIODO_DEFAULT = "enero – junio de 2026";

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

/**
 * Oscurece un color hex un porcentaje dado. Los acentos institucionales
 * (dorado, teal, verde) están calibrados para verse bien como fondo, pero
 * como texto plano sobre blanco quedan flojos de contraste — los títulos de
 * sección usan esta versión más oscura del mismo color en vez del acento
 * puro, y a un tamaño mayor. También se reutiliza para el degradado del
 * botón de votar (accent claro arriba → esta versión oscura abajo).
 */
function darken(hex: string, amount = 0.32): string {
  const m = hex.replace("#", "");
  const num = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function CandidateProfile({
  candidate,
  onClose,
  onVoteSubmit,
  votingOpen,
  closedMessage,
  onPrev,
  onNext,
}: Props) {
  const [muted, setMuted] = useState(true);
  const [voteOpen, setVoteOpen] = useState(false);
  // Antes no había forma de pausar el video: solo existía el botón de
  // silenciar. Este estado refleja si el video está en pausa para poder
  // togglearlo con un tap y mostrar el ícono correcto en el overlay.
  const [videoPaused, setVideoPaused] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleVideoPlayback = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play();
    } else {
      el.pause();
    }
  };

  useEffect(() => {
    if (!candidate) return;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !voteOpen) onClose();
      // Flechas de teclado como atajo del mismo gesto que los botones
      // laterales — solo activas cuando el diálogo de voto no está abierto,
      // para no interferir con la navegación dentro del formulario.
      if (voteOpen) return;
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
    setVideoPaused(false);
  }, [candidate?.id]);

  const videoUrl = candidate?.video ?? "";
  const hasDirectVideo = !!videoUrl && isDirectVideo(videoUrl);
  const driveFileId =
    !hasDirectVideo && videoUrl && !isDriveFolder(videoUrl) ? getDriveFileId(videoUrl) : null;
  const hasDriveVideo = !!driveFileId;
  useVideoAspect(hasDirectVideo ? videoUrl : undefined, hasDirectVideo);
  const accent = candidate?.color ?? FALLBACK_COLOR;
  const titleColor = candidate?.color ? darken(candidate.color) : accent;
  const accentDark = candidate?.color ? darken(candidate.color, 0.28) : accent;
  const variablesCultura = candidate?.variablesCultura ?? [];

  const hasBody =
    !!candidate?.descripcion ||
    (candidate?.aportes?.length ?? 0) > 0 ||
    (candidate?.trayectoria?.length ?? 0) > 0 ||
    (candidate?.reconocimientos?.length ?? 0) > 0;

  const cargoConFecha = candidate
    ? [candidate.cargo, candidate.fechaIngreso ? `Fecha de Ingreso a la Gobernación ${candidate.fechaIngreso}` : null]
        .filter(Boolean)
        .join(" · ")
    : "";

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
          {/*
            Controles fijos (volver / mute): el HERO vive dentro del
            contenedor con scroll (más abajo) para que el video se desplace
            junto con el resto del contenido, así que estos botones se
            sacan a un overlay independiente (z-40) con pointer-events solo
            en los botones, para no bloquear el scroll del resto.
          */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex items-center justify-between p-4 sm:p-6">
            <button
              type="button"
              onClick={onClose}
              className="pointer-events-auto inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-black/45"
            >
              <ArrowLeft className="h-4 w-4" /> Volver
            </button>
            {hasDirectVideo && (
              <button
                type="button"
                aria-label={muted ? "Activar sonido" : "Silenciar"}
                className="pointer-events-auto rounded-full border border-white/50 bg-white/20 p-2.5 text-white backdrop-blur-lg shadow-lg transition hover:bg-white/30"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            )}
          </div>

          {/*
            Flechas para pasar de candidato sin salir del perfil. Antes la
            única forma de ver otro candidato era cerrar (Volver) y volver a
            abrir desde el carrusel. Van en un overlay propio, centradas
            verticalmente, para no interferir con el header de arriba ni con
            el botón de votar de abajo. En móvil se mueven más cerca del
            borde y se angostan un poco para no tapar el video.
          */}
          {(onPrev || onNext) && (
            <div className="pointer-events-none absolute inset-y-0 left-0 right-0 z-40 flex items-center justify-between px-2 sm:px-4">
              {onPrev ? (
                <button
                  type="button"
                  onClick={onPrev}
                  aria-label="Candidato anterior"
                  className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/45 sm:h-11 sm:w-11"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : (
                <span />
              )}
              {onNext ? (
                <button
                  type="button"
                  onClick={onNext}
                  aria-label="Siguiente candidato"
                  className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/30 text-white backdrop-blur-md transition hover:bg-black/45 sm:h-11 sm:w-11"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : (
                <span />
              )}
            </div>
          )}

          {/*
            Todo el contenido — HERO (video/foto) incluido — vive dentro de
            este único contenedor con overflow-y-auto, así el scroll mueve
            el video junto con la descripción en vez de dejarlo fijo arriba.
          */}
          <div
            className="relative min-h-0 flex-1 overflow-y-auto"
            style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}
          >
            {/* HERO */}
            <div className="relative h-[46vh] min-h-[300px] w-full shrink-0 overflow-hidden rounded-b-[2rem] sm:h-[58vh] sm:min-h-[420px] sm:rounded-b-[2.75rem]">
              <motion.div layoutId={`candidate-photo-${candidate.id}`} className="absolute inset-0">
                {hasDirectVideo ? (
                  // Antes el video no tenía ningún control para pausarlo: ni
                  // atributo `controls`, ni onClick, ni nada. Ahora un tap
                  // en cualquier parte del video hace toggle de play/pause
                  // (el botón de silenciar, arriba, sigue siendo independiente).
                  <button
                    type="button"
                    onClick={toggleVideoPlayback}
                    aria-label={videoPaused ? "Reproducir video" : "Pausar video"}
                    className="absolute inset-0 h-full w-full cursor-pointer"
                  >
                    <AdaptiveMedia
                      ref={videoRef}
                      kind="video"
                      src={videoUrl}
                      poster={candidate.foto}
                      autoPlay
                      loop
                      muted={muted}
                      playsInline
                      onPlay={() => setVideoPaused(false)}
                      onPause={() => setVideoPaused(true)}
                    />
                    {/*
                      Ícono de estado: solo se muestra mientras está en
                      pausa, como confirmación visual de que el tap
                      funcionó — igual que en Instagram/TikTok.
                    */}
                    {videoPaused && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
                          <Play className="ml-1 h-7 w-7 fill-white text-white" />
                        </span>
                      </span>
                    )}
                  </button>
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
                  className="pointer-events-none absolute inset-0 hidden sm:block"
                  style={{
                    background:
                      "linear-gradient(to top, oklch(0 0 0 / 0.85) 0%, oklch(0 0 0 / 0.55) 32%, oklch(0 0 0 / 0.05) 68%, transparent 100%)",
                  }}
                />
              )}

              {/*
                Las medallas ya no usan whitespace-nowrap: con variables
                largas como "Servicio de entrega a clientes internos y
                externos" el texto en una sola línea se salía del contenedor.
                Ahora el contenedor tiene un max-width fijo y cada chip
                envuelve en varias líneas (rounded-xl en vez de rounded-full,
                que sí luce bien con texto multilínea).
              */}
              {!hasDriveVideo && (
                <div className="absolute inset-x-0 bottom-0 hidden gap-4 px-6 pb-6 sm:flex sm:items-end sm:justify-between sm:px-10 sm:pb-10">
                  <div>
                    <span
                      className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white"
                      style={{ backgroundColor: `${accent}E6` }}
                    >
                      {candidate.dependencia}
                    </span>
                    <h1 className="mt-2 text-[clamp(1.5rem,4.5vw,2.75rem)] font-bold leading-[1.05] text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]">
                      {candidate.nombre}
                    </h1>
                    <p className="mt-1 text-base text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)] sm:text-lg">
                      {cargoConFecha}
                    </p>
                  </div>

                  {variablesCultura.length > 0 && (
                    <div className="flex max-w-[280px] shrink-0 flex-col items-end gap-1.5 sm:max-w-[320px]">
                      <span className="text-right text-[0.65rem] font-semibold uppercase leading-tight tracking-wider text-white/80 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                        Variables impactadas en el Plan de Acción CO enero-junio
                      </span>
                      {variablesCultura.map((v) => (
                        <span
                          key={v}
                          className="inline-flex items-start gap-1.5 rounded-xl px-3 py-1.5 text-right text-[0.7rem] font-semibold leading-snug text-white shadow-[0_4px_14px_-4px_rgba(0,0,0,0.6)] backdrop-blur-sm"
                          style={{ backgroundColor: `${accent}E6` }}
                        >
                          <Award className="h-3 w-3 shrink-0 translate-y-0.5" />
                          {v}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {!hasDriveVideo && (
              <div className="mx-auto w-full max-w-3xl px-6 pt-5 sm:hidden">
                <span
                  className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white"
                  style={{ backgroundColor: `${accent}E6` }}
                >
                  {candidate.dependencia}
                </span>
                <h1 className="mt-2 text-2xl font-bold leading-tight text-foreground">{candidate.nombre}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{cargoConFecha}</p>

                {variablesCultura.length > 0 && (
                  <div className="mt-3">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-muted-foreground">
                      Variables impactadas en el Plan de Acción CO enero-junio
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {variablesCultura.map((v) => (
                        <span
                          key={v}
                          className="inline-flex max-w-full items-start gap-1.5 rounded-xl px-2.5 py-1.5 text-[0.7rem] font-semibold leading-snug text-white"
                          style={{ backgroundColor: `${accent}E6` }}
                        >
                          <Award className="h-3 w-3 shrink-0 translate-y-0.5" />
                          {v}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {hasDriveVideo && (
              <div className="mx-auto w-full max-w-3xl px-6 pt-6 sm:px-10">
                <span
                  className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: accent, backgroundColor: "var(--secondary)" }}
                >
                  {candidate.dependencia}
                </span>
                <h1 className="mt-1 text-3xl font-bold text-foreground sm:text-4xl">{candidate.nombre}</h1>
                <p className="mt-1 text-base text-muted-foreground">{cargoConFecha}</p>
              </div>
            )}

            <div className="relative">
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-60"
                style={{ background: `radial-gradient(60% 100% at 50% 0%, ${accent}14 0%, transparent 70%)` }}
              />
              <div className="relative mx-auto max-w-3xl px-6 pb-32 pt-8 sm:px-10 sm:pb-36 sm:pt-10">
                {candidate.descripcion && (
                  <section>
                    <h2
                      className="text-sm font-bold uppercase tracking-[0.1em] sm:text-base"
                      style={{ color: titleColor }}
                    >
                      Perfil Profesional
                    </h2>
                    <p className="mt-3 text-[1.05rem] leading-relaxed text-foreground">
                      {candidate.descripcion}
                    </p>
                  </section>
                )}

                {candidate.aportes && candidate.aportes.length > 0 && (
                  <section className="mt-8">
                    <h2
                      className="text-sm font-bold uppercase tracking-[0.1em] sm:text-base"
                      style={{ color: titleColor }}
                    >
                      Aportes a la Cultura de la Organización ({candidate.periodoAportes ?? PERIODO_DEFAULT})
                    </h2>
                    <ul className="mt-3 space-y-3">
                      {candidate.aportes.map((item, i) => (
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

                {candidate.trayectoria && candidate.trayectoria.length > 0 && (
                  <section className="mt-8">
                    <h2
                      className="text-sm font-bold uppercase tracking-[0.1em] sm:text-base"
                      style={{ color: titleColor }}
                    >
                      Trayectoria institucional
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
                      className="text-sm font-bold uppercase tracking-[0.1em] sm:text-base"
                      style={{ color: titleColor }}
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
          </div>

            {/*
              Botón de votar: cápsula simple con halo ambiental que respira
              suavemente (pulse muy sutil, no un shine que cruza una sola vez),
              degradado diagonal apenas perceptible y profundidad real por capas
              de sombra en vez de inset-highlights simulando plástico.
            */}
            <div className="pointer-events-none absolute inset-x-0 bottom-5 z-30 flex justify-center px-4 sm:bottom-7">
              {votingOpen ? (
                <motion.div
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.1 }}
                  className="pointer-events-auto relative"
                >
                  {/* Halo: glow radial detrás de la cápsula, respira lento y sutil */}
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
                      // Suelta el foco antes de que Radix marque este árbol
                      // como aria-hidden al abrir el diálogo — evita el
                      // warning de accesibilidad de foco retenido en
                      // elemento oculto.
                      e.currentTarget.blur();
                      setVoteOpen(true);
                    }}
                    className="group relative flex items-center gap-2.5 rounded-full py-3.5 pl-6 pr-7 text-sm font-semibold text-white transition-transform duration-200 active:scale-[0.97]"
                    style={{
                      background: `linear-gradient(135deg, ${accent} 0%, ${accentDark} 100%)`,
                      boxShadow: `0 8px 24px -6px ${accent}66, 0 2px 6px rgba(0,0,0,0.25)`,
                    }}
                  >
                    {/* Borde sutil: un anillo interior de 1px, no el marco blanco grueso anterior */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/25 transition group-hover:ring-white/40"
                    />
                    <Vote className="relative h-4 w-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                    <span className="relative whitespace-nowrap">
                      Votar por {candidate.nombre.split(" ")[0]}
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