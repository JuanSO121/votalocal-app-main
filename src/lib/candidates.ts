/**
 * Listado de candidatos al reconocimiento "Mejor Servidor Público".
 *
 * FOTOS Y VIDEOS
 * ─────────────────────────────────────────────────────────────
 * Los archivos viven en la carpeta `public/` del proyecto:
 *   public/img/NombreArchivo.jpg      →  se referencia como "/img/NombreArchivo.jpg"
 *   public/videos/NombreArchivo.mp4   →  se referencia como "/videos/NombreArchivo.mp4"
 * Vite/TanStack Start sirve todo lo que está en `public/` directo desde la
 * raíz del sitio, así que la ruta siempre empieza con "/" (sin "public").
 */
export interface Candidate {
  id: string;
  nombre: string;
  cargo: string;
  /** Fecha de ingreso a la entidad, mostrada junto al cargo (ej: "enero de 2019"). */
  fechaIngreso?: string;
  dependencia: string;
  foto: string; // URL o ruta local bajo /public
  /**
   * URL o ruta del video de presentación.
   * - Archivo .mp4/.webm/.ogg (local o remoto) → autoplay + loop + silenciado,
   *   con el efecto de fondo desenfocado tipo Instagram.
   * - Enlace de archivo de Google Drive → se muestra el visor de Drive
   *   embebido (requiere clic, sin loop, sin efecto de fondo).
   * - Cadena vacía "" → el candidato no tiene video (solo se muestra la foto).
   */
  video: string;
  /** Perfil profesional (primer párrafo), mostrado en el perfil expandido. */
  descripcion?: string;
  /** Aportes a la cultura de la organización en el periodo evaluado, en lista. */
  aportes?: string[];
  /** Periodo que cubren los aportes. Por defecto: "enero – junio de 2026". */
  periodoAportes?: string;
  /**
   * Variables de Cultura de la Organización (según el Plan de Acción CO 2026 /
   * MIPG) a las que este candidato le apuntó en general durante el periodo.
   * No se asocia una variable a un aporte puntual (un mismo aporte puede
   * tocar varias), así que esta lista es a nivel de candidato y se muestra
   * como medallas sobre el hero.
   */
  variablesCultura?: string[];
  /** Hitos de trayectoria institucional, mostrados como lista en el perfil expandido. */
  trayectoria?: string[];
  /** Reconocimientos previos, mostrados como lista en el perfil expandido. */
  reconocimientos?: string[];
  /**
   * Color representativo del candidato (hex), tomado de la paleta del
   * abanico institucional ("paraíso de todos"). Si se omite, se usa el
   * accent verde institucional por defecto.
   */
  color?: string;
}

/**
 * Convierte un enlace `drive.google.com/open?id=` o `/file/d/ID/view` en una
 * URL de imagen hotlinkeable. Ya no se usa para los candidatos actuales
 * (ahora sirven sus fotos localmente desde /public/img), pero queda
 * disponible por si un futuro candidato solo tiene su foto en Drive.
 */
const driveThumb = (fileId: string) => `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
void driveThumb; // evita advertencia de "no usado" mientras no haga falta

/**
 * Paleta tomada del abanico de colores del logo institucional
 * ("paraíso de todos"). Quedan verde y rojo disponibles para los
 * próximos candidatos que se sumen a esta convocatoria.
 */
export const CANDIDATE_PALETTE = {
  verde: "#2f8f4e", // disponible
  teal: "#12958a",
  dorado: "#e3b23c",
  naranja: "#e07a35",
  rojo: "#d1453b", // disponible
  azul: "#1f6fb2",
  morado: "#8a5fb0", // disponible
} as const;

const PERIODO_DEFAULT = "enero – junio de 2026";

export const candidates: Candidate[] = [
  {
    id: "SG-2026-01",
    nombre: "Jhoan Sebastián Tabares Ospina",
    cargo: "Profesional Universitario",
    fechaIngreso: "8 de enero de 2025",
    dependencia: "Participación Ciudadana y Rendición de Cuentas",
    foto: "/img/Jhoan_Sebastian_Tabares.jpg",
    video: "/videos/Jhoan_Sebastian_Tabares.mp4",
    color: CANDIDATE_PALETTE.teal,
    descripcion:
      "Politólogo, especialista en Gerencia Social, con diplomados en enfoques diferenciales, resolución de conflictos y construcción de paz territorial. Habla portugués como segunda lengua y se destaca por su liderazgo, respeto y compromiso con el servicio público.",
    periodoAportes: PERIODO_DEFAULT,
    variablesCultura: [
      "Planeación y decisión",
      "Relación entre procesos",
      "Eficacia",
      "Servicio de entrega a clientes internos y externos",
      "Comunicación",
    ],
    aportes: [
      "Formuló, acompañó y dio seguimiento al Plan de Acción de la Política de Participación Ciudadana con 23 dependencias y las 10 oficinas territoriales.",
      "Brindó acompañamiento a alcaldías y concejos municipales en temas de participación ciudadana.",
      "Impulsó el avance de los Nodos Territoriales de Rendición de Cuentas.",
      "Contribuyó a alcanzar 100 puntos en el reporte FURAG para la Política de Participación Ciudadana.",
    ],
    trayectoria: [
      "Integra el equipo de Participación Ciudadana y Rendición de Cuentas de la Secretaría General.",
      "Contribuyó al fortalecimiento del Índice de Desempeño Institucional (IDI) de la política, alcanzando una calificación de 100 puntos.",
      "Articuló la recopilación de información y evidencias con las dependencias de la Gobernación para la planeación y ejecución de los Nodos Territoriales de Rendición de Cuentas.",
    ],
  },
  {
    id: "SG-2026-02",
    nombre: "Arnol Cosme Aragón",
    cargo: "Auxiliar Administrativo",
    fechaIngreso: "5 de agosto de 2025",
    dependencia: "Atención al Ciudadano",
    foto: "/img/Arnol-Cosme-Aragon.jpeg",
    // Aún no hay un archivo de video individual para este candidato.
    video: "",
    color: CANDIDATE_PALETTE.naranja,
    descripcion:
      "Administrador Público y Tecnólogo en Sistemas de Información, con experiencia en gestión pública, fortalecimiento institucional y articulación interinstitucional. Se destacó por su capacidad de gestión, organización de procesos y orientación al mejoramiento continuo del servicio al ciudadano.",
    periodoAportes: PERIODO_DEFAULT,
    variablesCultura: ["Relación entre procesos", "Servicio de entrega a clientes internos y externos"],
    aportes: [
      "Apoyó la gestión y movilización de las felicitaciones registradas en el Módulo de Atención de la Secretaría General, fortaleciendo el reconocimiento a la calidad del servicio al ciudadano.",
      "Acompañó la organización del Módulo de Atención mediante la implementación de la metodología 5S, contribuyendo al orden, la estandarización y optimización de los espacios de trabajo.",
      "Impulsó la creación del Semáforo de PQRSDF como herramienta para el seguimiento oportuno de peticiones, la toma de decisiones y la mejora continua del proceso.",
      "Contribuyó al fortalecimiento de la eficiencia institucional y la orientación al ciudadano.",
    ],
    trayectoria: [
      "Ha desarrollado actividades orientadas a la gestión administrativa, seguimiento de procesos y fortalecimiento de la atención al ciudadano.",
      "Cuenta con experiencia en acompañamiento técnico a proyectos y procesos institucionales enfocados en la generación de impacto social.",
      "Recibió reconocimientos como el Premio de Buenas Prácticas de Buen Gobierno 2020 de la Gobernación del Cauca y Mejor Servidor Público DAF – Presidencia 2021 de la Alcaldía Municipal.",
    ],
  },
  {
    id: "SG-2026-03",
    nombre: "Carlos Neirón Puentes Rojas",
    cargo: "Líder de Programa",
    fechaIngreso: "1 de junio de 2021",
    dependencia: "Gestión Documental",
    foto: "/img/Carlos_Neiron_Puentes_Rojas.jpeg",
    video: "/videos/Carlos_Neiron_Puentes_Rojas.mp4",
    color: CANDIDATE_PALETTE.azul,
    descripcion:
      "Profesional en Ciencias de la Información y la Documentación, Bibliotecología, Archivística y Documentación de la Universidad del Quindío, con tarjeta profesional No. 754 del Ministerio de Educación Nacional y tarjeta profesional No. 168 del Colegio Colombiano de Archivistas. Cuenta con una sólida formación académica: es especialista en Sistemas de Información y Gerencia de Documentos de la Universidad de La Salle y máster en Archivística de la Universidad Carlos III de Madrid (España), título convalidado por el Ministerio de Educación Nacional mediante la Resolución No. 055 de enero de 2020.",
    periodoAportes: PERIODO_DEFAULT,
    variablesCultura: ["Estructura y sistemas"],
    aportes: [
      "Convalidación de la cuarta versión de las Tablas de Retención Documental de la Gobernación del Valle del Cauca; actualmente en proceso la convalidación de la quinta versión.",
      "Convalidación de las Tablas de Valoración Documental de la Gobernación del Valle del Cauca.",
      "Participación, como líder y supervisor, en el proyecto de desarrollo e implementación del Sistema de Gestión de Documentos Electrónicos de Archivo (SGDEA) de la Gobernación del Valle del Cauca.",
      "Reconocimiento por parte del Archivo General de la Nación a su trayectoria archivística.",
      "Desarrollo del proyecto de reconstrucción de expedientes, que el Archivo General de la Nación busca vincular a su observatorio como buena práctica archivística de nivel nacional.",
    ],
    trayectoria: [
      "Líder del Programa de Gestión Documental en la Gobernación del Valle del Cauca.",
      "Secretario Técnico del Consejo Departamental de Archivos del Valle del Cauca.",
      "Representante de los Consejos Territoriales de Archivos ante el Consejo Directivo del Archivo General de la Nación (hasta marzo de 2026).",
      "Integrante del comité técnico de gestión documental del Archivo General de la Nación.",
    ],
  },
];