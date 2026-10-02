import { z } from "zod";

/**
 * Acceso de la votante: usuaria + clave aleatoria que le entrega en persona
 * quien coordina el reparto (ej. "K7M2-QX9P"). El backend ignora guiones,
 * espacios y mayúsculas/minúsculas, así que aquí solo se valida la forma.
 */
export const voterSchema = z.object({
  usuaria: z
    .string()
    .trim()
    .min(3, "Usuario inválido")
    .max(30, "Usuario inválido")
    .regex(/^[a-zA-Z0-9._-]+$/, "Usuario inválido"),
  clave: z.string().trim().min(6, "Clave inválida").max(20, "Clave inválida"),
});

export type VoterFormValues = z.infer<typeof voterSchema>;

/** Sanitiza cadenas eliminando caracteres de control antes de enviar. */
export function sanitize(v: string): string {
  return v.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}