import { CheckCircle2, Trophy } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ResultsBoard } from "./ResultsBoard";
import { useVoteResults } from "@/lib/use-vote-results";
import type { Candidate } from "@/lib/election";

interface Props {
  voteId: string;
  candidates: Candidate[];
  /** true si la elección permite ver el conteo en vivo (CONFIG.RESULTADOS_EN_VIVO). */
  showResults: boolean;
}

export function ThankYou({ voteId, candidates, showResults }: Props) {
  // Lista vacía = el hook no consulta nada cuando el panel no está habilitado.
  const { ranked, total, loading } = useVoteResults(showResults ? candidates : [], showResults ? 15000 : 0);

  return (
    <section className="animate-in fade-in zoom-in-95 duration-500">
      <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-elegant sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full gradient-accent text-accent-foreground shadow-lg">
          <CheckCircle2 className="h-9 w-9" strokeWidth={2.5} />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-foreground sm:text-3xl">¡Gracias por participar!</h2>
        <p className="mt-3 text-muted-foreground">
          Su voto ha sido registrado exitosamente. El voto es secreto: este comprobante no revela por quién votó.
        </p>
        <div className="mt-6 rounded-xl bg-secondary px-4 py-3 text-left text-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Comprobante de voto</p>
          <p className="mt-1 break-all font-mono text-xs text-foreground">{voteId}</p>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">Puede cerrar esta ventana.</p>
      </div>

      {showResults && (
        <div className="mx-auto mt-8 max-w-xl">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              <Trophy className="h-4 w-4 text-accent" /> Cómo va la votación
            </h3>
            <Link to="/resultados" className="text-xs font-medium text-accent hover:underline">
              Ver todos →
            </Link>
          </div>
          <div className="mt-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Cargando resultados…</p>
            ) : (
              <ResultsBoard ranked={ranked} total={total} compact />
            )}
          </div>
        </div>
      )}
    </section>
  );
}