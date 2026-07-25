// components/voting/CandidateGrid.tsx
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, PlayCircle } from "lucide-react";
import { candidates, type Candidate } from "@/lib/candidates";
import type { VoterFormValues } from "@/lib/vote-schema";
import { CandidateProfile } from "./CandidateProfile";
import type { VoteResult } from "./VoteFlowDialog";

interface Props {
  votingOpen: boolean;
  closedMessage: string;
  onVoteSubmit: (candidate: Candidate, voter: VoterFormValues) => Promise<VoteResult>;
}

const FALLBACK_COLOR = "var(--accent)";

function circularOffset(from: number, to: number, n: number): number {
  let diff = (to - from) % n;
  if (diff > n / 2) diff -= n;
  if (diff < -n / 2) diff += n;
  return diff;
}

export function CandidateGrid({ votingOpen, closedMessage, onVoteSubmit }: Props) {
  const [centerIndex, setCenterIndex] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const n = candidates.length;
  const openCandidate = candidates.find((c) => c.id === openId) ?? null;

  const goTo = (i: number) => setCenterIndex(((i % n) + n) % n);
  const prev = () => goTo(centerIndex - 1);
  const next = () => goTo(centerIndex + 1);

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-4">
      {/*
        Antes: height: clamp(380px, 68vw, 460px) — usaba VW (ancho), que no
        tiene relación con cuánta altura real hay disponible en pantallas
        altas y angostas (móviles). El piso de 380px además era demasiado
        alto para viewports bajos, provocando que la tarjeta (aspect 3/4,
        centrada con position:absolute) se renderizara más alta que su caja
        y se montara visualmente sobre el texto de arriba.

        Ahora: se usa DVH (alto real disponible) con un piso más bajo y un
        techo razonable, así el carrusel siempre cabe en el espacio real
        que le da su contenedor flex, sin importar el ancho del teléfono.
      */}
      <div
        className="relative mx-auto w-full max-w-5xl"
        style={{ height: "clamp(240px, 44dvh, 460px)" }}
      >
        <button
          type="button"
          onClick={prev}
          aria-label="Candidato anterior"
          className="glass-pill absolute left-0 top-1/2 z-40 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white transition hover:bg-white/15 sm:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {candidates.map((candidate, i) => {
          const offset = circularOffset(centerIndex, i, n);
          const isCenter = offset === 0;
          const visible = Math.abs(offset) <= 1;

          return (
            <CarouselCard
              key={candidate.id}
              candidate={candidate}
              offset={offset}
              isCenter={isCenter}
              visible={visible}
              onOpen={() => (isCenter ? setOpenId(candidate.id) : goTo(i))}
            />
          );
        })}

        <button
          type="button"
          onClick={next}
          aria-label="Siguiente candidato"
          className="glass-pill absolute right-0 top-1/2 z-40 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white transition hover:bg-white/15 sm:flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={prev}
          aria-label="Candidato anterior"
          className="glass-pill flex h-10 w-10 items-center justify-center rounded-full text-white sm:hidden"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {candidates.map((c, i) => (
          <button
            key={c.id}
            type="button"
            aria-label={`Ver a ${c.nombre}`}
            onClick={() => goTo(i)}
            className="h-2 rounded-full transition-all"
            style={{
              width: i === centerIndex ? "1.5rem" : "0.5rem",
              backgroundColor: i === centerIndex ? (c.color ?? FALLBACK_COLOR) : "rgba(15, 23, 42, 0.15)",
            }}
          />
        ))}
        <button
          type="button"
          onClick={next}
          aria-label="Siguiente candidato"
          className="glass-pill flex h-10 w-10 items-center justify-center rounded-full text-white sm:hidden"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <CandidateProfile
        candidate={openCandidate}
        onClose={() => setOpenId(null)}
        onVoteSubmit={onVoteSubmit}
        votingOpen={votingOpen}
        closedMessage={closedMessage}
      />
    </div>
  );
}

function CarouselCard({
  candidate,
  offset,
  isCenter,
  visible,
  onOpen,
}: {
  candidate: Candidate;
  offset: number;
  isCenter: boolean;
  visible: boolean;
  onOpen: () => void;
}) {
  const accent = candidate.color ?? FALLBACK_COLOR;

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={false}
      animate={{
        x: `calc(-50% + ${offset * 78}%)`,
        y: "-50%",
        scale: isCenter ? 1 : 0.74,
        opacity: visible ? (isCenter ? 1 : 0.45) : 0,
        filter: isCenter ? "blur(0px)" : "blur(3px)",
      }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      style={{ zIndex: isCenter ? 30 : 10 - Math.abs(offset) }}
      aria-label={isCenter ? `Ver perfil de ${candidate.nombre}` : `Centrar en ${candidate.nombre}`}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className="absolute left-1/2 top-1/2 h-full text-left focus-visible:outline-none"
    >
      {/*
        Antes: w-[68vw] max-w-[280px] con aspect-[3/4] → el ANCHO era
        variable (según viewport) y la ALTURA se derivaba de ese ancho.
        Eso es lo contrario de lo que necesitamos: ahora que el contenedor
        tiene una altura fija y segura (arriba), la tarjeta debe medir
        h-full y derivar su propio ANCHO desde esa altura con aspect-[3/4].
        Así nunca puede desbordar verticalmente su caja.
      */}
      <div className="relative h-full aspect-[3/4] overflow-hidden rounded-[2rem] border border-black/5 bg-secondary shadow-[0_30px_70px_-20px_rgba(15,23,42,0.35)]">
        <img
          src={candidate.foto}
          alt={`Fotografía de ${candidate.nombre}`}
          className="h-full w-full object-cover object-top"
          loading="lazy"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `linear-gradient(to top, ${accent}F0 0%, ${accent}33 42%, transparent 72%)` }}
        />
        <div className="absolute inset-x-0 bottom-0 flex flex-col p-4 text-white sm:p-5">
          <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-white/75">
            {candidate.dependencia}
          </p>
          <h3 className="mt-1.5 line-clamp-2 text-base font-bold leading-tight sm:text-lg">
            {candidate.nombre}
          </h3>
          <p className="mt-1 truncate text-xs text-white/85 sm:text-sm">{candidate.cargo}</p>
          {isCenter && (
            <span
              className="mt-2.5 inline-flex w-fit items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-sm sm:mt-3 sm:px-4 sm:py-2"
              style={{ backgroundColor: `${accent}CC` }}
            >
              <PlayCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Ver perfil
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}