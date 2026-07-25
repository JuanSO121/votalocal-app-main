import { useCallback, useEffect, useRef, useState } from "react";
import { candidates } from "./candidates";
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

const FALLBACK_COLOR = "#2f8f4e";

/**
 * Trae y ordena los resultados de votación de mayor a menor.
 * @param pollMs si es mayor a 0, vuelve a consultar cada `pollMs` ms
 *   (úselo en paneles "en vivo"; déjelo en 0 para una sola carga).
 */
export function useVoteResults(pollMs = 0): UseVoteResults {
  const [raw, setRaw] = useState<CandidateResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const idsRef = useRef(candidates.map((c) => c.id));

  const load = useCallback(async () => {
    const res = await fetchResults(idsRef.current);
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
  }, []);

  useEffect(() => {
    load();
    if (!pollMs) return;
    const interval = setInterval(load, pollMs);
    return () => clearInterval(interval);
  }, [load, pollMs]);

  const ranked: RankedCandidate[] = candidates
    .map((c) => {
      const votos = raw.find((r) => r.candidato_id === c.id)?.votos ?? 0;
      return {
        id: c.id,
        nombre: c.nombre,
        foto: c.foto,
        color: c.color ?? FALLBACK_COLOR,
        votos,
        porcentaje: total > 0 ? (votos / total) * 100 : 0,
      };
    })
    .sort((a, b) => b.votos - a.votos);

  return { ranked, total, loading, error, updatedAt, refresh: load };
}