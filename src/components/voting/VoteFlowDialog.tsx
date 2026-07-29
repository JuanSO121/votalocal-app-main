// components/voting/VoteFlowDialog.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, KeyRound, Loader2, Mail, ShieldCheck, Vote } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { voterSchema, type VoterFormValues } from "@/lib/vote-schema";
import type { Candidate } from "@/lib/candidates";

export interface VoteResult {
  ok: boolean;
  error?: string;
}

type FlowStep = "confirm" | "login" | "submitting" | "error";

interface Props {
  candidate: Candidate | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onVoteSubmit: (candidate: Candidate, voter: VoterFormValues) => Promise<VoteResult>;
  onVoted: () => void;
}

const FALLBACK_COLOR = "var(--accent)";

export function VoteFlowDialog({ candidate, open, onOpenChange, onVoteSubmit, onVoted }: Props) {
  const [step, setStep] = useState<FlowStep>("confirm");
  const [errorMsg, setErrorMsg] = useState("");
  const accent = candidate?.color ?? FALLBACK_COLOR;

  const form = useForm<VoterFormValues>({
    resolver: zodResolver(voterSchema),
    defaultValues: { correo: "", documento: "" },
    mode: "onBlur",
  });

  const reset = () => {
    setStep("confirm");
    setErrorMsg("");
    form.reset({ correo: "", documento: "" });
  };

  const handleOpenChange = (next: boolean) => {
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
    onVoted();
  };

  if (!candidate) return null;
  const busy = step === "submitting";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/*
        IMPORTANTE: CandidateProfile es un overlay fixed con z-[100].
        El Dialog de shadcn/Radix se monta en un Portal aparte con z-50 por
        defecto, así que sin forzar un z-index mayor aquí, este modal queda
        TAPADO detrás del perfil — se abre (el estado cambia) pero no se ve
        ni se puede interactuar con él. El estilo inline siempre gana sobre
        cualquier clase de Tailwind, así que es la forma más segura de
        garantizar que quede por encima sin tocar ui/dialog.tsx.
      */}
      <DialogContent
        className="max-w-md gap-0 overflow-hidden p-0"
        style={{ zIndex: 200 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          {step === "confirm" ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="p-6 sm:p-8"
            >
              <DialogHeader>
                <div
                  className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${accent}1f`, color: accent }}
                >
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <DialogTitle className="text-center text-xl">Confirme su voto</DialogTitle>
                <DialogDescription className="text-center">
                  Está a punto de votar por{" "}
                  <span className="font-semibold text-foreground">{candidate.nombre}</span>.
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
          ) : (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="p-6 sm:p-8"
            >
              <DialogHeader>
                <div
                  className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${accent}1f`, color: accent }}
                >
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <DialogTitle className="text-center text-xl">Confirme su identidad</DialogTitle>
                <DialogDescription className="text-center">
                  Use su correo registrado y su cédula para registrar el voto por{" "}
                  <span className="font-semibold text-foreground">{candidate.nombre}</span>.
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleLoginSubmit)}
                  className="mt-6 grid gap-4"
                  noValidate
                >
                  <FormField
                    control={form.control}
                    name="correo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" /> Correo institucional
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="nombre@valledelcauca.gov.co"
                            autoComplete="email"
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
                    name="documento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <KeyRound className="h-3.5 w-3.5" /> Cédula
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            inputMode="numeric"
                            placeholder="Su número de cédula"
                            autoComplete="current-password"
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