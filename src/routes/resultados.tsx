// routes/resultados.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { Lock, RefreshCw } from "lucide-react";
import { Footer, Header } from "@/components/voting/Header";

import { useVoteResults } from "@/lib/use-vote-results";

import { SHOW_LIVE_RESULTS } from "@/lib/results-config";
import { ResultsPodium } from "@/components/voting/ResultsPodium";
import { ResultsBoard } from "@/components/voting/ResultsBoard";
import { useResultsReveal } from "@/lib/use-results-reveal";
import { ResultsRevealCountdown } from "@/components/voting/ResultsRevealCountdown";
import { WinnerAnnouncement } from "@/components/voting/WinnerAnnouncement";

export const Route = createFileRoute("/resultados")({
  component: ResultsPage,
});

function ResultsPage() {
  const { phase, revealed, countdown } = useResultsReveal();
  const isClosed = phase === "closed";

  // Una vez la votación cerró Y ya se reveló al ganador, los números son
  // finales — no tiene sentido seguir haciendo polling cada 8s contra el
  // Apps Script. Antes de eso (votación abierta, o cerrada pero en la
  // ventana de suspenso) sí se sigue consultando en vivo.
  const { ranked, total, loading, error, updatedAt, refresh } = useVoteResults(
    isClosed && revealed ? 0 : 8000
  );
  const top3 = ranked.slice(0, 3);

  if (!SHOW_LIVE_RESULTS) {
    return (
      <div className="voting-shell flex min-h-screen flex-col">
        <Header />
        <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center px-4 py-16 text-center">
          <h1 className="text-xl font-bold text-foreground">Resultados no disponibles</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Los resultados se publicarán una vez cierre el proceso de votación.
          </p>
          <Link to="/" className="mt-6 text-sm font-medium text-accent hover:underline">
            ← Volver al inicio
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  // Mientras la votación cerró pero aún no pasa la espera configurada
  // (RESULTS_REVEAL_DELAY_MINUTES), se muestra el suspenso en vez del
  // podio/tablero — así nadie ve el ganador antes de tiempo.
  const showCountdown = isClosed && !revealed;
  const showWinner = isClosed && revealed;

  return (
    <div className="voting-shell flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {isClosed ? "Resultados" : "Resultados en vivo"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {total} {total === 1 ? "voto registrado" : "votos registrados"}
            </p>
          </div>
          {isClosed ? (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
              <Lock className="h-3 w-3" />
              Votación cerrada
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
              En vivo
            </span>
          )}
        </div>

        {error ? (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : showCountdown ? (
          <div className="mt-8">
            <ResultsRevealCountdown countdown={countdown} />
          </div>
        ) : (
          <>
            {showWinner && (
              <div className="mt-8">
                <WinnerAnnouncement ranked={ranked} total={total} />
              </div>
            )}

            <div
              className={`rounded-3xl border border-border bg-card p-6 shadow-card sm:p-10 ${
                showWinner ? "mt-0" : "mt-8"
              }`}
            >
              <ResultsPodium top3={top3} />
            </div>

            <div className="mt-6">
              <ResultsBoard ranked={ranked} total={total} />
            </div>
          </>
        )}

        {!showCountdown && (
          <div className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {updatedAt
                ? `Actualizado ${updatedAt.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`
                : loading
                  ? "Cargando…"
                  : ""}
            </span>
            {!(isClosed && revealed) && (
              <button
                type="button"
                onClick={refresh}
                className="inline-flex items-center gap-1.5 font-medium text-foreground transition hover:underline"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Actualizar
              </button>
            )}
          </div>
        )}

        <div className="mt-8">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline">
            ← Volver al inicio
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}