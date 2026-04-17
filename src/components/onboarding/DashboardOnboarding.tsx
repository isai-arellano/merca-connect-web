"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Package,
  Smartphone,
} from "lucide-react";
import { motion } from "framer-motion";
import { useSWRConfig } from "swr";
import { useSession } from "next-auth/react";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api";
import { getSessionBusinessPhoneId } from "@/lib/business";
import {
  FALLBACK_INDUSTRIES,
  DIRECT_INDUSTRIES,
  GROUPED_INDUSTRIES,
  getIndustryConfig,
  getPublicCatalogRoute,
  industryApiRowToConfig,
  type IndustryGroup,
} from "@/config/industries";
import { useIndustries } from "@/hooks/useIndustries";
import { type BusinessSettings } from "@/types/api";
import { type OnboardingState } from "@/lib/onboarding";
import { BusinessSetupSheet } from "@/components/onboarding/BusinessSetupSheet";
import { ProductDialog } from "@/components/products/product-dialog";
import { cn } from "@/lib/utils";

const itemVariants = {
  hidden: { y: 16, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 280, damping: 22 } },
};

interface DashboardOnboardingProps {
  settings: BusinessSettings;
  onboarding: OnboardingState;
  catalogLabel: string;
  businessType: string;
}

export function DashboardOnboarding({
  settings,
  onboarding,
  catalogLabel,
  businessType,
}: DashboardOnboardingProps) {
  const { mutate } = useSWRConfig();
  const { data: session } = useSession();
  const router = useRouter();
  const sessionBusinessPhoneId = getSessionBusinessPhoneId(session);
  const [industrySaving, setIndustrySaving] = useState<string | null>(null);
  const [businessSheetOpen, setBusinessSheetOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);

  // Step 1 drill-down state: which group is expanded, and toggle to re-show picker
  const [selectedGroup, setSelectedGroup] = useState<IndustryGroup | null>(null);
  const [showIndustryPicker, setShowIndustryPicker] = useState(false);

  const { industriesMap, orderedRows } = useIndustries();

  // Build the direct-industry list, preferring API data when available
  const directGrid = useMemo(() => {
    if (orderedRows?.length) {
      // From API rows: exclude slugs that belong to a grouped industry
      const groupedSlugs = new Set(
        GROUPED_INDUSTRIES.flatMap((g) => g.subcategories.map((s) => s.slug))
      );
      // Also exclude group-level slugs that might be in the API
      const groupLabels = new Set(GROUPED_INDUSTRIES.map((g) => g.groupLabel.toLowerCase()));
      return orderedRows
        .filter((r) => !groupedSlugs.has(r.slug) && !groupLabels.has(r.label.toLowerCase()))
        .map((r) => ({ slug: r.slug, cfg: industryApiRowToConfig(r) }));
    }
    // Fallback: use DIRECT_INDUSTRIES definitions with FALLBACK_INDUSTRIES configs
    return DIRECT_INDUSTRIES.map(({ slug, label, view }) => ({
      slug,
      cfg: FALLBACK_INDUSTRIES[slug] ?? { view, label, productLabel: "Producto", productFields: { showStock: true, showBarcode: false, showIngredients: false, showActiveSubstance: false, showPreparationTime: false, showDimensions: false, showSKU: false }, relevantUnits: [], features: { hasTables: false, hasPrescriptions: false } },
    }));
  }, [orderedRows]);

  const industryConfig = getIndustryConfig(businessType, industriesMap);
  const publicRoute = getPublicCatalogRoute(businessType, industriesMap);
  const viewLabel = publicRoute === "menu" ? "Menú público" : "Catálogo público";

  const stepsComplete =
    [onboarding.hasIndustry, onboarding.hasBusinessProfile, onboarding.hasCatalogContent, onboarding.hasWhatsApp].filter(
      Boolean
    ).length;
  const progress = Math.round((stepsComplete / 4) * 100);

  const refreshAfterSave = async () => {
    // Invalidate all SWR keys to ensure data is fresh regardless of session state
    await mutate(() => true, undefined, { revalidate: true });
  };

  const handleSelectIndustry = async (slug: string) => {
    setIndustrySaving(slug);
    try {
      await apiClient.patch(endpoints.business.settings, { type: slug });
      setSelectedGroup(null);
      setShowIndustryPicker(false);
      await refreshAfterSave();
    } finally {
      setIndustrySaving(null);
    }
  };

  // Determine if the industry picker should be visible
  const isPickerVisible = !onboarding.hasIndustry || showIndustryPicker;

  return (
    <>
      <motion.div variants={itemVariants}>
        <Card className="rounded-2xl shadow-sm border-border/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">
                  Configura tu negocio
                </CardTitle>
                <CardDescription className="mt-0.5 text-sm">
                  {stepsComplete} de 4 pasos completados — todo desde aquí
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
            {/* ── Step 1 — Industry ─────────────────────────────────────────── */}
            <section
              className="rounded-xl border border-border/60 p-3 bg-background"
              aria-labelledby="onboarding-step-industry"
            >
              <div className="flex items-start gap-3">
                {onboarding.hasIndustry && !showIndustryPicker ? (
                  <CheckCircle2 className="h-5 w-5 text-brand-spring shrink-0 mt-0.5" aria-hidden />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" aria-hidden />
                )}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 id="onboarding-step-industry" className="text-sm font-medium text-foreground">
                        1. Tipo de negocio
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {onboarding.hasIndustry && !showIndustryPicker
                          ? `${viewLabel} · ${industryConfig.label}`
                          : selectedGroup
                          ? `Tienda en línea — elige el tipo`
                          : "Elige tu industria. Definimos catálogo o menú según el tipo."}
                      </p>
                    </div>
                    {/* "Cambiar tipo" link — only when step is complete and picker is hidden */}
                    {onboarding.hasIndustry && !showIndustryPicker && (
                      <button
                        type="button"
                        className="text-[11px] text-muted-foreground hover:text-brand-forest underline-offset-2 hover:underline shrink-0 transition-colors"
                        onClick={() => {
                          setSelectedGroup(null);
                          setShowIndustryPicker(true);
                        }}
                      >
                        Cambiar
                      </button>
                    )}
                  </div>

                  {/* Industry picker — hidden when step is complete and picker toggle is off */}
                  {isPickerVisible && (
                    <>
                      {/* Back button when inside a group drill-down */}
                      {selectedGroup && (
                        <button
                          type="button"
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-brand-forest transition-colors mb-1"
                          onClick={() => setSelectedGroup(null)}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          Volver
                        </button>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {selectedGroup ? (
                          /* ── Subcategory drill-down ── */
                          selectedGroup.subcategories.map((sub) => (
                            <button
                              key={sub.slug}
                              type="button"
                              disabled={industrySaving !== null}
                              onClick={() => handleSelectIndustry(sub.slug)}
                              className={cn(
                                "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                                "border-border/70 hover:border-brand-spring/60 hover:bg-brand-mint/40",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest/30"
                              )}
                            >
                              <span className="font-medium text-brand-forest flex-1 min-w-0">
                                {sub.label}
                              </span>
                              {industrySaving === sub.slug ? (
                                <Loader2 className="h-4 w-4 animate-spin shrink-0 text-brand-forest" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-brand-forest/60 shrink-0" />
                              )}
                            </button>
                          ))
                        ) : (
                          /* ── First-level grid: direct industries + group cards ── */
                          <>
                            {directGrid.map(({ slug, cfg }) => (
                              <button
                                key={slug}
                                type="button"
                                disabled={industrySaving !== null}
                                onClick={() => handleSelectIndustry(slug)}
                                className={cn(
                                  "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                                  "border-border/70 hover:border-brand-spring/60 hover:bg-brand-mint/40",
                                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest/30"
                                )}
                              >
                                <span className="font-medium text-brand-forest flex-1 min-w-0">
                                  {cfg.label}
                                </span>
                                <span className="text-[10px] uppercase text-muted-foreground shrink-0">
                                  {cfg.view === "menu" ? "Menú" : "Catálogo"}
                                </span>
                                {industrySaving === slug ? (
                                  <Loader2 className="h-4 w-4 animate-spin shrink-0 text-brand-forest" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-brand-forest/60 shrink-0" />
                                )}
                              </button>
                            ))}

                            {GROUPED_INDUSTRIES.map((group) => (
                              <button
                                key={group.groupLabel}
                                type="button"
                                disabled={industrySaving !== null}
                                onClick={() => setSelectedGroup(group)}
                                className={cn(
                                  "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                                  "border-border/70 hover:border-brand-spring/60 hover:bg-brand-mint/40",
                                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest/30"
                                )}
                              >
                                {group.groupIcon && (
                                  <span className="text-base shrink-0" aria-hidden>
                                    {group.groupIcon}
                                  </span>
                                )}
                                <span className="font-medium text-brand-forest flex-1 min-w-0">
                                  {group.groupLabel}
                                </span>
                                <span className="text-[10px] uppercase text-muted-foreground shrink-0">
                                  {group.subcategories.length} tipos
                                </span>
                                <ChevronRight className="h-4 w-4 text-brand-forest/60 shrink-0" />
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>

            {/* ── Step 2 — Business data ────────────────────────────────────── */}
            <section
              className={cn(
                "rounded-xl border border-border/60 p-3 bg-background transition-opacity",
                !onboarding.hasIndustry && "opacity-50"
              )}
            >
              <div className="flex items-start gap-3">
                {onboarding.hasBusinessProfile ? (
                  <CheckCircle2 className="h-5 w-5 text-brand-spring shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">2. Datos del negocio</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {!onboarding.hasIndustry
                        ? "Primero elige tu tipo de negocio"
                        : "Nombre, horario, URL pública y métodos de pago"}
                    </p>
                  </div>
                  {!onboarding.hasBusinessProfile && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="shrink-0 border-brand-forest/30 text-brand-forest"
                      onClick={() => {
                        if (onboarding.hasIndustry) setBusinessSheetOpen(true);
                      }}
                      disabled={!onboarding.hasIndustry}
                    >
                      Completar
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  )}
                </div>
              </div>
            </section>

            {/* ── Step 3 — Catalog ─────────────────────────────────────────── */}
            <section
              className={cn(
                "rounded-xl border border-border/60 p-3 bg-background transition-opacity",
                !onboarding.hasBusinessProfile && "opacity-50"
              )}
            >
              <div className="flex items-start gap-3">
                {onboarding.hasCatalogContent ? (
                  <CheckCircle2 className="h-5 w-5 text-brand-spring shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">3. {catalogLabel}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {!onboarding.hasBusinessProfile
                        ? "Completa tus datos primero"
                        : `Al menos un ${industryConfig.productLabel.toLowerCase()} visible`}
                    </p>
                  </div>
                  {!onboarding.hasCatalogContent && onboarding.hasBusinessProfile && (
                    <Button
                      type="button"
                      size="sm"
                      className="shrink-0 bg-brand-forest text-white hover:bg-brand-forest/90"
                      onClick={() => {
                        if (sessionBusinessPhoneId) {
                          setProductOpen(true);
                        } else {
                          router.push("/dashboard/products");
                        }
                      }}
                    >
                      <Package className="h-3.5 w-3.5 mr-1" />
                      Agregar primer producto
                    </Button>
                  )}
                </div>
              </div>
            </section>

            {/* ── Step 4 — WhatsApp ────────────────────────────────────────── */}
            <section
              className={cn(
                "rounded-xl border border-border/60 p-3 bg-background transition-opacity",
                !onboarding.canStartWhatsApp && "opacity-50"
              )}
            >
              <div className="flex items-start gap-3">
                {onboarding.hasWhatsApp ? (
                  <CheckCircle2 className="h-5 w-5 text-brand-spring shrink-0 mt-0.5" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">4. WhatsApp Business</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {!onboarding.canStartWhatsApp
                        ? "Completa los pasos anteriores para habilitar"
                        : "Vincula tu número para inbox y pedidos"}
                    </p>
                  </div>
                  <div className="flex flex-col items-stretch sm:items-end gap-1">
                    {onboarding.hasWhatsApp ? (
                      <span className="text-xs text-brand-forest font-medium">Conectado</span>
                    ) : onboarding.canStartWhatsApp ? (
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
          </CardContent>
        </Card>
      </motion.div>

      <BusinessSetupSheet
        open={businessSheetOpen}
        onOpenChange={setBusinessSheetOpen}
        settings={settings}
        onSaved={refreshAfterSave}
      />

      {sessionBusinessPhoneId && onboarding.hasIndustry && (
        <ProductDialog
          open={productOpen}
          onOpenChange={(o) => {
            setProductOpen(o);
            if (!o) void refreshAfterSave();
          }}
          config={industryConfig}
          businessPhoneId={sessionBusinessPhoneId}
          product={undefined}
        />
      )}
      {/* When no businessPhoneId yet, productOpen is never true (we redirect instead) */}
    </>
  );
}
