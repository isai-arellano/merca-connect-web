"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  Link,
  Smartphone,
  CreditCard,
  Truck,
  Building2,
} from "lucide-react";

import { endpoints } from "@/lib/api";
import { apiClient, fetcher, ApiError, NetworkError } from "@/lib/api-client";
import { type WhatsAppProfile, type BusinessSettings } from "@/types/api";
import { getSessionBusinessPhoneId } from "@/lib/business";
import { AgentTab } from "@/components/settings/AgentTab";
import { WhatsAppConnectTab } from "@/components/settings/WhatsAppConnectTab";
import { HoursEditor, hasIncompleteHours, type WeekSchedule, EMPTY_WEEK_SCHEDULE } from "@/components/settings/HoursEditor";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INDUSTRIES, type IndustryType } from "@/config/industries";

const COUNTRY_CODE_MX = "+52";
const MEXICO_FLAG = "\uD83C\uDDF2\uD83C\uDDFD";

interface BusinessFormErrors {
  name?: string;
  type?: string;
  slug?: string;
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
  exit: { opacity: 0, x: -10, transition: { duration: 0.15 } },
};

function SettingsPageInner() {
  const { data: session } = useSession();
  const sessionBusinessPhoneId = getSessionBusinessPhoneId(session);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "negocio");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingWa, setEditingWa] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);
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

  const settings: BusinessSettings =
    (settingsRes as { data: BusinessSettings } | null)?.data ??
    (settingsRes as BusinessSettings | null) ??
    {};
  const waProfile: WhatsAppProfile =
    (waProfileRes as { data: WhatsAppProfile } | null)?.data ??
    (waProfileRes as WhatsAppProfile | null) ??
    {};

  // Business form state
  const [businessForm, setBusinessForm] = useState({
    name: "",
    type: "abarrotera",
    address: "",
    phone: "",
    description: "",
    slug: "",
  });
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule>(EMPTY_WEEK_SCHEDULE);

  const PAYMENT_OPTIONS = ["Efectivo", "Transferencia SPEI", "Tarjeta débito", "Tarjeta crédito"];
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [deliveryZone, setDeliveryZone] = useState("");
  const [contactPhoneNumber, setContactPhoneNumber] = useState("");
  const [allowOrdersOutsideHours, setAllowOrdersOutsideHours] = useState(false);
  const [outOfHoursMessage, setOutOfHoursMessage] = useState("");

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
    const slugValue = businessForm.slug.trim();
    const hasAtLeastOneOpenDay = Object.values(weekSchedule).some((day) => day.open);

    if (!trimmedName) {
      nextErrors.name = "El nombre del negocio es obligatorio.";
    }
    if (!trimmedType) {
      nextErrors.type = "Selecciona un tipo de negocio.";
    }
    if (!slugValue) {
      nextErrors.slug = "La URL del catálogo es obligatoria.";
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

    if (slugValue && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugValue)) {
      setSlugError("Solo letras minúsculas, números y guiones. Ej: mi-tienda");
      return;
    }
    if (slugValue && (slugValue.length < 3 || slugValue.length > 100)) {
      setSlugError("Debe tener entre 3 y 100 caracteres.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSlugError(null);
    try {
      await apiClient.patch(
        endpoints.business.settings,
        {
          ...businessForm,
          name: trimmedName,
          type: trimmedType,
          phone: buildPhoneForApi(contactPhoneNumber),
          slug: slugValue || null,
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
      if (error instanceof ApiError && error.status === 409) {
        setSlugError("Este slug ya está en uso. Elige uno diferente.");
      } else if (error instanceof NetworkError) {
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex flex-wrap h-auto gap-1 p-1 sm:grid sm:grid-cols-4">
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
          </TabsList>

          {/* NEGOCIO TAB */}
          <AnimatePresence>
            <TabsContent value="negocio" key="negocio">
              <motion.div
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
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
                              {(Object.entries(INDUSTRIES) as [IndustryType, typeof INDUSTRIES[IndustryType]][]).map(([key, cfg]) => (
                                <SelectItem key={key} value={key}>
                                  {cfg.label}
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

                        {/* Catálogo público — slug */}
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor="biz-slug" className="flex items-center gap-2">
                              <Link className="h-3.5 w-3.5 text-muted-foreground" />
                              URL del Catálogo Público
                            </Label>
                            <p className="text-xs text-muted-foreground mt-1">
                              Identificador único para tu catálogo público. Solo letras minúsculas, números y guiones.
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground shrink-0 hidden sm:inline">
                              /catalogo/
                            </span>
                            <Input
                              id="biz-slug"
                              value={businessForm.slug}
                              onChange={(e) => {
                                setSlugError(null);
                                setBusinessForm((prev) => ({
                                  ...prev,
                                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                                }));
                              }}
                              placeholder="mi-tienda"
                              className={slugError || formErrors.slug ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                          </div>
                          {formErrors.slug && (
                            <p className="text-xs text-destructive flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5" />
                              {formErrors.slug}
                            </p>
                          )}
                          {slugError && (
                            <p className="text-xs text-destructive flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5" />
                              {slugError}
                            </p>
                          )}
                          {businessForm.slug && !slugError && (
                            <a
                              href={`/catalogo/${businessForm.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              /catalogo/{businessForm.slug}
                            </a>
                          )}
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
            <TabsContent value="conectar" key="conectar">
              <motion.div
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <WhatsAppConnectTab />
              </motion.div>
            </TabsContent>

            {/* WHATSAPP TAB */}
            <TabsContent value="whatsapp" key="whatsapp">
              <motion.div
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
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
                              <img
                                src={waProfile.profile_picture_url}
                                alt="Perfil"
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
            <TabsContent value="agente" key="agente">
              <motion.div
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <AgentTab />
              </motion.div>
            </TabsContent>
          </AnimatePresence>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsPageInner />
    </Suspense>
  );
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
