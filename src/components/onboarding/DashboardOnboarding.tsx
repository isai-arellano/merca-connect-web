"use client";

import { useState, useTransition, useMemo, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type LucideIcon, CheckCircle2, Circle, ChevronRight, Smartphone, Building2, MapPin, Store, ShoppingBag, Package, UtensilsCrossed, Wrench, Monitor, Bike, ArrowLeftRight, Coffee, Scissors, Stethoscope, PawPrint, BookOpen, Sofa, Globe, BarChart2, ShoppingCart, Pill, Laptop, PlayCircle, GraduationCap, ChefHat, Wifi } from "lucide-react";
import { motion } from "framer-motion";
import { type OnboardingState, type OnboardingSettingsLike } from "@/lib/onboarding";
import { useIndustries } from "@/hooks/useIndustries";

/** Ícono por slug de industria (de BD). Fallback: ícono de categoría padre. */
const INDUSTRY_SLUG_ICON: Record<string, LucideIcon> = {
  restaurante:   UtensilsCrossed,
  cafeteria:     Coffee,
  comida_rapida: ChefHat,
  taqueria:      ChefHat,
  pasteleria:    Coffee,
  dark_kitchen:  ChefHat,
  abarrotera:    ShoppingCart,
  ferreteria:    Wrench,
  farmacia:      Pill,
  tienda_ropa:   ShoppingBag,
  papeleria:     BookOpen,
  mascotas:      PawPrint,
  muebles:       Sofa,
  tienda_online: Package,
  servicios:     Wrench,
  consultoria:   BarChart2,
  belleza:       Scissors,
  veterinaria:   PawPrint,
  medico:        Stethoscope,
  tienda_digital: Globe,
  cursos:        GraduationCap,
  software:      Laptop,
  contenido:     PlayCircle,
  isp:           Wifi,
};

const CATEGORY_FALLBACK_ICON: Record<string, LucideIcon> = {
  restaurant:      UtensilsCrossed,
  physical_store:  Store,
  online_store:    Package,
  field_service:   Wrench,
  digital_service: Monitor,
};

function resolveIndustryIcon(slug: string, businessCategory?: string): LucideIcon {
  return INDUSTRY_SLUG_ICON[slug]
    ?? (businessCategory ? CATEGORY_FALLBACK_ICON[businessCategory] : undefined)
    ?? Store;
}
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api";
import { mutate } from "swr";

const BUSINESS_CATEGORIES: Array<{
  value: string;
  label: string;
  Icon: LucideIcon;
  description: string;
}> = [
  { value: "physical_store",  Icon: Store,           label: "Tienda física",                    description: "Vendes productos en local con entrega o pickup" },
  { value: "restaurant",      Icon: UtensilsCrossed, label: "Comida y bebidas",                  description: "Restaurantes, cafeterías, taquerías, dark kitchens" },
  { value: "online_store",    Icon: Package,         label: "Tienda en línea",                  description: "Ventas con envío a todo el país o paquetería" },
  { value: "field_service",   Icon: Wrench,          label: "Servicio a domicilio",             description: "Instalaciones, visitas técnicas, servicios en sitio" },
  { value: "digital_service", Icon: Monitor,         label: "Producto o servicio digital",      description: "Cursos, software, consultoría — sin entrega física" },
];

const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 280, damping: 22 } },
};

interface DashboardOnboardingProps {
  onboarding: OnboardingState;
  settings: OnboardingSettingsLike;
  catalogLabel: string;
}

export function DashboardOnboarding({ onboarding, settings, catalogLabel }: DashboardOnboardingProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(
    settings.business_category ?? "",
  );
  const [selectedIndustry, setSelectedIndustry] = useState<string>(
    settings.type ?? "",
  );
  const [selectedDeliveryMode, setSelectedDeliveryMode] = useState<string>(
    settings.delivery_mode ?? "",
  );
  const [deliveryZone, setDeliveryZone] = useState<string>(
    (settings.config as Record<string, unknown> & { delivery_zone?: string })?.delivery_zone ?? "",
  );
  const [isPending, startTransition] = useTransition();
  const [isIndustryPending, startIndustryTransition] = useTransition();
  const [isDeliveryPending, startDeliveryTransition] = useTransition();

  const { orderedRows: apiIndustries } = useIndustries();

  const category = selectedCategory as string;
  const isDigitalService = category === "digital_service";
  const isOnlineStore = category === "online_store";
  const isPhysicalOrRestaurant = category === "physical_store" || category === "online_store" || category === "restaurant";
  const isFieldService = category === "field_service";

  // Opciones de industria filtradas por categoría — vienen de la API (BD), no hardcodeadas
  const industryOptions = useMemo(() => {
    if (!category || !apiIndustries?.length) return [];
    return apiIndustries
      .filter((row) => row.business_category === category && row.is_active && row.is_selectable !== false)
      .map((row) => ({ slug: row.slug, label: row.label, business_category: row.business_category }));
  }, [category, apiIndustries]);

  // Limpiar industria si la categoría cambia y la industria ya no aplica
  useEffect(() => {
    if (!category || !selectedIndustry) return;
    const stillValid = industryOptions.some((i) => i.slug === selectedIndustry);
    if (!stillValid) {
      setSelectedIndustry("");
    }
  }, [category, industryOptions, selectedIndustry]);

  const showDeliveryStep = Boolean(category) && !isDigitalService;

  // Pasos: categoría, industria, datos, (entrega), whatsapp
  const totalSteps = isDigitalService ? 4 : 5;

  const step0Done = onboarding.hasCategory || Boolean(selectedCategory);
  const step1Done = step0Done && (onboarding.hasIndustry || Boolean(selectedIndustry));
  const step2Done = onboarding.hasBusinessProfile && step1Done;
  const step3Done = onboarding.hasDeliveryConfig || Boolean(selectedDeliveryMode);
  const step4Done = onboarding.hasWhatsApp;

  const stepsComplete = useMemo(() => {
    if (isDigitalService) {
      return [step0Done, step1Done, step2Done, step4Done].filter(Boolean).length;
    }
    return [step0Done, step1Done, step2Done, step3Done, step4Done].filter(Boolean).length;
  }, [isDigitalService, step0Done, step1Done, step2Done, step3Done, step4Done]);

  const progress = Math.round((stepsComplete / totalSteps) * 100);

  // Auto-advance online_store: set delivery_mode = "shipping" automatically when step2 is done
  useEffect(() => {
    if (isOnlineStore && step2Done && !step3Done && !isDeliveryPending) {
      startDeliveryTransition(async () => {
        try {
          await apiClient.patch(endpoints.business.settings, { delivery_mode: "shipping" });
          setSelectedDeliveryMode("shipping");
          await mutate(endpoints.business.settings);
        } catch {
          // silencioso
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnlineStore, step2Done, step3Done]);

  async function handleCategorySelect(value: string) {
    if (isPending) return;
    setSelectedCategory(value);
    startTransition(async () => {
      try {
        await apiClient.patch(endpoints.business.settings, { business_category: value });
        await mutate(endpoints.business.settings);
      } catch {
        setSelectedCategory(settings.business_category ?? "");
      }
    });
  }

  async function handleIndustrySelect(slug: string) {
    if (isIndustryPending) return;
    setSelectedIndustry(slug);
    startIndustryTransition(async () => {
      try {
        await apiClient.patch(endpoints.business.settings, { type: slug });
        await mutate(endpoints.business.settings);
      } catch {
        setSelectedIndustry(settings.type ?? "");
      }
    });
  }

  async function handleDeliverySelect(mode: string, zone?: string) {
    if (isDeliveryPending) return;
    setSelectedDeliveryMode(mode);
    startDeliveryTransition(async () => {
      try {
        const payload: Record<string, unknown> = { delivery_mode: mode };
        if (zone !== undefined) {
          payload.config = { delivery_zone: zone };
        }
        await apiClient.patch(endpoints.business.settings, payload);
        await mutate(endpoints.business.settings);
      } catch {
        setSelectedDeliveryMode(settings.delivery_mode ?? "");
      }
    });
  }

  async function handleDeliveryZoneSave() {
    if (isDeliveryPending || !selectedDeliveryMode) return;
    startDeliveryTransition(async () => {
      try {
        await apiClient.patch(endpoints.business.settings, {
          delivery_mode: selectedDeliveryMode,
          config: { delivery_zone: deliveryZone },
        });
        await mutate(endpoints.business.settings);
      } catch {
        // silencioso
      }
    });
  }

  const whatsAppStepNumber = isDigitalService ? "4." : "5.";
  const canStartWhatsApp = onboarding.canStartWhatsApp || (step2Done && (isDigitalService || step3Done));

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
                {stepsComplete} de {totalSteps} pasos — tipo, industria, datos
                {showDeliveryStep ? ", entrega" : ""} y WhatsApp
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

          {/* Paso 0 — Tipo de negocio (business_category) */}
          <section
            className="rounded-xl border border-border/60 p-3 bg-background"
            aria-labelledby="onboarding-step-category"
          >
            <div className="flex items-start gap-3 mb-3">
              {step0Done ? (
                <CheckCircle2 className="h-5 w-5 text-brand-spring shrink-0 mt-0.5" aria-hidden />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" aria-hidden />
              )}
              <div>
                <h3 id="onboarding-step-category" className="text-sm font-medium text-foreground">
                  1. ¿Cómo vende tu negocio?
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step0Done
                    ? "Categoría guardada."
                    : "Elige la categoría que mejor describe tu negocio."}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {BUSINESS_CATEGORIES.map(({ value, label, Icon, description }) => {
                const isActive = selectedCategory === value;
                return (
                  <button
                    key={value}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleCategorySelect(value)}
                    className={[
                      "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      "disabled:opacity-60 disabled:cursor-not-allowed",
                      isActive
                        ? "border-brand-spring bg-brand-mint/40 ring-2 ring-brand-spring"
                        : "border-border/60 bg-background hover:border-brand-spring/50 hover:bg-brand-mint/20",
                    ].join(" ")}
                  >
                    <Icon className={["h-6 w-6 mt-0.5", isActive ? "text-brand-forest" : "text-muted-foreground"].join(" ")} aria-hidden />
                    <span className="text-sm font-medium text-foreground leading-tight mt-1">
                      {label}
                    </span>
                    <span className="text-xs text-muted-foreground leading-snug">
                      {description}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Paso 1 — Industria / giro específico (type) — dinámico por categoría */}
          <section
            className="rounded-xl border border-border/60 p-3 bg-background transition-opacity"
            style={{ opacity: step0Done ? 1 : 0.55 }}
            aria-labelledby="onboarding-step-industry"
          >
            <div className="flex items-start gap-3 mb-3">
              {step1Done ? (
                <CheckCircle2 className="h-5 w-5 text-brand-spring shrink-0 mt-0.5" aria-hidden />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" aria-hidden />
              )}
              <div>
                <h3 id="onboarding-step-industry" className="text-sm font-medium text-foreground">
                  2. ¿Qué tipo de negocio tienes?
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {!step0Done
                    ? "Primero elige cómo vendes arriba."
                    : step1Done
                      ? "Industria guardada."
                      : "Elige el giro específico para personalizar tu experiencia."}
                </p>
              </div>
            </div>
            {step0Done && industryOptions.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {industryOptions.map(({ slug, label, business_category: bc }) => {
                  const isActive = selectedIndustry === slug;
                  const IconComp = resolveIndustryIcon(slug, bc);
                  return (
                    <button
                      key={slug}
                      type="button"
                      disabled={isIndustryPending}
                      onClick={() => handleIndustrySelect(slug)}
                      className={[
                        "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "disabled:opacity-60 disabled:cursor-not-allowed",
                        isActive
                          ? "border-brand-spring bg-brand-mint/40 ring-2 ring-brand-spring"
                          : "border-border/60 bg-background hover:border-brand-spring/50 hover:bg-brand-mint/20",
                      ].join(" ")}
                    >
                      <IconComp className={["h-4 w-4 shrink-0", isActive ? "text-brand-forest" : "text-muted-foreground"].join(" ")} aria-hidden />
                      <span className="text-xs font-medium text-foreground leading-tight">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Paso 2 — Datos del negocio */}
          <section
            className="rounded-xl border border-border/60 p-3 bg-background transition-opacity"
            style={{ opacity: step1Done ? 1 : 0.55 }}
            aria-labelledby="onboarding-step-business"
          >
            <div className="flex items-start gap-3">
              {step2Done ? (
                <CheckCircle2 className="h-5 w-5 text-brand-spring shrink-0 mt-0.5" aria-hidden />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" aria-hidden />
              )}
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
                <div>
                  <h3 id="onboarding-step-business" className="text-sm font-medium text-foreground">
                    3. Datos del negocio
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {!step1Done
                      ? "Elige primero el tipo de negocio e industria."
                      : "Agrega el nombre de tu negocio en Configuración."}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="shrink-0 border-brand-forest/30 text-brand-forest"
                  disabled={!step1Done}
                  asChild={step1Done}
                >
                  {step1Done ? (
                    <Link href="/dashboard/settings?tab=negocio">
                      <Building2 className="h-3.5 w-3.5 mr-1" />
                      {step2Done ? "Revisar" : "Completar"}
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  ) : (
                    <>
                      <Building2 className="h-3.5 w-3.5 mr-1" />
                      Completar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </section>

          {/* Paso 3 — Entrega / Cobertura (condicional por categoría) */}
          {showDeliveryStep && (
            <section
              className="rounded-xl border border-border/60 p-3 bg-background transition-opacity"
              style={{ opacity: step2Done ? 1 : 0.55 }}
              aria-labelledby="onboarding-step-delivery"
            >
              <div className="flex items-start gap-3 mb-3">
                {step3Done ? (
                  <CheckCircle2 className="h-5 w-5 text-brand-spring shrink-0 mt-0.5" aria-hidden />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" aria-hidden />
                )}
                <div>
                  <h3 id="onboarding-step-delivery" className="text-sm font-medium text-foreground">
                    4. {isFieldService ? "Área de cobertura" : "Entrega"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {!step2Done
                      ? "Completa primero los datos de tu negocio."
                      : isFieldService
                        ? "Indica las zonas donde prestas tu servicio."
                        : isOnlineStore
                          ? "Tus productos se envían por paquetería nacional."
                          : "Elige cómo entregas tus pedidos."}
                  </p>
                </div>
              </div>

              {step2Done && (
                <div className="pl-8 space-y-3">
                  {isPhysicalOrRestaurant && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {([
                          { value: "delivery",        label: "Solo delivery",     Icon: Bike },
                          { value: "pickup",          label: "Solo pickup",       Icon: Store },
                          { value: "delivery_pickup", label: "Delivery y pickup", Icon: ArrowLeftRight },
                        ] as Array<{ value: string; label: string; Icon: LucideIcon }>).map((opt) => {
                          const isActive = selectedDeliveryMode === opt.value;
                          return (
                            <button
                              key={opt.value}
                              type="button"
                              disabled={isDeliveryPending}
                              onClick={() => handleDeliverySelect(opt.value)}
                              className={[
                                "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-all",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                "disabled:opacity-60 disabled:cursor-not-allowed",
                                isActive
                                  ? "border-brand-spring bg-brand-mint/40 ring-2 ring-brand-spring"
                                  : "border-border/60 bg-background hover:border-brand-spring/50 hover:bg-brand-mint/20",
                              ].join(" ")}
                            >
                              <opt.Icon className={["h-5 w-5 mt-0.5", isActive ? "text-brand-forest" : "text-muted-foreground"].join(" ")} aria-hidden />
                              <span className="text-xs font-medium text-foreground leading-tight mt-1">
                                {opt.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      {(selectedDeliveryMode === "delivery" || selectedDeliveryMode === "delivery_pickup") && (
                        <div className="space-y-1.5">
                          <Label htmlFor="delivery-zone" className="text-xs text-muted-foreground">
                            Zona de entrega o colonias que cubres
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              id="delivery-zone"
                              placeholder="Ej: Col. Centro, Col. Roma, Del. Cuauhtémoc"
                              value={deliveryZone}
                              onChange={(e) => setDeliveryZone(e.target.value)}
                              className="text-sm h-8"
                            />
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="shrink-0 border-brand-forest/30 text-brand-forest h-8"
                              disabled={isDeliveryPending || !deliveryZone.trim()}
                              onClick={handleDeliveryZoneSave}
                            >
                              Guardar
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {isOnlineStore && (
                    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-3">
                      <MapPin className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
                      <p className="text-xs text-muted-foreground">
                        Tus pedidos se envían por paquetería nacional.
                        {step3Done
                          ? " Configuración lista."
                          : isDeliveryPending
                            ? " Configurando..."
                            : " Se configurará automáticamente."}
                      </p>
                    </div>
                  )}

                  {isFieldService && (
                    <div className="space-y-1.5">
                      <Label htmlFor="coverage-zone" className="text-xs text-muted-foreground">
                        Área de cobertura
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="coverage-zone"
                          placeholder="Ej: CDMX, Área metropolitana, Monterrey y zona conurbada"
                          value={deliveryZone}
                          onChange={(e) => setDeliveryZone(e.target.value)}
                          className="text-sm h-8"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="shrink-0 border-brand-forest/30 text-brand-forest h-8"
                          disabled={isDeliveryPending || !deliveryZone.trim()}
                          onClick={() => handleDeliverySelect("on_site", deliveryZone)}
                        >
                          Guardar
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Paso final — WhatsApp */}
          <section
            className="rounded-xl border border-border/60 p-3 bg-background transition-opacity"
            style={{ opacity: canStartWhatsApp ? 1 : 0.55 }}
            aria-labelledby="onboarding-step-wa"
          >
            <div className="flex items-start gap-3">
              {step4Done ? (
                <CheckCircle2 className="h-5 w-5 text-brand-spring shrink-0 mt-0.5" aria-hidden />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" aria-hidden />
              )}
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 min-w-0">
                <div>
                  <h3 id="onboarding-step-wa" className="text-sm font-medium text-foreground">
                    {whatsAppStepNumber} WhatsApp Business
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {!canStartWhatsApp
                      ? showDeliveryStep
                        ? "Completa primero la configuración de entrega."
                        : "Completa primero los datos de tu negocio."
                      : "Vincula tu número para inbox y pedidos."}
                  </p>
                </div>
                <div className="flex flex-col items-stretch sm:items-end gap-1">
                  {step4Done ? (
                    <span className="text-xs text-brand-forest font-medium">Conectado</span>
                  ) : canStartWhatsApp ? (
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
