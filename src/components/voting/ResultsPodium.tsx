import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import type { RankedCandidate } from "@/lib/use-vote-results";

interface Props {
  top3: RankedCandidate[];
}

// Orden visual: 2º a la izquierda, 1º al centro (más alto), 3º a la derecha.
const visualOrder = [1, 0, 2];
const barHeights = ["h-24 sm:h-32", "h-36 sm:h-48", "h-16 sm:h-24"];

export function ResultsPodium({ top3 }: Props) {
  if (top3.length === 0 || top3.every((c) => c.votos === 0)) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        Aún no hay votos suficientes para mostrar el podio.
      </p>
    );
  }

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6">
      {visualOrder.map((idx, pos) => {
        const c = top3[idx];
        if (!c) return <div key={pos} className="w-20 sm:w-28" />;
        const isFirst = idx === 0;
        return (
          <div key={c.id} className="flex w-20 flex-col items-center sm:w-28">
            <div className="relative mb-2">
              {isFirst && (
                <motion.div
                  initial={{ y: -8, opacity: 0, scale: 0.6 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.25 }}
                  className="absolute -top-6 left-1/2 -translate-x-1/2"
                >
                  <Crown className="h-6 w-6 drop-shadow" style={{ color: c.color }} fill="currentColor" />
                </motion.div>
              )}
              <img
                src={c.foto}
                alt={c.nombre}
                className={`rounded-full border-4 object-cover shadow-lg ${
                  isFirst ? "h-16 w-16 sm:h-20 sm:w-20" : "h-12 w-12 sm:h-16 sm:w-16"
                }`}
                style={{ borderColor: c.color }}
              />
            </div>
            <p className="line-clamp-1 text-center text-xs font-semibold text-foreground sm:text-sm">
              {c.nombre.split(" ")[0]} {c.nombre.split(" ")[1] ?? ""}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {c.votos} {c.votos === 1 ? "voto" : "votos"}
            </p>
            <motion.div
              className={`mt-2 w-full rounded-t-2xl ${barHeights[pos]}`}
              style={{ backgroundColor: c.color, transformOrigin: "bottom" }}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ duration: 0.5, delay: pos * 0.1, ease: "easeOut" }}
            />
          </div>
        );
      })}
    </div>
  );
}