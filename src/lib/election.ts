/**
 * Configuración de la elección: viene del backend (Apps Script, ?action=config).
 * Para una votación nueva solo se cambian las pestañas del Sheet; el front no se toca.
 */
import { useEffect, useState } from "react";
import { APPS_SCRIPT_URL } from "./vote-api";

export const BLANCO_ID = "VOTO-BLANCO";

/** Paleta para el confetti y valores de respaldo. */
export const PALETA = ["#e07a35", "#1f6fb2", "#2f8f4e", "#12958a", "#e3b23c", "#8a5fb0", "#d1453b", "#0f766e"];

export interface Candidate {
  id: string;
  nombre: string;
  municipio: string;
  frase: string;
  propuesta: string;
  foto: string;
  color: string;
}

export interface Election {
  titulo: string;
  subtitulo: string;
  entidad: string;
  inicio: string; // ISO
  fin: string; // ISO
  esperaRevelarMin: number;
  resultadosEnVivo: boolean;
  etiquetaUsuario: string;
  etiquetaClave: string;
}

export interface ElectionConfig {
  eleccion: Election;
  candidatas: Candidate[];
}

/**
 * Foto genérica: silueta blanca sobre el color de la candidata. Es un data URI,
 * así funciona en <img> y en background-image sin tocar ningún componente.
 */
export function fotoPlaceholder(color: string): string {
  // Busto compacto en la parte alta: deja libre la zona inferior donde va el texto de la tarjeta.
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 400">` +
    `<rect width="300" height="400" fill="${color}"/>` +
    `<circle cx="150" cy="128" r="46" fill="white" opacity="0.9"/>` +
    `<path d="M58 300C58 232 98 192 150 192S242 232 242 300Z" fill="white" opacity="0.9"/>` +
    `</svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function demoElection(): ElectionConfig {
  const now = Date.now();
  const mk = (i: number, nombre: string, municipio: string): Candidate => ({
    id: `C-0${i}`,
    nombre,
    municipio,
    frase: "Frase de presentación de ejemplo.",
    propuesta: "Propuesta de ejemplo.",
    foto: "",
    color: PALETA[i % PALETA.length],
  });
  return {
    eleccion: {
      titulo: "Elección de ejemplo",
      subtitulo: "Modo demostración",
      entidad: "Gobernación del Valle del Cauca",
      inicio: new Date(now - 3600_000).toISOString(),
      fin: new Date(now + 86400_000).toISOString(),
      esperaRevelarMin: 0,
      resultadosEnVivo: true,
      etiquetaUsuario: "Usuaria",
      etiquetaClave: "Clave de ingreso",
    },
    candidatas: [mk(1, "Candidata Uno", "Cali"), mk(2, "Candidata Dos", "Tuluá"), mk(3, "Candidata Tres", "Palmira")],
  };
}

export async function fetchElection(): Promise<ElectionConfig> {
  let raw: ElectionConfig;
  if (APPS_SCRIPT_URL) {
    const res = await fetch(`${APPS_SCRIPT_URL}?action=config`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error ?? "No fue posible cargar la votación.");
    if (!data.eleccion || !Array.isArray(data.candidatas)) {
      throw new Error(
        "La URL del backend responde, pero no es la de esta votación (falta la configuración). Revise VITE_APPS_SCRIPT_URL."
      );
    }
    raw = { eleccion: data.eleccion, candidatas: data.candidatas };
  } else {
    raw = demoElection();
  }
  return {
    eleccion: raw.eleccion,
    candidatas: raw.candidatas.map((c) => ({
      ...c,
      frase: limpiarFrase(c.frase),
      foto: c.foto || fotoPlaceholder(c.color),
    })),
  };
}

// ── Caché del lado del navegador (stale-while-revalidate) ──
// La primera visita espera al servidor; las siguientes pintan al instante lo guardado
// y actualizan en segundo plano. Se lee en un efecto (no en el render) para no romper la hidratación SSR.
const STORAGE_KEY = "votacion:config:v1";

function readStored(): ElectionConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ElectionConfig) : null;
  } catch {
    return null;
  }
}

function writeStored(cfg: ElectionConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    /* almacenamiento bloqueado: se ignora */
  }
}

let memory: ElectionConfig | null = null;

export function useElection() {
  const [data, setData] = useState<ElectionConfig | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const inicial = memory ?? readStored();
    if (inicial) setData(inicial);

    fetchElection()
      .then((d) => {
        memory = d;
        writeStored(d);
        if (alive) setData(d);
      })
      .catch((e) => {
        // Si ya hay datos guardados se sigue mostrando eso en vez de un error.
        if (alive && !inicial) setError(e instanceof Error ? e.message : "Error al cargar la votación.");
      });
    return () => {
      alive = false;
    };
  }, []);

  return { data, error, loading: !data && !error };
}

/**
 * Limpia la frase que viene del Excel: quita comillas envolventes y,
 * si está TODA en mayúsculas, la pasa a minúscula con la primera letra en mayúscula.
 */
export function limpiarFrase(texto: string): string {
  let t = (texto ?? "").trim().replace(/^[“"«'‘]+|[”"»'’]+$/g, "").trim();
  const letras = t.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, "");
  if (letras.length > 8 && letras === letras.toUpperCase()) {
    t = t.toLowerCase();
    t = t.charAt(0).toUpperCase() + t.slice(1);
  }
  return t;
}