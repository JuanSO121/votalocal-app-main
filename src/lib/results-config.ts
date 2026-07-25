/**
 * Interruptor único para el panel de resultados en vivo.
 *
 * Ponerlo en `false` oculta el mini-leaderboard en la pantalla de
 * agradecimiento, el enlace "Resultados" del header, y hace que la ruta
 * /resultados redirija (ver resultados.tsx) — útil si prefiere revelar
 * los resultados solo al cerrar la votación, para evitar efecto de
 * arrastre (bandwagon) mientras la gente sigue votando.
 */
export const SHOW_LIVE_RESULTS = true;