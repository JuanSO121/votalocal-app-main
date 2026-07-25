import { z } from "zod";

/**
 * Validación del formulario de acceso del votante.
 * Se redujo a solo correo + documento (la cédula actúa como "contraseña").
 * Debe replicarse también en el Apps Script para defensa en profundidad.
 */
export const voterSchema = z.object({
  correo: z
    .string()
    .trim()
    .email("Correo electrónico inválido")
    .max(160, "Correo demasiado largo"),
  documento: z
    .string()
    .trim()
    .min(5, "Cédula inválida")
    .max(20, "Cédula inválida")
    .regex(/^[0-9]+$/, "Solo se permiten números"),
});

export type VoterFormValues = z.infer<typeof voterSchema>;

/** Sanitiza cadenas eliminando caracteres de control antes de enviar. */
export function sanitize(v: string): string {
  return v.replace(/[\u0000-\u001F\u007F]/g, "").trim();
}