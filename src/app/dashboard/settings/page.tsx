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
  ExternalLink,
  AlertCircle,
  Bot,
  Smartphone,
  CreditCard,
  Truck,
  Building2,
  ImageIcon,
  Upload,
} from "lucide-react";

import { endpoints } from "@/lib/api";
import { apiClient, fetcher, ApiError, NetworkError } from "@/lib/api-client";
import { type WhatsAppProfile, type BusinessSettings } from "@/types/api";
import { getSessionBusinessPhoneId } from "@/lib/business";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FALLBACK_INDUSTRIES } from "@/config/industries";
import { useIndustries } from "@/hooks/useIndustries";

const COUNTRY_CODE_MX = "+52";
const MEXICO_FLAG = "\uD83C\uDDF2\uD83C\uDDFD";
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

interface BusinessFormErrors {
  name?: string;
  type?: string;
  hours?: string;
  paymentMethods?: string;
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

  const handleTabChange = (value: string) => {
    if (!isSettingsTabValue(value)) return;
    setActiveTab(value);
    router.replace(`${pathname}?tab=${value}`, { scroll: false });
  };
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
    session
      && sessionBusinessPhoneId
      ? endpoints.business.settings
      : null,
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

  const { industriesMap, orderedRows } = useIndustries();
  const industrySelectOptions = useMemo(() => {
    if (orderedRows?.length) {
      return orderedRows.map((r) => ({ value: r.slug, label: r.label }));
    }
    return Object.entries(FALLBACK_INDUSTRIES).map(([value, cfg]) => ({
      value,
      label: cfg.label,
    }));
  }, [orderedRows]);

  // Business form state
  const [businessForm, setBusinessForm] = useState({
    name: "",
    type: "abarrotera",
    address: "",
    phone: "",
    description: "",
  });
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule>(EMPTY_WEEK_SCHEDULE);

  const PAYMENT_OPTIONS = ["Efectivo", "Transferencia SPEI", "Tarjeta débito", "Tarjeta crédito"];
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [deliveryZone, setDeliveryZone] = useState("");
  const [contactPhoneNumber, setContactPhoneNumber] = useState("");
  const [allowOrdersOutsideHours, setAllowOrdersOutsideHours] = useState(false);
  const [outOfHoursMessage, setOutOfHoursMessage] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

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
        type: settings.type || "abarrotera",
        address: settings.address || "",
        phone: settings.phone || "",
        description: settings.description || "",
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
      setOutOfHoursMessage(typeof cfg.out_of_hours_message === "string" ? cfg.out_of_hours_message : "");
      setContactPhoneNumber(getPhoneDigits(settings.phone || "").slice(-10));
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

  const handleSaveSettings = async () => {
    const nextErrors: BusinessFormErrors = {};
    const trimmedName = businessForm.name.trim();
    const trimmedType = businessForm.type.trim();
    const hasAtLeastOneOpenDay = Object.values(weekSchedule).some((day) => day.open);

    if (!trimmedName) {
      nextErrors.name = "El nombre del negocio es obligatorio.";
    }
    if (!trimmedType) {
      nextErrors.type = "Selecciona un tipo de negocio.";
    }
    if (!hasAtLeastOneOpenDay) {
      nextErrors.hours = "Activa al menos un día en tu horario de atención.";
    } else if (hasIncompleteHours(weekSchedule)) {
      nextErrors.hours = "Todos los días activos deben tener hora de apertura y cierre.";
    }
    if (paymentMethods.length === 0) {
      nextErrors.paymentMethods = "Selecciona al menos un método de pago.";
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

    // Validar horarios: si hay días activos sin horas, bloquear
    if (hasIncompleteHours(weekSchedule)) {
      toast({
        title: "Horarios incompletos",
        description: "Todos los días activos deben tener hora de apertura y cierre.",
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
          phone: buildPhoneForApi(contactPhoneNumber),
          hours: weekSchedule,
          config: {
            payment_methods: paymentMethods,
            delivery_zone: deliveryZone.trim() || null,
          },
          allow_orders_outside_hours: allowOrdersOutsideHours,
          out_of_hours_message: outOfHoursMessage.trim() || null,
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

  const currentLogoUrl = logoPreview ?? (typeof settings.config?.catalog_logo_url === "string" ? settings.config.catalog_logo_url : null);

  const handleLogoFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      toast({
        title: "Formato no permitido",
        description: "Usa JPG, PNG o WEBP para el logo.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      toast({
        title: "Archivo demasiado grande",
        description: "El logo debe ser menor a 5 MB.",
        variant: "destructive",
      });
      return;
    }

    if (logoPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(logoPreview);
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleUploadLogo = async () => {
    if (!logoFile) return;
    setIsUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", logoFile);
      await apiClient.uploadForm(endpoints.business.logoUpload, formData);
      await mutateSettings();
      setLogoFile(null);
      setLogoPreview(null);
      toast({
        title: "Logo actualizado",
        description: "El logo se subió y reemplazó correctamente.",
      });
    } catch (error: unknown) {
      let description = "No se pudo actualizar el logo. Intenta nuevamente.";
      if (error instanceof NetworkError) {
        description = error.message;
      } else if (error instanceof ApiError && error.message) {
        description = error.message;
      }
      toast({
        title: "Error al subir logo",
        description,
        variant: "destructive",
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
    };
  }, [logoPreview]);

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
            <TabsTrigger value="conectar" className="gap-1.5 flex-1 sm:flex-none">
              <Smartphone className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">Conectar</span>
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-1.5 flex-1 sm:flex-none">
              <MessageCircle className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">WhatsApp</span>
            </TabsTrigger>
            <TabsTrigger value="agente" className="gap-1.5 flex-1 sm:flex-none">
              <Bot className="h-4 w-4 shrink-0" />
              <span className="hidden xs:inline sm:inline">Agente</span>
            </TabsTrigger>
            <TabsTrigger value="plan" className="gap-1.5 flex-1 sm:flex-none">
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
                        <div className="space-y-2">
                          <Label htmlFor="biz-name" className="flex items-center gap-2">
                            <Store className="h-3.5 w-3.5 text-muted-foreground" />
                            Nombre del Negocio
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

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                            Tipo de negocio / Industria
                          </Label>
                          <Select
                            value={businessForm.type}
                            onValueChange={(val) =>
                              setBusinessForm((prev) => ({ ...prev, type: val }))
                            }
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
                            Determina cómo se llama y organiza tu catálogo (Catálogo, Menú, etc.)
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
                          </Label>
                          <HoursEditor value={weekSchedule} onChange={setWeekSchedule} />
                          {formErrors.hours && (
                            <p className="text-xs text-destructive flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5" />
                              {formErrors.hours}
                            </p>
                          )}
                          <div className="mt-3 space-y-2">
                            <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-amber-50/40 px-3 py-2.5">
                              <Checkbox
                                id="allow-orders-outside-hours"
                                checked={allowOrdersOutsideHours}
                                onCheckedChange={(v) => setAllowOrdersOutsideHours(!!v)}
                                className="mt-0.5"
                              />
                              <div className="space-y-0.5">
                                <label htmlFor="allow-orders-outside-hours" className="text-sm font-medium cursor-pointer leading-tight">
                                  Levantar pedidos fuera de horario
                                </label>
                                <p className="text-xs text-muted-foreground leading-snug">
                                  El agente seguirá atendiendo aunque el negocio esté cerrado. Los pedidos quedarán registrados para revisarlos al abrir.
                                </p>
                              </div>
                            </div>
                            {!allowOrdersOutsideHours && (
                              <div className="space-y-1">
                                <Label htmlFor="out-of-hours-msg" className="text-xs text-muted-foreground">
                                  Mensaje automático fuera de horario
                                </Label>
                                <Textarea
                                  id="out-of-hours-msg"
                                  value={outOfHoursMessage}
                                  onChange={(e) => setOutOfHoursMessage(e.target.value)}
                                  placeholder="¡Hola! En este momento estamos fuera de horario. Te atenderemos cuando abramos."
                                  rows={2}
                                  className="text-sm"
                                />
                              </div>
                            )}
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

                        <Separator />

                        <div className="space-y-3">
                          <Label className="flex items-center gap-2">
                            <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
                            Logo para catálogo/menú
                          </Label>
                          <div className="flex items-center gap-3">
                            {currentLogoUrl ? (
                              <Image
                                src={currentLogoUrl}
                                alt="Logo de negocio"
                                width={56}
                                height={56}
                                className="h-14 w-14 rounded-md border border-border object-cover"
                              />
                            ) : (
                              <div className="h-14 w-14 rounded-md border border-border bg-muted flex items-center justify-center text-muted-foreground">
                                <ImageIcon className="h-5 w-5" />
                              </div>
                            )}
                            <div className="flex flex-col gap-2">
                              <Input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoFileChange}
                                className="max-w-xs"
                              />
                              {logoFile && (
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={handleUploadLogo}
                                  disabled={isUploadingLogo}
                                  className="w-fit"
                                >
                                  {isUploadingLogo ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Upload className="h-4 w-4 mr-2" />
                                  )}
                                  Subir logo
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Se convierte y publica como imagen optimizada para tu catálogo/menú.
                          </p>
                        </div>

                        <Separator />

                        {/* Métodos de pago */}
                        <div className="space-y-3">
                          <Label className="flex items-center gap-2">
                            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                            Métodos de pago aceptados
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
                          {formErrors.paymentMethods && (
                            <p className="text-xs text-destructive flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5" />
                              {formErrors.paymentMethods}
                            </p>
                          )}
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
