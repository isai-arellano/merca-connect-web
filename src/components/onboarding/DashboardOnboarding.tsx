"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ChevronRight, Smartphone, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { type OnboardingState } from "@/lib/onboarding";

const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 280, damping: 22 } },
};

interface DashboardOnboardingProps {
  onboarding: OnboardingState;
  catalogLabel: string;
}

export function DashboardOnboarding({ onboarding, catalogLabel }: DashboardOnboardingProps) {
  const step1Done = onboarding.canStartWhatsApp;
  const step2Done = onboarding.hasWhatsApp;

  const stepsComplete = useMemo(
    () => [step1Done, step2Done].filter(Boolean).length,
    [step1Done, step2Done],
  );
  const progress = Math.round((stepsComplete / 2) * 100);

  return (
    <motion.div variants={itemVariants}>
      <Card className="rounded-2xl shadow-sm border-border/60">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Configura tu negocio
              </CardTitle>
              <CardDescription className="mt-0.5 text-sm">
                {stepsComplete} de 2 pasos — datos del negocio y conexión WhatsApp
              </CardDescription>
            </div>
            <Badge
              variant="outline"
              className="border-brand-spring/30 text-brand-forest font-semibold tabular-nums bg-brand-mint/80"
            >
              {progress}%
            </Badge>
          </div>
          <div className="mt-3 h-1.5 w-full rounded-full bg-border overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-brand-spring"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Paso 1 — Datos del negocio (Configuración → Negocio) */}
          <section
            className="rounded-xl border border-border/60 p-3 bg-background"
            aria-labelledby="onboarding-step-business"
          >
            <div className="flex items-start gap-3">
              {step1Done ? (
                <CheckCircle2 className="h-5 w-5 text-brand-spring shrink-0 mt-0.5" aria-hidden />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" aria-hidden />
              )}
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
                <div>
                  <h3 id="onboarding-step-business" className="text-sm font-medium text-foreground">
                    1. Datos del negocio
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Tipo de negocio, nombre y horario de atención en Configuración.
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-brand-forest/30 text-brand-forest"
                  asChild
                >
                  <Link href="/dashboard/settings?tab=negocio">
                    <Building2 className="h-3.5 w-3.5 mr-1" />
                    {step1Done ? "Revisar" : "Completar"}
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* Paso 2 — WhatsApp */}
          <section
            className="rounded-xl border border-border/60 p-3 bg-background transition-opacity"
            style={{ opacity: step1Done ? 1 : 0.55 }}
            aria-labelledby="onboarding-step-wa"
          >
            <div className="flex items-start gap-3">
              {step2Done ? (
                <CheckCircle2 className="h-5 w-5 text-brand-spring shrink-0 mt-0.5" aria-hidden />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" aria-hidden />
              )}
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
                <div>
                  <h3 id="onboarding-step-wa" className="text-sm font-medium text-foreground">
                    2. WhatsApp Business
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {!step1Done
                      ? "Completa primero nombre, tipo de negocio y horario en Configuración → Negocio."
                      : "Vincula tu número para inbox y pedidos."}
                  </p>
                </div>
                <div className="flex flex-col items-stretch sm:items-end gap-1">
                  {step2Done ? (
                    <span className="text-xs text-brand-forest font-medium">Conectado</span>
                  ) : step1Done ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-brand-forest/30 text-brand-forest"
                      asChild
                    >
                      <Link href="/dashboard/settings?tab=conectar">
                        <Smartphone className="h-3.5 w-3.5 mr-1" />
                        Conectar
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  ) : (
                    <Button type="button" size="sm" variant="outline" disabled className="opacity-60">
                      <Smartphone className="h-3.5 w-3.5 mr-1" />
                      Conectar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <p className="text-[11px] text-muted-foreground px-1">
            Tu {catalogLabel.toLowerCase()} público, URL y logo los configuras en{" "}
            <Link href="/dashboard/products" className="text-brand-forest font-medium hover:underline">
              {catalogLabel}
            </Link>{" "}
            cuando quieras.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
