"use client";

import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { endpoints } from "@/lib/api";
import { apiClient, ApiError, NetworkError } from "@/lib/api-client";
import { type BusinessSettings } from "@/types/api";
import {
  HoursEditor,
  hasIncompleteHours,
  type WeekSchedule,
  EMPTY_WEEK_SCHEDULE,
} from "@/components/settings/HoursEditor";
const COUNTRY_CODE_MX = "+52";

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

const PAYMENT_OPTIONS = ["Efectivo", "Transferencia SPEI", "Tarjeta débito", "Tarjeta crédito"];

interface BusinessSetupSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: BusinessSettings;
  onSaved: () => void;
}

export function BusinessSetupSheet({ open, onOpenChange, settings, onSaved }: BusinessSetupSheetProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [businessForm, setBusinessForm] = useState({
    name: "",
    type: "abarrotera",
    address: "",
    phone: "",
    description: "",
    slug: "",
  });
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule>(EMPTY_WEEK_SCHEDULE);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [deliveryZone, setDeliveryZone] = useState("");
  const [contactPhoneNumber, setContactPhoneNumber] = useState("");
  const [allowOrdersOutsideHours, setAllowOrdersOutsideHours] = useState(false);
  const [outOfHoursMessage, setOutOfHoursMessage] = useState("");

  useEffect(() => {
    if (!open || !settings || Object.keys(settings).length === 0) return;
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
    setDeliveryZone(typeof cfg.delivery_zone === "string" ? cfg.delivery_zone : "");
    setAllowOrdersOutsideHours(!!cfg.allow_orders_outside_hours);
    setOutOfHoursMessage(typeof cfg.out_of_hours_message === "string" ? cfg.out_of_hours_message : "");
    setContactPhoneNumber(getPhoneDigits(settings.phone || "").slice(-10));
  }, [open, settings]);

  const handleSave = async () => {
    const trimmedName = businessForm.name.trim();
    const slugValue = businessForm.slug.trim();
    const hasAtLeastOneOpenDay = Object.values(weekSchedule).some((day) => day.open);

    if (!trimmedName) {
      toast({ title: "Nombre obligatorio", variant: "destructive" });
      return;
    }
    if (!slugValue) {
      toast({ title: "URL del catálogo obligatoria", variant: "destructive" });
      return;
    }
    if (!hasAtLeastOneOpenDay || hasIncompleteHours(weekSchedule)) {
      toast({
        title: "Horario incompleto",
        description: "Activa al menos un día con hora de apertura y cierre.",
        variant: "destructive",
      });
      return;
    }
    if (paymentMethods.length === 0) {
      toast({ title: "Método de pago", description: "Selecciona al menos uno.", variant: "destructive" });
      return;
    }
    if (slugValue && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugValue)) {
      setSlugError("Solo letras minúsculas, números y guiones.");
      return;
    }
    if (slugValue.length < 3 || slugValue.length > 100) {
      setSlugError("El slug debe tener entre 3 y 100 caracteres.");
      return;
    }

    setSaving(true);
    setSlugError(null);
    try {
      await apiClient.patch(endpoints.business.settings, {
        ...businessForm,
        name: trimmedName,
        type: businessForm.type.trim(),
        phone: buildPhoneForApi(contactPhoneNumber),
        slug: slugValue || null,
        hours: weekSchedule,
        config: {
          payment_methods: paymentMethods,
          delivery_zone: deliveryZone.trim() || null,
          catalog_theme: {
            preset: "default",
          },
        },
        allow_orders_outside_hours: allowOrdersOutsideHours,
        out_of_hours_message: outOfHoursMessage.trim() || null,
      });
      toast({ title: "Datos guardados", description: "Tu negocio quedó configurado." });
      onSaved();
      onOpenChange(false);
    } catch (error: unknown) {
      if (error instanceof ApiError && error.status === 409) {
        setSlugError("Este slug ya está en uso.");
      } else if (error instanceof NetworkError) {
        toast({ title: "Error de red", description: error.message, variant: "destructive" });
      } else if (error instanceof ApiError) {
        toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Error al guardar", variant: "destructive" });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Configura tu negocio</SheetTitle>
          <SheetDescription>
            Datos básicos, horario, URL pública y métodos de pago. Tema visual: Default (contraste oscuro con acentos verdes).
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="ob-name">Nombre del negocio</Label>
            <Input
              id="ob-name"
              value={businessForm.name}
              onChange={(e) => setBusinessForm((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ob-slug">URL pública (slug)</Label>
            <Input
              id="ob-slug"
              value={businessForm.slug}
              onChange={(e) => {
                setSlugError(null);
                setBusinessForm((p) => ({
                  ...p,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                }));
              }}
            />
            {slugError && <p className="text-xs text-destructive">{slugError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="ob-phone">Teléfono de contacto</Label>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-3 rounded-md border border-input bg-muted/50 text-sm text-muted-foreground shrink-0 select-none">
                <span className="text-base leading-none">🇲🇽</span>
                <span>+52</span>
              </div>
              <Input
                id="ob-phone"
                inputMode="numeric"
                placeholder="10 dígitos"
                value={contactPhoneNumber}
                onChange={(e) => {
                  const sanitized = sanitizePhoneInput(e.target.value);
                  setContactPhoneNumber(sanitized);
                  setBusinessForm((p) => ({ ...p, phone: buildPhoneForApi(sanitized) }));
                }}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">Solo México por ahora. Ingresa 10 dígitos sin código de país.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ob-address">Dirección</Label>
            <Input
              id="ob-address"
              value={businessForm.address}
              onChange={(e) => setBusinessForm((p) => ({ ...p, address: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Horario</Label>
            <HoursEditor value={weekSchedule} onChange={setWeekSchedule} />
          </div>
          <div className="space-y-2">
            <Label>Métodos de pago</Label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_OPTIONS.map((method) => (
                <div key={method} className="flex items-center gap-2">
                  <Checkbox
                    id={`ob-pay-${method}`}
                    checked={paymentMethods.includes(method)}
                    onCheckedChange={(checked) => {
                      setPaymentMethods((prev) =>
                        checked ? [...prev, method] : prev.filter((m) => m !== method)
                      );
                    }}
                  />
                  <label htmlFor={`ob-pay-${method}`} className="text-sm cursor-pointer">
                    {method}
                  </label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-lg border px-3 py-2">
            <Checkbox
              id="ob-outside"
              checked={allowOrdersOutsideHours}
              onCheckedChange={(v) => setAllowOrdersOutsideHours(!!v)}
            />
            <label htmlFor="ob-outside" className="text-sm leading-tight cursor-pointer">
              Permitir pedidos fuera de horario
            </label>
          </div>
          {!allowOrdersOutsideHours && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Mensaje fuera de horario</Label>
              <Textarea
                value={outOfHoursMessage}
                onChange={(e) => setOutOfHoursMessage(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="ob-delivery">Zona de entrega (opcional)</Label>
            <Input
              id="ob-delivery"
              value={deliveryZone}
              onChange={(e) => setDeliveryZone(e.target.value)}
            />
          </div>
        </div>
        <SheetFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Guardar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
