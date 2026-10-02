// components/voting/VoteFlowDialog.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, KeyRound, Loader2, ShieldCheck, User, Vote } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { voterSchema, type VoterFormValues } from "@/lib/vote-schema";
import { BLANCO_ID, type Candidate } from "@/lib/election";

export interface VoteResult {
  ok: boolean;
  error?: string;
}

/** Etiquetas del formulario de acceso (vienen de CONFIG en el Sheet). */
export interface LoginLabels {
  usuario: string;
  clave: string;
}

type FlowStep = "confirm" | "login" | "submitting" | "success" | "error";

interface Props {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onVoteSubmit: (candidate: Candidate, voter: VoterFormValues) => Promise<VoteResult>;
  onVoted: () => void;
  labels: LoginLabels;
}

export function VoteFlowDialog({ candidate, open, onOpenChange, onVoteSubmit, onVoted, labels }: Props) {
  const [step, setStep] = useState<FlowStep>("confirm");
  const [errorMsg, setErrorMsg] = useState("");
  const accent = candidate?.color ?? "var(--accent)";

  const form = useForm<VoterFormValues>({
    resolver: zodResolver(voterSchema),
    defaultValues: { usuaria: "", clave: "" },
    mode: "onBlur",
  });

  const reset = () => {
    setStep("confirm");
    setErrorMsg("");
    form.reset({ usuaria: "", clave: "" });
  };

  const handleOpenChange = (next: boolean) => {
    // Durante el envío no se permite cerrar por click afuera / Escape (para no perder el voto a medias).
    if (step === "submitting") return;
    if (!next) reset();
    onOpenChange(next);
  };

  const handleLoginSubmit = async (values: VoterFormValues) => {
    if (!candidate) return;
    setStep("submitting");
    const res = await onVoteSubmit(candidate, values);
    if (!res.ok) {
      setErrorMsg(res.error ?? "No fue posible registrar su voto. Intente nuevamente.");
      setStep("error");
      return;
    }
    setStep("success");
  };

  const handleDone = () => {
    reset();
    onVoted();
  };

  if (!candidate) return null;
  const busy = step === "submitting";
  const esBlanco = candidate.id === BLANCO_ID;
  const destino = esBlanco ? "el voto en blanco" : candidate.nombre;

  const anim = {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -16 },
    transition: { duration: 0.2, ease: "easeOut" as const },
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* El perfil es un overlay fixed z-[100]; el Dialog de Radix usa z-50 → se fuerza por encima. */}
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0" style={{ zIndex: 200 }}>
        <AnimatePresence mode="wait" initial={false}>
          {step === "confirm" ? (
            <motion.div key="confirm" {...anim} className="p-6 sm:p-8">
              <DialogHeader>
                <div
                  className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${accent}1f`, color: accent }}
                >
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <DialogTitle className="text-center text-xl">Confirme su voto</DialogTitle>
                <DialogDescription className="text-center">
                  Está a punto de votar por <span className="font-semibold text-foreground">{destino}</span>.
                  <br />
                  Una vez enviado, <span className="font-semibold">no podrá modificarse</span>.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
                <Button variant="ghost" onClick={() => handleOpenChange(false)}>
                  Revisar
                </Button>
                <Button
                  className="gap-2 text-white hover:brightness-105"
                  style={{ backgroundColor: accent }}
                  onClick={() => setStep("login")}
                >
                  Confirmar y continuar
                </Button>
              </div>
            </motion.div>
          ) : step === "success" ? (
            <motion.div key="success" {...anim} className="p-6 text-center sm:p-8">
              <div
                className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: `${accent}1f`, color: accent }}
              >
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <DialogTitle className="text-xl">¡Voto registrado!</DialogTitle>
              <DialogDescription className="mt-2">Gracias por participar.</DialogDescription>
              <Button
                className="mt-6 gap-2 text-white hover:brightness-105"
                style={{ backgroundColor: accent }}
                onClick={handleDone}
              >
                Continuar
              </Button>
            </motion.div>
          ) : (
            <motion.div key="login" {...anim} className="p-6 sm:p-8">
              <DialogHeader>
                <div
                  className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${accent}1f`, color: accent }}
                >
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <DialogTitle className="text-center text-xl">Confirme su identidad</DialogTitle>
                <DialogDescription className="text-center">
                  Ingrese el usuario y la clave que le fueron entregados para registrar su voto.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleLoginSubmit)} className="mt-6 grid gap-4" noValidate>
                  <FormField
                    control={form.control}
                    name="usuaria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5" /> {labels.usuario}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="usuaria0001"
                            autoComplete="username"
                            autoCapitalize="none"
                            spellCheck={false}
                            disabled={busy}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="clave"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <KeyRound className="h-3.5 w-3.5" /> {labels.clave}
                        </FormLabel>
                        <FormControl>
                          {/* type=text + mayúsculas: la clave es de un solo uso y es más fácil de digitar en el celular */}
                          <Input
                            type="text"
                            placeholder="XXXX-XXXX"
                            autoComplete="off"
                            autoCapitalize="characters"
                            spellCheck={false}
                            className="font-mono uppercase tracking-wider"
                            disabled={busy}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {step === "error" && <p className="text-sm text-destructive">{errorMsg}</p>}

                  <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <Button type="button" variant="ghost" disabled={busy} onClick={() => setStep("confirm")}>
                      Atrás
                    </Button>
                    <Button
                      type="submit"
                      className="gap-2 text-white hover:brightness-105"
                      style={{ backgroundColor: accent }}
                      disabled={busy}
                    >
                      {busy ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Registrando…
                        </>
                      ) : (
                        <>
                          <Vote className="h-4 w-4" /> Confirmar voto
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}