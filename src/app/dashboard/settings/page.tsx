"use client";

import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Store,
  MessageCircle,
  Loader2,
  Save,
  CheckCircle2,
  Globe,
  MapPin,
  Phone,
  Clock,
  FileText,
  AlertCircle,
  Bot,
  Smartphone,
  CreditCard,
  Truck,
  Building2,
  Instagram,
  Facebook,
  AtSign,
  Lock,
  AlertTriangle,
  Link2,
} from "lucide-react";

import { endpoints } from "@/lib/api";
import { apiClient, fetcher, ApiError, NetworkError } from "@/lib/api-client";
import { type WhatsAppProfile, type BusinessSettings, type DashboardStats } from "@/types/api";
import { getSessionBusinessPhoneId } from "@/lib/business";
import { computeOnboardingState } from "@/lib/onboarding";
import { cn } from "@/lib/utils";
import { AgentTab } from "@/components/settings/AgentTab";
import { WhatsAppConnectTab } from "@/components/settings/WhatsAppConnectTab";
import { PlanTab } from "@/components/settings/PlanTab";
import { HoursEditor, hasIncompleteHours, type WeekSchedule, EMPTY_WEEK_SCHEDULE } from "@/components/settings/HoursEditor";
import { PaymentTemplatesSection } from "@/components/settings/PaymentTemplatesSection";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FALLBACK_INDUSTRIES,
  FLAT_INDUSTRY_SLUGS_ORDER,
  BUSINESS_CATEGORIES,
  isIndustryEligibleForBusinessType,
  catalogModuleLower,
  catalogModuleTitle,
  getIndustryConfig,
  pluralProductLabel,
} from "@/config/industries";
import { useIndustries } from "@/hooks/useIndustries";

const COUNTRY_CODE_MX = "+52";
const MEXICO_FLAG = "\uD83C\uDDF2\uD83C\uDDFD";
interface BusinessFormErrors {
  name?: string;
  type?: string;
  hours?: string;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function slugifyInput(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

function validateSlug(slug: string): string | null {
  if (!slug) return null; // vacío es válido (se auto-genera)
  if (slug.length < 3) return "El slug debe tener al menos 3 caracteres.";
  if (slug.length > 100) return "El slug debe tener máximo 100 caracteres.";
  if (!SLUG_RE.test(slug)) return "Solo letras minúsculas, números y guiones. Sin espacios ni caracteres especiales.";
  return null;
}

function getPhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function sanitizePhoneInput(value: string): string {
  return value.replace(/\D/g, "").slice(0, 10);
}

function buildPhoneForApi(phoneDigits: string): string {
  const trimmedDigits = phoneDigits.trim();
  return trimmedDigits ? `${COUNTRY_CODE_MX} ${trimmedDigits}` : "";
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

const tabContentVariants: Variants = {
  hidden: { opacity: 0, x: 10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

const SETTINGS_TAB_VALUES = ["negocio", "conectar", "whatsapp", "agente", "plan"] as const;
type SettingsTabValue = (typeof SETTINGS_TAB_VALUES)[number];

function isSettingsTabValue(v: string | null): v is SettingsTabValue {
  return v !== null && (SETTINGS_TAB_VALUES as readonly string[]).includes(v);
}

function SettingsPageInner() {
  const { data: session } = useSession();
  const sessionBusinessPhoneId = getSessionBusinessPhoneId(session);
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  /** Mismo valor en servidor y primer paint cliente — evita desync de useId en Radix Tabs */
  const [activeTab, setActiveTab] = useState<SettingsTabValue>("negocio");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (isSettingsTabValue(tab)) {
      setActiveTab(tab);
    }
  }, []);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingWa, setEditingWa] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<BusinessFormErrors>({});

  // Business settings
  const {
    data: settingsRes,
    isLoading: settingsLoading,
    mutate: mutateSettings,
  } = useSWR<BusinessSettings | { data: BusinessSettings }>(
    session ? endpoints.business.settings : null,
    fetcher
  );

  // WhatsApp profile
  const {
    data: waProfileRes,
    isLoading: waLoading,
    mutate: mutateWaProfile,
  } = useSWR<WhatsAppProfile | { data: WhatsAppProfile }>(
    session
      && sessionBusinessPhoneId
      ? endpoints.business.whatsappProfile
      : null,
    fetcher
  );

  const settings: BusinessSettings = useMemo(
    () =>
      (settingsRes as { data: BusinessSettings } | null)?.data ??
      (settingsRes as BusinessSettings | null) ??
      {},
    [settingsRes]
  );
  const waProfile: WhatsAppProfile = useMemo(
    () =>
      (waProfileRes as { data: WhatsAppProfile } | null)?.data ??
      (waProfileRes as WhatsAppProfile | null) ??
      {},
    [waProfileRes]
  );

  const { data: statsRaw } = useSWR<DashboardStats>(
    session ? endpoints.dashboard.stats : null,
    fetcher,
  );

  const onboardingState = useMemo(
    () =>
      computeOnboardingState({
        settings,
        activeProducts: statsRaw?.active_products ?? 0,
        hasWhatsAppSession: Boolean(sessionBusinessPhoneId),
      }),
    [settings, statsRaw?.active_products, sessionBusinessPhoneId],
  );

  const canUseConnectTab = onboardingState.canStartWhatsApp;
  const canUsePostConnectTabs = onboardingState.hasWhatsApp;

  /** Evita quedarse en una pestaña de URL no permitida cuando ya cargaron los settings. */
  useEffect(() => {
    if (settingsLoading) return;
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (!isSettingsTabValue(tab)) return;

    if (tab === "conectar" && !canUseConnectTab) {
      setActiveTab("negocio");
      router.replace(`${pathname}?tab=negocio`, { scroll: false });
      toast({
        title: "Completa tu negocio primero",
        description: "Nombre y tipo de negocio obligatorios en la pestaña Negocio.",
        variant: "destructive",
      });
      return;
    }
    if (
      (tab === "whatsapp" || tab === "agente" || tab === "plan") &&
      !canUsePostConnectTabs
    ) {
      const fallback: SettingsTabValue = canUseConnectTab ? "conectar" : "negocio";
      setActiveTab(fallback);
      router.replace(`${pathname}?tab=${fallback}`, { scroll: false });
      toast({
        title: "Conecta WhatsApp primero",
        description: "Usa la pestaña Conectar para vincular tu número.",
        variant: "destructive",
      });
    }
  }, [
    settingsLoading,
    canUseConnectTab,
    canUsePostConnectTabs,
    pathname,
    router,
    toast,
  ]);

  const handleTabChange = (value: string) => {
    if (!isSettingsTabValue(value)) return;
    if (value === "conectar" && !canUseConnectTab) {
      toast({
        title: "Pestaña bloqueada",
        description: "Completa nombre y tipo de negocio en la pestaña Negocio.",
        variant: "destructive",
      });
      return;
    }
    if (
      (value === "whatsapp" || value === "agente" || value === "plan") &&
      !canUsePostConnectTabs
    ) {
      toast({
        title: "Pestaña bloqueada",
        description: "Conecta WhatsApp Business primero (pestaña Conectar).",
        variant: "destructive",
      });
      return;
    }
    setActiveTab(value);
    router.replace(`${pathname}?tab=${value}`, { scroll: false });
  };

  const { orderedRows, industriesMap } = useIndustries();

  const industryConfig = useMemo(
    () => getIndustryConfig(settings.type, industriesMap),
    [settings.type, industriesMap],
  );
  const moduleTitle = catalogModuleTitle(industryConfig);
  const moduleLower = catalogModuleLower(industryConfig);
  const itemsPluralLower = pluralProductLabel(industryConfig.productLabel).toLowerCase();
  const industrySelectOptions = useMemo(() => {
    if (orderedRows?.length) {
      return orderedRows
        .filter(isIndustryEligibleForBusinessType)
        .map((r) => ({ value: r.slug, label: r.label }));
    }
    return FLAT_INDUSTRY_SLUGS_ORDER.filter((slug) => FALLBACK_INDUSTRIES[slug]).map((value) => ({
      value,
      label: FALLBACK_INDUSTRIES[value].label,
    }));
  }, [orderedRows]);

  // Business form state
  const [businessForm, setBusinessForm] = useState({
    name: "",
    type: "",
    address: "",
    phone: "",
    description: "",
    slug: "",
  });
  const [slugError, setSlugError] = useState<string | null>(null);

  // Social links state
  const [socialForm, setSocialForm] = useState({
    website: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    whatsapp: "",
  });
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule>(EMPTY_WEEK_SCHEDULE);

  const PAYMENT_OPTIONS = ["Efectivo", "Transferencia SPEI", "Tarjeta débito", "Tarjeta crédito"];
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [deliveryZone, setDeliveryZone] = useState("");
  const [contactPhoneNumber, setContactPhoneNumber] = useState("");
  const [allowOrdersOutsideHours, setAllowOrdersOutsideHours] = useState(false);

  // Modal de advertencia por cambio de vista (catalogo ↔ menu)
  const [industryWarning, setIndustryWarning] = useState<{ pendingType: string; pendingLabel: string } | null>(null);

  // WhatsApp form state
  const [waForm, setWaForm] = useState({
    about: "",
    address: "",
    description: "",
    websites: "",
  });

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setBusinessForm({
        name: settings.name || "",
        type: settings.type || "",
        address: settings.address || "",
        phone: settings.phone || "",
        description: settings.description || "",
        slug: settings.slug || "",
      });
      if (settings.hours && typeof settings.hours === "object") {
        setWeekSchedule({ ...EMPTY_WEEK_SCHEDULE, ...settings.hours });
      }
      const cfg = settings.config || {};
      if (Array.isArray(cfg.payment_methods)) {
        setPaymentMethods(cfg.payment_methods);
      }
      if (cfg.delivery_zone) {
        setDeliveryZone(cfg.delivery_zone);
      }
      setAllowOrdersOutsideHours(!!cfg.allow_orders_outside_hours);
      setContactPhoneNumber(getPhoneDigits(settings.phone || "").slice(-10));
      setSocialForm({
        website: settings.social?.website || "",
        instagram: settings.social?.instagram || "",
        facebook: settings.social?.facebook || "",
        tiktok: settings.social?.tiktok || "",
        whatsapp: settings.social?.whatsapp || "",
      });
    }
  }, [settings]);

  useEffect(() => {
    if (waProfile && Object.keys(waProfile).length > 0) {
      setWaForm({
        about: waProfile.about || "",
        address: waProfile.address || "",
        description: waProfile.description || "",
        websites: Array.isArray(waProfile.websites)
          ? waProfile.websites.join(", ")
          : waProfile.websites || "",
      });
    }
  }, [waProfile]);

  /** Intercepta cambio de industria: si cambia el view (catalogo↔menu), muestra advertencia. */
  function handleTypeChange(val: string) {
    const currentView = getIndustryConfig(settings.type, industriesMap).view;
    const newView = getIndustryConfig(val, industriesMap).view;
    if (settings.type && val !== settings.type && currentView !== newView) {
      const newLabel = industrySelectOptions.find((o) => o.value === val)?.label ?? val;
      setIndustryWarning({ pendingType: val, pendingLabel: newLabel });
    } else {
      setBusinessForm((prev) => ({ ...prev, type: val }));
    }
  }

  function confirmIndustryChange() {
    if (!industryWarning) return;
    setBusinessForm((prev) => ({ ...prev, type: industryWarning.pendingType }));
    setIndustryWarning(null);
  }

  const handleSaveSettings = async () => {
    const nextErrors: BusinessFormErrors = {};
    const trimmedName = businessForm.name.trim();
    const trimmedType = businessForm.type.trim();
    const trimmedSlug = businessForm.slug.trim();
    const slugValidErr = validateSlug(trimmedSlug);
    if (slugValidErr) {
      setSlugError(slugValidErr);
      toast({ title: "Slug inválido", description: slugValidErr, variant: "destructive" });
      return;
    }
    setSlugError(null);
    const hasAtLeastOneOpenDay = Object.values(weekSchedule).some((day) => day.open); // para validar horas incompletas si hay días activos

    if (!trimmedName) {
      nextErrors.name = "El nombre del negocio es obligatorio.";
    }
    if (!trimmedType) {
      nextErrors.type = "Selecciona un tipo de negocio.";
    }
    // Horarios opcionales — solo validar si hay días activos con horas incompletas
    if (hasAtLeastOneOpenDay && hasIncompleteHours(weekSchedule)) {
      nextErrors.hours = "Todos los días activos deben tener hora de apertura y cierre.";
    }
    setFormErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast({
        title: "Campos obligatorios pendientes",
        description: "Completa los datos requeridos para guardar la configuración.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      await apiClient.patch(
        endpoints.business.settings,
        {
          ...businessForm,
          name: trimmedName,
          type: trimmedType,
          slug: trimmedSlug || undefined,
          phone: buildPhoneForApi(contactPhoneNumber),
          hours: weekSchedule,
          config: {
            payment_methods: paymentMethods,
            delivery_zone: deliveryZone.trim() || null,
          },
          allow_orders_outside_hours: allowOrdersOutsideHours,
          social: {
            website: socialForm.website.trim() || null,
            instagram: socialForm.instagram.trim() || null,
            facebook: socialForm.facebook.trim() || null,
            tiktok: socialForm.tiktok.trim() || null,
            whatsapp: socialForm.whatsapp.trim() || null,
          },
        }
      );
      mutateSettings();
      setSaved(true);
      setSaveError(null);
      setFormErrors({});
      setTimeout(() => setSaved(false), 3000);
      toast({
        title: "Configuración guardada",
        description: "Los datos del negocio se actualizaron correctamente.",
      });
    } catch (error: unknown) {
      console.error("Error al guardar configuración:", error);
      if (error instanceof NetworkError) {
        setSaveError(error.message);
        toast({
          title: "Error de conectividad",
          description: error.message,
          variant: "destructive",
        });
      } else if (error instanceof ApiError) {
        setSaveError(error.message || "No se pudo guardar la configuración. Inténtalo de nuevo.");
        toast({
          title: "Error al guardar",
          description: error.message || "No se pudo guardar la configuración del negocio.",
          variant: "destructive",
        });
      } else {
        setSaveError("No se pudo guardar la configuración. Inténtalo de nuevo.");
        toast({
          title: "Error al guardar",
          description: "No se pudo guardar la configuración del negocio.",
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSaveWaProfile = async () => {
    setSaving(true);
    try {
      await apiClient.patch(
        endpoints.business.whatsappProfile,
        {
          ...waForm,
          websites: waForm.websites
            .split(",")
            .map((w) => w.trim())
            .filter(Boolean),
        }
      );
      mutateWaProfile();
      setEditingWa(false);
      setSaved(true);
      setSaveError(null);
      setTimeout(() => setSaved(false), 3000);
      toast({
        title: "Perfil actualizado",
        description: "El perfil de WhatsApp se actualizó correctamente.",
      });
    } catch (error) {
      console.error("Error al guardar perfil de WhatsApp:", error);
      setSaveError("No se pudo guardar el perfil de WhatsApp. Inténtalo de nuevo.");
      toast({
        title: "Error al guardar",
        description: "No se pudo actualizar el perfil de WhatsApp.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      className="space-y-6 max-w-6xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
          Configuración
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Administra los ajustes de tu negocio y tu perfil de WhatsApp Business.
        </p>
      </motion.div>

      {/* Success Banner */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="flex items-center gap-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 rounded-lg px-4 py-3 text-sm font-medium"
          >
            <CheckCircle2 className="h-4 w-4" />
            Cambios guardados correctamente
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="flex flex-wrap h-auto gap-1 p-1 sm:grid sm:grid-cols-5">
            <TabsTrigger value="negocio" className="gap-1.5 flex-1 sm:flex-none">
              <Store className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">Negocio</span>
            </TabsTrigger>
            <TabsTrigger
              value="conectar"
              disabled={!canUseConnectTab}
              className={cn(
                "gap-1.5 flex-1 sm:flex-none",
                !canUseConnectTab && "opacity-50 cursor-not-allowed",
              )}
            >
              <Smartphone className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">Conectar</span>
            </TabsTrigger>
            <TabsTrigger
              value="whatsapp"
              disabled={!canUsePostConnectTabs}
              className={cn(
                "gap-1.5 flex-1 sm:flex-none",
                !canUsePostConnectTabs && "opacity-50 cursor-not-allowed",
              )}
            >
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger
              value="agente"
              disabled={!canUsePostConnectTabs}
              className={cn(
                "gap-1.5 flex-1 sm:flex-none",
                !canUsePostConnectTabs && "opacity-50 cursor-not-allowed",
              )}
            >
              <Bot className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">Agente</span>
            </TabsTrigger>
            <TabsTrigger
              value="plan"
              disabled={!canUsePostConnectTabs}
              className={cn(
                "gap-1.5 flex-1 sm:flex-none",
                !canUsePostConnectTabs && "opacity-50 cursor-not-allowed",
              )}
            >
              <CreditCard className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">Plan</span>
            </TabsTrigger>
          </TabsList>

          {/* TabsContent: sin AnimatePresence envolviendo paneles (conflicto con Radix Presence / hidratación) */}
          <TabsContent value="negocio">
              <motion.div
                variants={tabContentVariants}
                initial={false}
                animate="visible"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Información del Negocio</CardTitle>
                    <CardDescription>
                      Estos datos se usan para personalizar la experiencia de tus
                      clientes.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {settingsLoading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {!canUseConnectTab && (
                          <p className="rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
                            Completa nombre y tipo de negocio para desbloquear la pestaña Conectar WhatsApp.
                          </p>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="biz-name" className="flex items-center gap-2">
                            <Store className="h-3.5 w-3.5 text-muted-foreground" />
                            Nombre del Negocio
                            <span className="text-destructive" aria-hidden>
                              *
                            </span>
                          </Label>
                          <Input
                            id="biz-name"
                            value={businessForm.name}
                            onChange={(e) =>
                              setBusinessForm((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                            placeholder="Mi Negocio"
                            className={formErrors.name ? "border-destructive focus-visible:ring-destructive" : ""}
                          />
                          {formErrors.name && (
                            <p className="text-xs text-destructive flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5" />
                              {formErrors.name}
                            </p>
                          )}
                        </div>

                        {/* Categoría de negocio — readonly después de completar onboarding */}
                        {settings.business_category && (
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              Categoría de negocio
                              {onboardingState.allComplete && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 border border-border/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                  <Lock className="h-3 w-3" />
                                  Fija
                                </span>
                              )}
                            </Label>
                            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
                              <span className="text-sm font-medium text-foreground">
                                {BUSINESS_CATEGORIES.find(c => c.value === settings.business_category)?.label ?? settings.business_category}
                              </span>
                              {onboardingState.allComplete ? (
                                <p className="ml-auto text-xs text-muted-foreground">
                                  Para cambiarla contacta a soporte.
                                </p>
                              ) : (
                                <p className="ml-auto text-xs text-muted-foreground">
                                  Cámbiala en el onboarding.
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            Tipo de negocio / Industria
                            <span className="text-destructive" aria-hidden>
                              *
                            </span>
                          </Label>
                          <Select
                            value={businessForm.type}
                            onValueChange={handleTypeChange}
                          >
                            <SelectTrigger className={formErrors.type ? "border-destructive focus-visible:ring-destructive" : ""}>
                              <SelectValue placeholder="Selecciona tu industria" />
                            </SelectTrigger>
                            <SelectContent>
                              {industrySelectOptions.map(({ value, label }) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formErrors.type && (
                            <p className="text-xs text-destructive flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5" />
                              {formErrors.type}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Define el giro para adaptar formularios de {itemsPluralLower} y unidades.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="biz-address" className="flex items-center gap-2">
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            Dirección
                          </Label>
                          <Input
                            id="biz-address"
                            value={businessForm.address}
                            onChange={(e) =>
                              setBusinessForm((prev) => ({
                                ...prev,
                                address: e.target.value,
                              }))
                            }
                            placeholder="Calle, Colonia, Ciudad, CP"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="biz-phone" className="flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            Teléfono de contacto
                          </Label>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[180px_1fr]">
                            <Select value={COUNTRY_CODE_MX} disabled>
                              <SelectTrigger id="biz-phone-country">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={COUNTRY_CODE_MX}>
                                  {MEXICO_FLAG} México ({COUNTRY_CODE_MX})
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              id="biz-phone"
                              type="tel"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              autoComplete="tel-national"
                              value={contactPhoneNumber}
                              onChange={(e) => {
                                const sanitizedPhone = sanitizePhoneInput(e.target.value);
                                setContactPhoneNumber(sanitizedPhone);
                                setBusinessForm((prev) => ({
                                  ...prev,
                                  phone: buildPhoneForApi(sanitizedPhone),
                                }));
                              }}
                              placeholder="5512345678"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Teléfono de atención al cliente en México (solo números, 10 dígitos).
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            Horario de atención
                            <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                          </Label>
                          <HoursEditor value={weekSchedule} onChange={setWeekSchedule} />
                          {formErrors.hours && (
                            <p className="text-xs text-destructive flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5" />
                              {formErrors.hours}
                            </p>
                          )}
                          <div className="mt-3 flex items-center justify-between gap-4 rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium">Atender fuera de horario</p>
                              <p className="text-xs text-muted-foreground leading-snug">
                                Si está activo, el agente seguirá respondiendo aunque el negocio esté cerrado.
                              </p>
                            </div>
                            <Switch
                              checked={allowOrdersOutsideHours}
                              onCheckedChange={setAllowOrdersOutsideHours}
                              aria-label="Atender fuera de horario"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="biz-desc" className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                            Descripción
                          </Label>
                          <Textarea
                            id="biz-desc"
                            value={businessForm.description}
                            onChange={(e) =>
                              setBusinessForm((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            placeholder="Describe tu negocio brevemente..."
                            rows={3}
                          />
                        </div>

                        {/* Slug del catálogo público */}
                        <div className="space-y-2">
                          <Label htmlFor="biz-slug" className="flex items-center gap-2">
                            <Link2 className="h-3.5 w-3.5 text-muted-foreground" />
                            Slug del catálogo público
                            <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                          </Label>
                          <div className="flex items-center gap-0 rounded-lg border border-border/80 overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
                            <span className="bg-muted/50 px-3 py-2 text-xs text-muted-foreground select-none border-r border-border/60">
                              /catalogo/
                            </span>
                            <input
                              id="biz-slug"
                              type="text"
                              value={businessForm.slug}
                              onChange={(e) => {
                                const raw = slugifyInput(e.target.value);
                                setBusinessForm((prev) => ({ ...prev, slug: raw }));
                                setSlugError(validateSlug(raw));
                              }}
                              placeholder="mi-negocio"
                              className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                            />
                          </div>
                          {slugError ? (
                            <p className="text-xs text-destructive flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5" />
                              {slugError}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              {businessForm.slug
                                ? <>URL pública: <span className="font-mono text-foreground">/catalogo/{businessForm.slug}</span></>
                                : "Si lo dejas vacío, se genera automáticamente desde el nombre del negocio."}
                            </p>
                          )}
                        </div>

                        <Separator />

                        {/* Métodos de pago */}
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2">
                            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                            Métodos de pago aceptados
                            <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            {PAYMENT_OPTIONS.map((method) => (
                              <div key={method} className="flex items-center gap-2">
                                <Checkbox
                                  id={`pay-${method}`}
                                  checked={paymentMethods.includes(method)}
                                  onCheckedChange={(checked) => {
                                    setPaymentMethods((prev) =>
                                      checked
                                        ? [...prev, method]
                                        : prev.filter((m) => m !== method)
                                    );
                                  }}
                                />
                                <label
                                  htmlFor={`pay-${method}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {method}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>

                        <Separator />

                        {/* Plantillas de pago */}
                        <PaymentTemplatesSection />

                        {/* Zona de entrega */}
                        <div className="space-y-2">
                          <Label htmlFor="delivery-zone" className="flex items-center gap-2">
                            <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                            Zona de entrega
                          </Label>
                          <Input
                            id="delivery-zone"
                            value={deliveryZone}
                            onChange={(e) => setDeliveryZone(e.target.value)}
                            placeholder="Ej: 3 km a la redonda, pedido mínimo $150"
                          />
                          <p className="text-xs text-muted-foreground">
                            El agente usará esta información cuando los clientes pregunten sobre envíos.
                          </p>
                        </div>

                        <Separator />

                        {/* Redes sociales y sitio web */}
                        <div className="space-y-3">
                          <div>
                            <Label className="flex items-center gap-2">
                              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                              Redes sociales y sitio web
                              <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                            </Label>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Se mostrarán en el {moduleLower} público de tu negocio.
                            </p>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1.5">
                              <Label htmlFor="social-website" className="flex items-center gap-1.5 text-sm">
                                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                                Sitio web
                              </Label>
                              <Input
                                id="social-website"
                                value={socialForm.website}
                                onChange={(e) => setSocialForm((prev) => ({ ...prev, website: e.target.value }))}
                                placeholder="https://tunegocio.com"
                                type="url"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="social-instagram" className="flex items-center gap-1.5 text-sm">
                                <Instagram className="h-3.5 w-3.5 text-muted-foreground" />
                                Instagram
                              </Label>
                              <Input
                                id="social-instagram"
                                value={socialForm.instagram}
                                onChange={(e) => setSocialForm((prev) => ({ ...prev, instagram: e.target.value }))}
                                placeholder="@tunegocio"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="social-facebook" className="flex items-center gap-1.5 text-sm">
                                <Facebook className="h-3.5 w-3.5 text-muted-foreground" />
                                Facebook
                              </Label>
                              <Input
                                id="social-facebook"
                                value={socialForm.facebook}
                                onChange={(e) => setSocialForm((prev) => ({ ...prev, facebook: e.target.value }))}
                                placeholder="@tunegocio o URL"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label htmlFor="social-tiktok" className="flex items-center gap-1.5 text-sm">
                                <AtSign className="h-3.5 w-3.5 text-muted-foreground" />
                                TikTok
                              </Label>
                              <Input
                                id="social-tiktok"
                                value={socialForm.tiktok}
                                onChange={(e) => setSocialForm((prev) => ({ ...prev, tiktok: e.target.value }))}
                                placeholder="@tunegocio"
                              />
                            </div>
                            <div className="space-y-1.5 sm:col-span-2">
                              <Label htmlFor="social-whatsapp" className="flex items-center gap-1.5 text-sm">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                WhatsApp
                              </Label>
                              <Input
                                id="social-whatsapp"
                                value={socialForm.whatsapp}
                                onChange={(e) => setSocialForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
                                placeholder="+52 55 1234 5678"
                                type="tel"
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div className="flex items-center justify-between">
                          {saveError && activeTab === "negocio" ? (
                            <p className="text-sm text-destructive flex items-center gap-1.5">
                              <AlertCircle className="h-4 w-4" />
                              {saveError}
                            </p>
                          ) : (
                            <div />
                          )}
                          <Button
                            onClick={handleSaveSettings}
                            disabled={saving}
                            className="gap-2"
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Guardar Cambios
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* CONECTAR TAB */}
            <TabsContent value="conectar">
              <motion.div
                variants={tabContentVariants}
                initial={false}
                animate="visible"
              >
                <WhatsAppConnectTab />
              </motion.div>
            </TabsContent>

            {/* WHATSAPP TAB */}
            <TabsContent value="whatsapp">
              <motion.div
                variants={tabContentVariants}
                initial={false}
                animate="visible"
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Perfil de WhatsApp Business</CardTitle>
                        <CardDescription>
                          Información de tu perfil visible en WhatsApp.
                        </CardDescription>
                      </div>
                      {!editingWa && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingWa(true)}
                        >
                          Editar
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {waLoading ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-16 w-16 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-48" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </div>
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : editingWa ? (
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <Label>Acerca de</Label>
                          <Input
                            value={waForm.about}
                            onChange={(e) =>
                              setWaForm((prev) => ({
                                ...prev,
                                about: e.target.value,
                              }))
                            }
                            placeholder="Acerca de tu negocio"
                            maxLength={139}
                          />
                          <p className="text-xs text-muted-foreground">
                            {waForm.about.length}/139 caracteres
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Dirección</Label>
                          <Input
                            value={waForm.address}
                            onChange={(e) =>
                              setWaForm((prev) => ({
                                ...prev,
                                address: e.target.value,
                              }))
                            }
                            placeholder="Dirección del negocio"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Descripción</Label>
                          <Textarea
                            value={waForm.description}
                            onChange={(e) =>
                              setWaForm((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            placeholder="Descripción detallada"
                            rows={3}
                            maxLength={512}
                          />
                          <p className="text-xs text-muted-foreground">
                            {waForm.description.length}/512 caracteres
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label>Sitios Web</Label>
                          <Input
                            value={waForm.websites}
                            onChange={(e) =>
                              setWaForm((prev) => ({
                                ...prev,
                                websites: e.target.value,
                              }))
                            }
                            placeholder="https://ejemplo.com, https://tienda.ejemplo.com"
                          />
                          <p className="text-xs text-muted-foreground">
                            Separa múltiples URLs con comas
                          </p>
                        </div>

                        <Separator />

                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setEditingWa(false)}
                          >
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleSaveWaProfile}
                            disabled={saving}
                            className="gap-2"
                          >
                            {saving ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                            Guardar Perfil
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Profile Header */}
                        <div className="flex items-center gap-4">
                          <div className="h-16 w-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/20 flex items-center justify-center">
                            {waProfile.profile_picture_url ? (
                              <Image
                                src={waProfile.profile_picture_url}
                                alt="Perfil"
                                width={64}
                                height={64}
                                className="h-16 w-16 rounded-full object-cover"
                              />
                            ) : (
                              <MessageCircle className="h-7 w-7 text-emerald-500" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-lg">
                              {waProfile.verified_name || settings.name || "Tu Negocio"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {waProfile.category || "Categoría no configurada"}
                            </p>
                          </div>
                        </div>

                        <Separator />

                        {/* Profile Details */}
                        <div className="space-y-4">
                          <ProfileField
                            label="Acerca de"
                            value={waProfile.about}
                            icon={<FileText className="h-4 w-4" />}
                          />
                          <ProfileField
                            label="Dirección"
                            value={waProfile.address}
                            icon={<MapPin className="h-4 w-4" />}
                          />
                          <ProfileField
                            label="Descripción"
                            value={waProfile.description}
                            icon={<FileText className="h-4 w-4" />}
                          />
                          <ProfileField
                            label="Sitios Web"
                            value={
                              Array.isArray(waProfile.websites)
                                ? waProfile.websites.join(", ")
                                : waProfile.websites
                            }
                            icon={<Globe className="h-4 w-4" />}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            {/* AGENTE TAB */}
            <TabsContent value="agente">
              <motion.div
                variants={tabContentVariants}
                initial={false}
                animate="visible"
              >
                <AgentTab />
              </motion.div>
            </TabsContent>

            {/* PLAN TAB */}
            <TabsContent value="plan">
              <motion.div
                variants={tabContentVariants}
                initial={false}
                animate="visible"
              >
                <PlanTab />
              </motion.div>
            </TabsContent>
        </Tabs>
      </motion.div>

      {/* Modal de advertencia: cambio de industria con distinto view (catalogo ↔ menu) */}
      <Dialog open={!!industryWarning} onOpenChange={(open) => { if (!open) setIndustryWarning(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Cambio de tipo de catálogo
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Estás cambiando a <strong>{industryWarning?.pendingLabel}</strong>, que usa una vista diferente a la actual.
              <br /><br />
              Tus productos y categorías <strong>no se borrarán</strong>, pero la vista pública cambiará entre &ldquo;Catálogo&rdquo; y &ldquo;Menú&rdquo;. Puedes ajustar tus productos después.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIndustryWarning(null)}>
              Cancelar
            </Button>
            <Button onClick={confirmIndustryChange}>
              Sí, cambiar industria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export default function SettingsPage() {
  return <SettingsPageInner />;
}

function ProfileField({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="text-sm text-foreground mt-0.5">
          {value || <span className="text-muted-foreground italic">No configurado</span>}
        </p>
      </div>
    </div>
  );
}
