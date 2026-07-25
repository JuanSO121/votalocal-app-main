import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Footer, Header } from "@/components/voting/Header";
import { CandidateGrid } from "@/components/voting/CandidateGrid";
import { ThankYou } from "@/components/voting/ThankYou";
import { CountdownTimer } from "@/components/voting/CountdownTimer";
import type { Candidate } from "@/lib/candidates";
import { sanitize, type VoterFormValues } from "@/lib/vote-schema";
import { generateVoteId, submitVote } from "@/lib/vote-api";
import { hasVoted, markVoted } from "@/lib/vote-guard";
import { getVotingPhase, VOTING_START, VOTING_END } from "@/lib/voting-window";
import type { VoteResult } from "@/components/voting/VoteFlowDialog";

export const Route = createFileRoute("/")({
  component: VotingPage,
});

function VotingPage() {
  const [result, setResult] = useState<{ voteId: string; candidateName: string } | null>(null);

  const phase = getVotingPhase();
  const votingOpen = phase === "open";
  const closedMessage =
    phase === "before" ? "La votación aún no ha iniciado" : "La votación ha finalizado";

  const handleVoteSubmit = async (
    candidate: Candidate,
    voter: VoterFormValues
  ): Promise<VoteResult> => {
    const prev = hasVoted(voter.documento);
    if (prev) {
      return {
        ok: false,
        error: "Este documento ya registró un voto. El voto es único e inmodificable.",
      };
    }

    const voteId = generateVoteId();
    const payload = {
      id: voteId,
      fecha_hora: new Date().toISOString(),
      nombre: sanitize(voter.correo),
      documento: sanitize(voter.documento),
      correo: sanitize(voter.correo),
      dependencia: "",
      candidato_id: candidate.id,
      candidato_nombre: candidate.nombre,
    };

    const res = await submitVote(payload);
    if (!res.ok) {
      return { ok: false, error: res.error ?? "No fue posible registrar su voto. Intente nuevamente." };
    }

    markVoted(payload.documento, res.id ?? voteId);
    setResult({ voteId: res.id ?? voteId, candidateName: candidate.nombre });
    return { ok: true };
  };

  return (
    <div className="voting-shell flex h-screen flex-col overflow-hidden">
      <Header />

      <main
        className={`mx-auto w-full max-w-6xl flex-1 min-h-0 px-4 py-4 sm:px-6 sm:py-6 ${
          result ? "overflow-y-auto" : "overflow-hidden"
        }`}
      >
        <div className="h-full min-h-0">
          {result ? (
            <ThankYou voteId={result.voteId} candidateName={result.candidateName} />
          ) : (
            <div className="flex h-full min-h-0 flex-col">
              <div className="shrink-0 text-center sm:text-left">
                <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
                      Secretaría General · Cultura Organizacional
                    </p>
                    <h1 className="mt-1 text-[clamp(1.5rem,3.5vw,2.25rem)] font-bold text-white">
                      Mejor Servidor Público
                    </h1>
                  </div>
                  {phase !== "closed" && (
                    <CountdownTimer
                      target={phase === "before" ? VOTING_START : VOTING_END}
                      label={phase === "before" ? "Inicia en" : "Cierra en"}
                    />
                  )}
                </div>
                <p className="mt-2 text-sm text-white/70">
                  Toque una tarjeta para conocer al candidato{votingOpen ? " y votar" : ""}.
                </p>
              </div>

              <div className="mt-6 min-h-0 flex-1">
                <CandidateGrid
                  votingOpen={votingOpen}
                  closedMessage={closedMessage}
                  onVoteSubmit={handleVoteSubmit}
                />
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
} 