import { CheckCircle2, Trophy } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { ResultsBoard } from "./ResultsBoard";
import { useVoteResults } from "@/lib/use-vote-results";
import { SHOW_LIVE_RESULTS } from "@/lib/results-config";

interface Props {
  voteId: string;
  candidateName: string;
}

export function ThankYou({ voteId, candidateName }: Props) {
  // Solo se consulta si el panel está habilitado (ver results-config.ts).
  const { ranked, total, loading } = useVoteResults(SHOW_LIVE_RESULTS ? 15000 : 0);

  return (
    <section className="animate-in fade-in zoom-in-95 duration-500">
      <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-8 text-center shadow-elegant sm:p-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full gradient-accent text-accent-foreground shadow-lg">
          <CheckCircle2 className="h-9 w-9" strokeWidth={2.5} />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-foreground sm:text-3xl">
          ¡Gracias por participar!
        </h2>
        <p className="mt-3 text-muted-foreground">
          Su voto por{" "}
          <span className="font-semibold text-foreground">{candidateName}</span> ha sido
          registrado exitosamente como evidencia oficial del proceso.
        </p>
        <div className="mt-6 rounded-xl bg-secondary px-4 py-3 text-left text-sm">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Comprobante de voto
          </p>
          <p className="mt-1 font-mono text-xs text-foreground break-all">{voteId}</p>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Puede cerrar esta ventana. Gracias por reconocer la excelencia en el servicio público.
        </p>
      </div>

      {SHOW_LIVE_RESULTS && (
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