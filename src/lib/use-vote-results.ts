import { useCallback, useEffect, useState } from "react";
import type { Candidate } from "./election";
import { fetchResults, type CandidateResult } from "./vote-api";

export interface RankedCandidate {
  id: string;
  nombre: string;
  foto: string;
  color: string;
  votos: number;
  porcentaje: number;
}

interface UseVoteResults {
  ranked: RankedCandidate[];
  total: number;
  loading: boolean;
  error: string | null;
  updatedAt: Date | null;
  refresh: () => void;
}

/**
 * Trae y ordena los resultados de mayor a menor.
 * @param candidates lista de candidatas (viene de useElection)
 * @param pollMs si es mayor a 0, vuelve a consultar cada `pollMs` ms.
 */
export function useVoteResults(candidates: Candidate[], pollMs = 0): UseVoteResults {
  const [raw, setRaw] = useState<CandidateResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const idsKey = candidates.map((c) => c.id).join("|");

  const load = useCallback(async () => {
    if (!idsKey) return;
    const res = await fetchResults(idsKey.split("|"));
    if (!res.ok) {
      setError(res.error ?? "No fue posible cargar los resultados.");
      setLoading(false);
      return;
    }
    setError(null);
    setRaw(res.resultados);
    setTotal(res.total);
    setUpdatedAt(new Date(res.actualizado));
    setLoading(false);
  }, [idsKey]);

  useEffect(() => {
    load();
    if (!pollMs) return;
    const i = setInterval(load, pollMs);
    return () => clearInterval(i);
  }, [load, pollMs]);

  const ranked: RankedCandidate[] = candidates
    .map((c) => {
      const votos = raw.find((r) => r.candidato_id === c.id)?.votos ?? 0;
      return {
        id: c.id,
        nombre: c.nombre,
        foto: c.foto,
        color: c.color,
        votos,
        porcentaje: total > 0 ? (votos / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.votos - a.votos);

  return { ranked, total, loading, error, updatedAt, refresh: load };
}