import { useEffect, useState } from "react";

export interface VideoAspect {
  ratio: number; // ancho / alto
  orientation: "landscape" | "portrait" | "square";
  loaded: boolean;
}

const DEFAULT_ASPECT: VideoAspect = { ratio: 16 / 9, orientation: "landscape", loaded: false };
const cache = new Map<string, VideoAspect>();

/**
 * Detecta la orientación real de un video (mp4/webm/ogg) leyendo sus
 * metadatos, sin necesidad de que el candidato o el editor de datos
 * declare manualmente si es horizontal o vertical.
 * No aplica a embeds de YouTube/Vimeo (no exponen esta info sin una
 * llamada extra a su API oEmbed).
 */
export function useVideoAspect(src: string | undefined, isDirectVideo: boolean): VideoAspect {
  const [aspect, setAspect] = useState<VideoAspect>(
    () => (src && cache.get(src)) || DEFAULT_ASPECT
  );

  useEffect(() => {
    if (!src || !isDirectVideo) {
      setAspect(DEFAULT_ASPECT);
      return;
    }
    const cached = cache.get(src);
    if (cached) {
      setAspect(cached);
      return;
    }

    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = src;

    const onLoaded = () => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      if (!w || !h) return;
      const ratio = w / h;
      const orientation: VideoAspect["orientation"] =
        ratio > 1.08 ? "landscape" : ratio < 0.92 ? "portrait" : "square";
      const value = { ratio, orientation, loaded: true };
      cache.set(src, value);
      setAspect(value);
    };

    video.addEventListener("loadedmetadata", onLoaded);
    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.src = "";
    };
  }, [src, isDirectVideo]);

  return aspect;
}