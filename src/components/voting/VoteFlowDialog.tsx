// components/voting/VoteFlowDialog.tsx
// Flujo: 1) datos de acceso → 2) confirmar voto → 3) envío → 4) éxito.
// La confirmación aparece DESPUÉS de ingresar usuaria y clave, no antes.
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

// "error" se muestra sobre el formulario de acceso para que la votante corrija sus datos.
type FlowStep = "login" | "confirm" | "submitting" | "success" | "error";

interface Props {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onVoteSubmit: (candidate: Candidate, voter: VoterFormValues) => Promise<VoteResult>;
  onVoted: () => void;
  labels: LoginLabels;
}

export function VoteFlowDialog({ candidate, open, onOpenChange, onVoteSubmit, onVoted, labels }: Props) {
  const [step, setStep] = useState<FlowStep>("login");
  const [errorMsg, setErrorMsg] = useState("");
  const [pending, setPending] = useState<VoterFormValues | null>(null);
  const accent = candidate?.color ?? "var(--accent)";

  const form = useForm<VoterFormValues>({
    resolver: zodResolver(voterSchema),
    defaultValues: { usuaria: "", clave: "" },
    mode: "onBlur",
  });

  const reset = () => {
    setStep("login");
    setErrorMsg("");
    setPending(null);
    form.reset({ usuaria: "", clave: "" });
  };

  const handleOpenChange = (next: boolean) => {
    // Durante el envío no se permite cerrar por click afuera / Escape (para no perder el voto a medias).
    if (step === "submitting") return;
    if (!next) reset();
    onOpenChange(next);
  };

  // Paso 1 → 2: los datos son válidos en forma; todavía NO se envía nada.
  const handleLoginSubmit = (values: VoterFormValues) => {
    setPending(values);
    setErrorMsg("");
    setStep("confirm");
  };

  // Paso 2 → 3: aquí sí se envía el voto.
  const handleConfirm = async () => {
    if (!candidate || !pending) return;
    setStep("submitting");
    const res = await onVoteSubmit(candidate, pending);
    if (!res.ok) {
      setErrorMsg(res.error ?? "No fue posible registrar su voto. Intente nuevamente.");
      setStep("error"); // vuelve al formulario con el mensaje; los campos conservan lo escrito
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

  const showConfirm = step === "confirm" || step === "submitting";
  const showLogin = step === "login" || step === "error";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* La tarjeta del candidato es un overlay fixed z-[100]; el Dialog de Radix usa z-50 → se fuerza por encima. */}
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0" style={{ zIndex: 200 }}>
        <AnimatePresence mode="wait" initial={false}>
          {showLogin ? (
            <motion.div key="login" {...anim} className="p-6 sm:p-8">
              <DialogHeader>
                <div
                  className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${accent}1f`, color: accent }}
                >
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <DialogTitle className="text-center text-xl">Ingrese sus datos</DialogTitle>
                <DialogDescription className="text-center">
                  Use el usuario y la clave que le fueron entregados para votar.
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
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {step === "error" && <p className="text-sm text-destructive">{errorMsg}</p>}

                  <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <Button type="button" variant="ghost" onClick={() => handleOpenChange(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" className="gap-2 text-white hover:brightness-105" style={{ backgroundColor: accent }}>
                      Continuar
                    </Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          ) : showConfirm ? (
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
                <Button variant="ghost" disabled={busy} onClick={() => setStep("login")}>
                  Atrás
                </Button>
                <Button
                  className="gap-2 text-white hover:brightness-105"
                  style={{ backgroundColor: accent }}
                  disabled={busy}
                  onClick={handleConfirm}
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
            </motion.div>
          ) : (
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
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}