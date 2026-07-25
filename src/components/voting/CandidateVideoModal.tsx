import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Loader2, Vote } from "lucide-react";
import type { Candidate } from "@/lib/candidates";
import { useVideoAspect } from "@/hooks/useVideoAspect";
import { AdaptiveMedia } from "../AdaptiveMedia";

interface Props {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isSelected: boolean;
  onSelect: () => void;
  submitting: boolean;
}

function isDirectVideo(url: string) {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
}

/** Detecta si un URL es un embed de YouTube o Vimeo. */
function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname === "youtu.be") {
      const id =
        u.hostname === "youtu.be" ? u.pathname.slice(1) : u.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1` : null;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function CandidateVideoModal({
  candidate,
  open,
  onOpenChange,
  isSelected,
  onSelect,
  submitting,
}: Props) {
  const isDirect = !!candidate && isDirectVideo(candidate.video);
  const aspect = useVideoAspect(candidate?.video, isDirect);

  if (!candidate) return null;
  const embedUrl = toEmbedUrl(candidate.video);

  // Para videos verticales usamos una caja más alta y angosta en vez del
  // aspect-video panorámico, para no desperdiciar espacio con barras
  // laterales enormes. Para horizontales o embeds, mantenemos aspect-video.
  const isPortrait = isDirect && aspect.loaded && aspect.orientation === "portrait";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl gap-0 overflow-hidden p-0">
        <div
          className={
            isPortrait
              ? "relative mx-auto aspect-[3/4] max-h-[70vh] w-full max-w-xs bg-black sm:max-w-sm"
              : "relative aspect-video w-full bg-black"
          }
        >
          {embedUrl ? (
            <iframe
              key={candidate.id}
              src={embedUrl}
              title={`Video de ${candidate.nombre}`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="h-full w-full"
            />
          ) : (
            <AdaptiveMedia
              key={candidate.id}
              kind="video"
              src={candidate.video}
              controls
              autoPlay
              playsInline
            />
          )}
        </div>
        <div className="p-6 sm:p-7">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl font-bold">{candidate.nombre}</DialogTitle>
            <DialogDescription className="text-sm">
              <span className="font-medium text-primary">{candidate.cargo}</span>
              <span className="mx-2 text-muted-foreground">·</span>
              <span className="text-muted-foreground">{candidate.dependencia}</span>
            </DialogDescription>
          </DialogHeader>
          {candidate.descripcion && (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {candidate.descripcion}
            </p>
          )}
          <DialogFooter className="mt-6 flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cerrar
            </Button>
            <Button
              size="lg"
              className="gap-2"
              onClick={onSelect}
              disabled={submitting}
              variant={isSelected ? "secondary" : "default"}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSelected ? (
                <>
                  <Check className="h-4 w-4" /> Seleccionado
                </>
              ) : (
                <>
                  <Vote className="h-4 w-4" /> Seleccionar este candidato
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}