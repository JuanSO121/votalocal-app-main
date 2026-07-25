import { motion } from "framer-motion";
import { Crown } from "lucide-react";
import type { RankedCandidate } from "@/lib/use-vote-results";

interface Props {
  ranked: RankedCandidate[];
  total: number;
  /** Modo compacto: solo top 3, sin el indicador de ventaja. Úselo en ThankYou. */
  compact?: boolean;
}

export function ResultsBoard({ ranked, total, compact = false }: Props) {
  const list = compact ? ranked.slice(0, 3) : ranked;
  const topVotes = ranked[0]?.votos ?? 0;
  const leaders = topVotes > 0 ? ranked.filter((c) => c.votos === topVotes) : [];
  const runnerUp = ranked.find((c) => c.votos < topVotes);
  const gap = runnerUp ? topVotes - runnerUp.votos : null;
  const isTie = leaders.length > 1;

  return (
    <div className="w-full">
      {!compact && leaders.length === 1 && gap !== null && gap > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-center gap-1.5 text-sm text-muted-foreground">
          <span className="font-semibold" style={{ color: leaders[0].color }}>
            {leaders[0].nombre.split(" ").slice(0, 2).join(" ")}
          </span>
          <span>va ganando por</span>
          <span className="font-semibold text-foreground">
            {gap} {gap === 1 ? "voto" : "votos"}
          </span>
        </div>
      )}
      {!compact && isTie && (
        <div className="mb-4 text-center text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">Empate en el primer puesto</span> entre{" "}
          {leaders.map((l) => l.nombre.split(" ")[0]).join(" y ")}
        </div>
      )}

      <ul className="flex flex-col gap-3">
        {list.map((c, i) => {
          const isLeader = c.votos === topVotes && topVotes > 0;
          return (
            <li key={c.id}>
              <div
                className="relative overflow-hidden rounded-2xl border bg-card p-4 shadow-card transition-all duration-300"
                style={{
                  borderColor: isLeader ? c.color : undefined,
                  boxShadow: isLeader ? `0 8px 28px -10px ${c.color}55` : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={c.foto}
                      alt={c.nombre}
                      className="h-11 w-11 rounded-full border-2 object-cover"
                      style={{ borderColor: c.color }}
                    />
                    {isLeader && (
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className="absolute -right-1.5 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow"
                      >
                        <Crown className="h-3.5 w-3.5" style={{ color: c.color }} fill="currentColor" />
                      </motion.div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {i + 1}. {c.nombre}
                      </p>
                      <span className="shrink-0 font-mono text-xs text-muted-foreground">
                        {c.votos} · {c.porcentaje.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: c.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(c.porcentaje, c.votos > 0 ? 3 : 0)}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {total === 0 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Aún no hay votos registrados. ¡Sea el primero!
        </p>
      )}
    </div>
  );
}