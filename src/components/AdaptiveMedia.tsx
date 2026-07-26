import { forwardRef } from "react";

interface AdaptiveMediaProps {
  kind: "video" | "image";
  src: string;
  poster?: string;
  alt?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  controls?: boolean;
  className?: string;
  darken?: boolean;
  // Agregados para que CandidateProfile pueda sincronizar un ícono de
  // play/pause con el estado real del <video> principal (el que tiene
  // el ref) cuando se togglea por tap. Antes no existían en esta
  // interfaz, así que se perdían silenciosamente al no hacer spread
  // de props extra sobre el <video>.
  onPlay?: () => void;
  onPause?: () => void;
}

/**
 * Contenedor "sin recorte": el video/foto se muestra completo
 * (object-contain) sobre un fondo del mismo contenido, escalado y
 * difuminado, que llena el espacio sobrante. Funciona igual de bien
 * para videos horizontales, verticales o cuadrados sin necesidad de
 * saber de antemano cuál es cuál.
 */
export const AdaptiveMedia = forwardRef<HTMLVideoElement, AdaptiveMediaProps>(
  (
    {
      kind,
      src,
      poster,
      alt,
      autoPlay,
      loop,
      muted,
      playsInline,
      controls,
      className,
      darken = true,
      onPlay,
      onPause,
    },
    ref
  ) => {
    return (
      <div className={`relative h-full w-full overflow-hidden bg-black ${className ?? ""}`}>
        {/* Fondo difuminado — rellena, nunca es el contenido principal */}
        {kind === "video" ? (
          <video
            src={src}
            poster={poster}
            autoPlay
            loop
            muted
            playsInline
            aria-hidden="true"
            tabIndex={-1}
            className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
          />
        ) : (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 scale-110 bg-cover bg-center blur-2xl"
            style={{ backgroundImage: `url(${src})` }}
          />
        )}
        {darken && <div className="pointer-events-none absolute inset-0 bg-black/35" />}

        {/* Contenido principal — completo, nunca recortado */}
        {kind === "video" ? (
          <video
            ref={ref}
            src={src}
            poster={poster}
            autoPlay={autoPlay}
            loop={loop}
            muted={muted}
            playsInline={playsInline}
            controls={controls}
            onPlay={onPlay}
            onPause={onPause}
            className="relative h-full w-full object-contain"
          />
        ) : (
          <img
            src={src}
            alt={alt}
            loading="lazy"
            className="relative h-full w-full object-contain"
          />
        )}
      </div>
    );
  }
);
AdaptiveMedia.displayName = "AdaptiveMedia";