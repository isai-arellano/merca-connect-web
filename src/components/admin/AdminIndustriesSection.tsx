"use client";

import { useState } from "react";
import useSWR from "swr";
import { Factory, Loader2, Pencil, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { endpoints } from "@/lib/api";
import { apiClient, fetcher } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import type { IndustryApiRow } from "@/config/industries";

type AdminIndustryRow = IndustryApiRow & {
  parent_slug?: string | null;
  is_selectable?: boolean;
};

export function AdminIndustriesSection() {
  const { toast } = useToast();
  const { data, isLoading, mutate } = useSWR<AdminIndustryRow[]>(endpoints.admin.industries, fetcher);
  const rows = data ?? [];

  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<AdminIndustryRow | null>(null);
  const [form, setForm] = useState({
    label: "",
    sort_order: 0,
    is_active: true,
    is_selectable: true,
    parent_slug: "",
  });
  const [createForm, setCreateForm] = useState({
    slug: "",
    label: "",
    view: "catalogo" as "catalogo" | "menu",
    clone_from: "abarrotera",
    sort_order: 100,
    parent_slug: "",
    is_selectable: true,
  });

  function openEdit(row: AdminIndustryRow) {
    setEditing(row);
    setForm({
      label: row.label,
      sort_order: row.sort_order,
      is_active: row.is_active,
      is_selectable: row.is_selectable !== false,
      parent_slug: row.parent_slug ?? "",
    });
    setEditOpen(true);
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      await apiClient.patch(endpoints.admin.industry(editing.slug), {
        label: form.label,
        sort_order: form.sort_order,
        is_active: form.is_active,
        is_selectable: form.is_selectable,
        parent_slug: form.parent_slug.trim() || null,
      });
      await mutate();
      setEditOpen(false);
      toast({ title: "Industria actualizada" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error al guardar";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function saveCreate() {
    const base = rows.find((r) => r.slug === createForm.clone_from);
    if (!base) {
      toast({ title: "Elige una industria base para clonar campos", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await apiClient.post(endpoints.admin.industries, {
        slug: createForm.slug.trim().toLowerCase(),
        label: createForm.label.trim(),
        view: createForm.view,
        product_label: base.product_label,
        product_fields: base.product_fields,
        relevant_units: base.relevant_units,
        features: base.features,
        sort_order: createForm.sort_order,
        is_active: true,
        parent_slug: createForm.parent_slug.trim() || null,
        is_selectable: createForm.is_selectable,
      });
      await mutate();
      setCreateOpen(false);
      setCreateForm({
        slug: "",
        label: "",
        view: "catalogo",
        clone_from: "abarrotera",
        sort_order: 100,
        parent_slug: "",
        is_selectable: true,
      });
      toast({ title: "Industria creada" });
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
            <Factory className="h-4 w-4" />
            Industrias (tipos de negocio)
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="ml-auto gap-1"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Nueva
            </Button>
          </CardTitle>
          <CardDescription>
            Slugs enlazan con el tipo de negocio del cliente. Las filas no seleccionables son grupos para futuras
            subcategorías.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin datos</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="p-2 font-medium">Slug</th>
                    <th className="p-2 font-medium">Etiqueta</th>
                    <th className="p-2 font-medium">Vista</th>
                    <th className="p-2 font-medium">Padre</th>
                    <th className="p-2 font-medium">Orden</th>
                    <th className="p-2 font-medium">Activo</th>
                    <th className="p-2 font-medium">Selectable</th>
                    <th className="p-2 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.slug} className="border-b border-border/60 last:border-0">
                      <td className="p-2 font-mono text-xs">{r.slug}</td>
                      <td className="p-2">{r.label}</td>
                      <td className="p-2">{r.view}</td>
                      <td className="p-2 font-mono text-xs">{r.parent_slug ?? "—"}</td>
                      <td className="p-2 tabular-nums">{r.sort_order}</td>
                      <td className="p-2">
                        {r.is_active ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Sí
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            No
                          </Badge>
                        )}
                      </td>
                      <td className="p-2">
                        {r.is_selectable === false ? (
                          <Badge variant="outline" className="text-[10px]">
                            Grupo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Sí
                          </Badge>
                        )}
                      </td>
                      <td className="p-2">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar {editing?.slug}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="ind-label">Etiqueta</Label>
              <Input
                id="ind-label"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ind-order">Orden</Label>
              <Input
                id="ind-order"
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ind-parent">Slug padre (opcional)</Label>
              <Input
                id="ind-parent"
                placeholder="ej. alimentos"
                value={form.parent_slug}
                onChange={(e) => setForm((f) => ({ ...f, parent_slug: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="ind-active">Activa</Label>
              <Switch
                id="ind-active"
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="ind-sel">Seleccionable en onboarding</Label>
              <Switch
                id="ind-sel"
                checked={form.is_selectable}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_selectable: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={saveEdit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva industria</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label htmlFor="ni-slug">Slug</Label>
              <Input
                id="ni-slug"
                placeholder="mi_industria"
                value={createForm.slug}
                onChange={(e) => setCreateForm((f) => ({ ...f, slug: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ni-label">Etiqueta</Label>
              <Input
                id="ni-label"
                value={createForm.label}
                onChange={(e) => setCreateForm((f) => ({ ...f, label: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Vista</Label>
              <Select
                value={createForm.view}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, view: v as "catalogo" | "menu" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="catalogo">Catálogo</SelectItem>
                  <SelectItem value="menu">Menú</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Clonar campos desde</Label>
              <Select
                value={createForm.clone_from}
                onValueChange={(v) => setCreateForm((f) => ({ ...f, clone_from: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rows.map((r) => (
                    <SelectItem key={r.slug} value={r.slug}>
                      {r.slug} — {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ni-order">Orden</Label>
              <Input
                id="ni-order"
                type="number"
                value={createForm.sort_order}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, sort_order: parseInt(e.target.value, 10) || 0 }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ni-parent">Slug padre (opcional)</Label>
              <Input
                id="ni-parent"
                value={createForm.parent_slug}
                onChange={(e) => setCreateForm((f) => ({ ...f, parent_slug: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="ni-sel">Seleccionable</Label>
              <Switch
                id="ni-sel"
                checked={createForm.is_selectable}
                onCheckedChange={(v) => setCreateForm((f) => ({ ...f, is_selectable: v }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button type="button" onClick={saveCreate} disabled={saving || !createForm.slug.trim()}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
