// routes/index.tsx — VotingPage (adaptable: todo viene de useElection)
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Footer, Header } from "@/components/voting/Header";
import { CandidateGrid } from "@/components/voting/CandidateGrid";
import { ThankYou } from "@/components/voting/ThankYou";
import { CountdownTimer } from "@/components/voting/CountdownTimer";
import type { Candidate } from "@/lib/election";
import { useElection } from "@/lib/election";
import { sanitize, type VoterFormValues } from "@/lib/vote-schema";
import { generateVoteId, submitVote } from "@/lib/vote-api";
import { hasVoted, markVoted } from "@/lib/vote-guard";
import { buildWindow } from "@/lib/voting-window";
import { useResultsReveal } from "@/lib/use-results-reveal";
import type { VoteResult } from "@/components/voting/VoteFlowDialog";

export const Route = createFileRoute("/")({
  component: VotingPage,
});

function VotingPage() {
  const { data, error, loading } = useElection();
  const eleccion = data?.eleccion;
  const candidatas = data?.candidatas ?? [];

  const win = useMemo(() => (eleccion ? buildWindow(eleccion) : null), [eleccion]);
  const { phase, revealed } = useResultsReveal(win);
  const votingOpen = phase === "open";
  const closedMessage = phase === "before" ? "La votación aún no ha iniciado" : "La votación ha finalizado";

  const [result, setResult] = useState<{ voteId: string } | null>(null);
  // Se muestra el "gracias" solo cuando la votante pulsa "Continuar" en el diálogo de éxito.
  const [showThanks, setShowThanks] = useState(false);

  const handleVoteSubmit = async (candidate: Candidate, voter: VoterFormValues): Promise<VoteResult> => {
    const usuaria = sanitize(voter.usuaria).toLowerCase();

    // Salvaguarda de UX en este navegador; la fuente de verdad es el Apps Script.
    if (hasVoted(usuaria)) {
      return { ok: false, error: "Esta usuaria ya registró un voto. El voto es único e inmodificable." };
    }

    const voteId = generateVoteId();
    const res = await submitVote({
      id: voteId,
      usuaria,
      clave: sanitize(voter.clave),
      candidata_id: candidate.id,
    });
    if (!res.ok) {
      return { ok: false, error: res.error ?? "No fue posible registrar su voto. Intente nuevamente." };
    }

    markVoted(usuaria, res.id ?? voteId);
    setResult({ voteId: res.id ?? voteId });
    return { ok: true };
  };

  const header = <Header entidad={eleccion?.entidad} showResults={!!eleccion && (eleccion.resultadosEnVivo || revealed)} />;

  if (loading || error || !eleccion || !win) {
    return (
      <div className="voting-shell flex h-dvh flex-col overflow-hidden">
        {header}
        <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-4 text-center">
          <p className={`text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}>
            {error ?? "Cargando votación…"}
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  const thanks = result && showThanks;

  return (
    <div className="voting-shell flex h-dvh flex-col overflow-hidden">
      {header}

      <main
        className={`mx-auto w-full max-w-6xl min-h-0 flex-1 px-4 py-4 sm:px-6 sm:py-6 ${
          thanks ? "overflow-y-auto" : "overflow-hidden"
        }`}
      >
        <div className="h-full min-h-0">
          {thanks ? (
            <ThankYou voteId={result.voteId} candidates={candidatas} showResults={eleccion.resultadosEnVivo} />
          ) : (
            <div className="flex h-full min-h-0 flex-col">
              <div className="shrink-0 text-center sm:text-left">
                <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {eleccion.subtitulo}
                    </p>
                    <h1 className="mt-1 text-[clamp(1.25rem,3.2vw,2.25rem)] font-bold text-foreground">
                      {eleccion.titulo}
                    </h1>
                  </div>
                  {phase !== "closed" && (
                    <CountdownTimer
                      target={phase === "before" ? win.start : win.end}
                      label={phase === "before" ? "Inicia en" : "Cierra en"}
                    />
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Toque una tarjeta para ver el perfil{votingOpen ? " y votar" : ""}.
                </p>
              </div>

              <div className="mt-6 min-h-0 flex-1">
                <CandidateGrid
                  candidates={candidatas}
                  labels={{ usuario: eleccion.etiquetaUsuario, clave: eleccion.etiquetaClave }}
                  votingOpen={votingOpen}
                  closedMessage={closedMessage}
                  onVoteSubmit={handleVoteSubmit}
                  onVoteDone={() => setShowThanks(true)}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer entidad={eleccion.entidad} />
    </div>
  );
}