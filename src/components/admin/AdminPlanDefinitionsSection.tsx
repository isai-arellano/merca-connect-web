"use client";

import { useState } from "react";
import useSWR from "swr";
import { CreditCard, Loader2, Pencil, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { endpoints } from "@/lib/api";
import { apiClient, fetcher } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import type { PlanDefinitionAdmin } from "@/types/api";

export function AdminPlanDefinitionsSection() {
  const { toast } = useToast();
  const { data, isLoading, mutate } = useSWR<PlanDefinitionAdmin[]>(endpoints.admin.planDefinitions, fetcher);
  const rows = data ?? [];

  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<PlanDefinitionAdmin | null>(null);
  const [createForm, setCreateForm] = useState({
    plan_key: "",
    display_name: "",
    conv_limit: 1000,
    max_seats: 1,
    history_days: 60,
    price_mxn: 999,
    extra_conv_price_mxn: 3.5,
    catalog_limit_str: "50",
    product_image_limit: 3,
  });
  const [form, setForm] = useState({
    display_name: "",
    conv_limit: 0,
    max_seats: 1,
    history_days: 30,
    price_mxn: 0,
    extra_conv_price_mxn: 0,
    catalog_limit_str: "" as string,
    product_image_limit: 1,
  });

  function openEdit(row: PlanDefinitionAdmin) {
    setEditing(row);
    setForm({
      display_name: row.display_name,
      conv_limit: row.conv_limit,
      max_seats: row.max_seats,
      history_days: row.history_days,
      price_mxn: row.price_mxn,
      extra_conv_price_mxn: row.extra_conv_price_mxn,
      catalog_limit_str:
        row.catalog_product_limit === null || row.catalog_product_limit === undefined
          ? ""
          : String(row.catalog_product_limit),
      product_image_limit: row.product_image_limit ?? 1,
    });
    setEditOpen(true);
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    try {
      const trimmed = form.catalog_limit_str.trim();
      let catalog_product_limit: number | null = null;
      if (trimmed !== "") {
        const n = parseInt(trimmed, 10);
        if (Number.isNaN(n)) {
          toast({ title: "Límite de catálogo inválido", variant: "destructive" });
          setSaving(false);
          return;
        }
        catalog_product_limit = n;
      }
      await apiClient.patch(endpoints.admin.planDefinition(editing.plan_key), {
        display_name: form.display_name,
        conv_limit: form.conv_limit,
        max_seats: form.max_seats,
        history_days: form.history_days,
        price_mxn: form.price_mxn,
        extra_conv_price_mxn: form.extra_conv_price_mxn,
        catalog_product_limit,
        product_image_limit: Math.min(3, Math.max(1, form.product_image_limit)),
      });
      await mutate();
      setEditOpen(false);
      toast({ title: "Plan actualizado" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al guardar";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function parseCatalogLimit(s: string): { ok: true; value: number | null } | { ok: false } {
    const t = s.trim();
    if (t === "") return { ok: true, value: null };
    const n = parseInt(t, 10);
    if (Number.isNaN(n)) return { ok: false };
    return { ok: true, value: n };
  }

  async function saveCreate() {
    const pk = createForm.plan_key.trim().toLowerCase();
    if (!pk) {
      toast({ title: "Indica la clave del plan (plan_key)", variant: "destructive" });
      return;
    }
    const cat = parseCatalogLimit(createForm.catalog_limit_str);
    if (!cat.ok) {
      toast({ title: "Límite de catálogo inválido", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(endpoints.admin.planDefinitions, {
        plan_key: pk,
        display_name: createForm.display_name.trim() || pk,
        conv_limit: createForm.conv_limit,
        max_seats: createForm.max_seats,
        history_days: createForm.history_days,
        price_mxn: createForm.price_mxn,
        extra_conv_price_mxn: createForm.extra_conv_price_mxn,
        catalog_product_limit: cat.value,
        product_image_limit: Math.min(3, Math.max(1, createForm.product_image_limit)),
      });
      await mutate();
      setCreateOpen(false);
      setCreateForm({
        plan_key: "",
        display_name: "",
        conv_limit: 1000,
        max_seats: 1,
        history_days: 60,
        price_mxn: 999,
        extra_conv_price_mxn: 3.5,
        catalog_limit_str: "50",
        product_image_limit: 3,
      });
      toast({ title: "Plan creado" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al crear";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base flex-wrap">
            <CreditCard className="h-4 w-4" />
            Planes y límites
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-auto gap-1"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Nuevo plan
            </Button>
          </CardTitle>
          <CardDescription>
            Toda la configuración numérica sale de la tabla <code className="text-xs">plan_definitions</code> (sin
            constantes en código): precio MXN/mes, conversaciones incluidas y extra, asientos, días de historial y
            máximo de productos en catálogo público por plan. Vacío en “Catálogo (máx.)” = sin tope (típico en Pro).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay filas en <code className="text-xs">plan_definitions</code>. Ejecuta migraciones en la API.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-xs sm:text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wide">
                    <th className="p-2 font-medium">Plan</th>
                    <th className="p-2 font-medium">Conv.</th>
                    <th className="p-2 font-medium">Asientos</th>
                    <th className="p-2 font-medium">Hist. días</th>
                    <th className="p-2 font-medium">Precio</th>
                    <th className="p-2 font-medium">Extra conv.</th>
                    <th className="p-2 font-medium">Catálogo máx.</th>
                    <th className="p-2 font-medium">Img / prod.</th>
                    <th className="p-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.plan_key} className="border-b border-border/60 last:border-0">
                      <td className="p-2 font-medium">{r.display_name}</td>
                      <td className="p-2 tabular-nums">{r.conv_limit}</td>
                      <td className="p-2 tabular-nums">{r.max_seats}</td>
                      <td className="p-2 tabular-nums">{r.history_days}</td>
                      <td className="p-2 tabular-nums">${r.price_mxn}</td>
                      <td className="p-2 tabular-nums">${r.extra_conv_price_mxn.toFixed(2)}</td>
                      <td className="p-2 tabular-nums">{r.catalog_product_limit ?? "∞"}</td>
                      <td className="p-2 tabular-nums">{r.product_image_limit ?? 1}</td>
                      <td className="p-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEdit(r)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar plan {editing?.plan_key}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Nombre visible</Label>
              <Input
                value={form.display_name}
                onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Conversaciones / mes</Label>
                <Input
                  type="number"
                  value={form.conv_limit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, conv_limit: parseInt(e.target.value, 10) || 0 }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Asientos</Label>
                <Input
                  type="number"
                  value={form.max_seats}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, max_seats: parseInt(e.target.value, 10) || 1 }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Historial (días)</Label>
              <Input
                type="number"
                value={form.history_days}
                onChange={(e) =>
                  setForm((f) => ({ ...f, history_days: parseInt(e.target.value, 10) || 1 }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Precio MXN/mes</Label>
                <Input
                  type="number"
                  value={form.price_mxn}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price_mxn: parseInt(e.target.value, 10) || 0 }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Extra conv. MXN</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.extra_conv_price_mxn}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      extra_conv_price_mxn: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Productos en catálogo público (máx.)</Label>
              <Input
                placeholder="Vacío = sin límite"
                value={form.catalog_limit_str}
                onChange={(e) => setForm((f) => ({ ...f, catalog_limit_str: e.target.value }))}
              />
              <p className="text-[10px] text-muted-foreground">
                Limita cuántos productos activos se muestran en el catálogo web del negocio.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Imágenes por producto (máx.)</Label>
              <Input
                type="number"
                min={1}
                max={3}
                value={form.product_image_limit}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    product_image_limit: parseInt(e.target.value, 10) || 1,
                  }))
                }
              />
              <p className="text-[10px] text-muted-foreground">
                En el panel se permiten hasta 3 por producto; el plan puede limitar a 1 en planes básicos.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuevo plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Clave (plan_key)</Label>
              <Input
                placeholder="ej. enterprise"
                value={createForm.plan_key}
                onChange={(e) => setCreateForm((f) => ({ ...f, plan_key: e.target.value }))}
              />
              <p className="text-[10px] text-muted-foreground">Minúsculas y guión bajo; debe coincidir con businesses.plan.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Nombre visible</Label>
              <Input
                value={createForm.display_name}
                onChange={(e) => setCreateForm((f) => ({ ...f, display_name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Conversaciones / mes</Label>
                <Input
                  type="number"
                  value={createForm.conv_limit}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, conv_limit: parseInt(e.target.value, 10) || 0 }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Asientos</Label>
                <Input
                  type="number"
                  value={createForm.max_seats}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, max_seats: parseInt(e.target.value, 10) || 1 }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Historial (días)</Label>
              <Input
                type="number"
                value={createForm.history_days}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, history_days: parseInt(e.target.value, 10) || 1 }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Precio MXN/mes</Label>
                <Input
                  type="number"
                  value={createForm.price_mxn}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, price_mxn: parseInt(e.target.value, 10) || 0 }))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Extra conv. MXN</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={createForm.extra_conv_price_mxn}
                  onChange={(e) =>
                    setCreateForm((f) => ({
                      ...f,
                      extra_conv_price_mxn: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Productos catálogo público (máx.)</Label>
              <Input
                placeholder="Vacío = sin límite"
                value={createForm.catalog_limit_str}
                onChange={(e) => setCreateForm((f) => ({ ...f, catalog_limit_str: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Imágenes por producto (máx.)</Label>
              <Input
                type="number"
                min={1}
                max={3}
                value={createForm.product_image_limit}
                onChange={(e) =>
                  setCreateForm((f) => ({
                    ...f,
                    product_image_limit: parseInt(e.target.value, 10) || 1,
                  }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={saveCreate} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
