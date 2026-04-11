"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Store,
  MessageCircle,
  Webhook,
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
  CircleDot,
  Bot,
  Link,
} from "lucide-react";

import { endpoints } from "@/lib/api";
import { apiClient, fetcher, ApiError } from "@/lib/api-client";
import { getSessionBusinessPhoneId } from "@/lib/business";
import { AgentTab } from "@/components/settings/AgentTab";
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

export default function SettingsPage() {
  const { data: session } = useSession();
  const sessionBusinessPhoneId = getSessionBusinessPhoneId(session);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("negocio");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editingWa, setEditingWa] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  // Business settings
  const {
    data: settingsRes,
    isLoading: settingsLoading,
    mutate: mutateSettings,
  } = useSWR(
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
  } = useSWR(
    session
      && sessionBusinessPhoneId
      ? endpoints.business.whatsappProfile
      : null,
    fetcher
  );

  const settings = settingsRes?.data || settingsRes || {};
  const waProfile = waProfileRes?.data || waProfileRes || {};

  // Business form state
  const [businessForm, setBusinessForm] = useState({
    name: "",
    address: "",
    phone: "",
    description: "",
    slug: "",
  });
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule>(EMPTY_WEEK_SCHEDULE);

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
        address: settings.address || "",
        phone: settings.phone || "",
        description: settings.description || "",
        slug: settings.slug || "",
      });
      if (settings.hours && typeof settings.hours === "object") {
        setWeekSchedule({ ...EMPTY_WEEK_SCHEDULE, ...settings.hours });
      }
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
    // Validar horarios: si hay días activos sin horas, bloquear
    if (hasIncompleteHours(weekSchedule)) {
      toast({
        title: "Horarios incompletos",
        description: "Todos los días activos deben tener hora de apertura y cierre.",
        variant: "destructive",
      });
      return;
    }

    // Basic slug format validation before sending
    const slugValue = businessForm.slug.trim();
    if (slugValue && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugValue)) {
      setSlugError("Solo letras minúsculas, números y guiones. Ej: mi-tienda");
      return;
    }
    if (slugValue && (slugValue.length < 3 || slugValue.length > 100)) {
      setSlugError("Debe tener entre 3 y 100 caracteres.");
      return;
    }

    setSaving(true);
    setSlugError(null);
    try {
      await apiClient.patch(
        endpoints.business.settings,
        { ...businessForm, slug: slugValue || null, hours: weekSchedule }
      );
      mutateSettings();
      setSaved(true);
      setSaveError(null);
      setTimeout(() => setSaved(false), 3000);
      toast({
        title: "Configuración guardada",
        description: "Los datos del negocio se actualizaron correctamente.",
      });
    } catch (error: unknown) {
      console.error("Error al guardar configuración:", error);
      if (error instanceof ApiError && error.status === 409) {
        setSlugError("Este slug ya está en uso. Elige uno diferente.");
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
      className="space-y-6 max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Configuración
        </h1>
        <p className="text-muted-foreground mt-2">
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="negocio" className="gap-2">
              <Store className="h-4 w-4" />
              Negocio
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="gap-2">
              <Webhook className="h-4 w-4" />
              Webhooks
            </TabsTrigger>
            <TabsTrigger value="agente" className="gap-2">
              <Bot className="h-4 w-4" />
              Agente
            </TabsTrigger>
          </TabsList>

          {/* NEGOCIO TAB */}
          <AnimatePresence mode="wait">
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
                          />
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
                          <Input
                            id="biz-phone"
                            value={businessForm.phone}
                            onChange={(e) =>
                              setBusinessForm((prev) => ({
                                ...prev,
                                phone: e.target.value,
                              }))
                            }
                            placeholder="+52 55 1234 5678"
                          />
                          <p className="text-xs text-muted-foreground">
                            Teléfono de atención al cliente (puede ser diferente al número de WhatsApp).
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            Horario de atención
                          </Label>
                          <HoursEditor value={weekSchedule} onChange={setWeekSchedule} />
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
                              className={slugError ? "border-destructive focus-visible:ring-destructive" : ""}
                            />
                          </div>
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

            {/* WEBHOOKS TAB */}
            <TabsContent value="webhooks" key="webhooks">
              <motion.div
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de Webhooks</CardTitle>
                    <CardDescription>
                      Estado actual de la conexión con la API de WhatsApp Cloud.
                      Esta configuración es de solo lectura.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Status */}
                    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10">
                          <CircleDot className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            Estado del Webhook
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Conexión con Meta WhatsApp Cloud API
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="default"
                        className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                      >
                        <span className="relative flex h-2 w-2 mr-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        Activo
                      </Badge>
                    </div>

                    <Separator />

                    {/* Webhook URL */}
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                        URL del Webhook
                      </Label>
                      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border border-border font-mono text-sm">
                        <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate text-foreground">
                          https://api.kolyn.io/webhooks/whatsapp
                        </span>
                      </div>
                    </div>

                    {/* Events */}
                    <div className="space-y-3">
                      <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                        Eventos Suscritos
                      </Label>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[
                          {
                            event: "messages",
                            label: "Mensajes entrantes",
                            active: true,
                          },
                          {
                            event: "message_status",
                            label: "Estado de mensajes",
                            active: true,
                          },
                          {
                            event: "message_template_status_update",
                            label: "Estado de templates",
                            active: true,
                          },
                          {
                            event: "phone_number_quality_update",
                            label: "Calidad del número",
                            active: false,
                          },
                        ].map((item) => (
                          <div
                            key={item.event}
                            className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {item.label}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {item.event}
                              </p>
                            </div>
                            <Badge
                              variant={item.active ? "default" : "secondary"}
                              className="text-xs"
                            >
                              {item.active ? "Activo" : "Inactivo"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-sm">
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-muted-foreground">
                        La configuración de webhooks se administra desde el panel
                        de Meta for Developers. Contacta al equipo de desarrollo
                        para realizar cambios.
                      </p>
                    </div>
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
