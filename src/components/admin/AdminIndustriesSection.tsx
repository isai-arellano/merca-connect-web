"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { useSWRConfig } from "swr";
import { ChevronDown, Factory, Loader2, Pencil, Plus } from "lucide-react";
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
import { useIndustries } from "@/hooks/useIndustries";
import type { IndustryApiRow } from "@/config/industries";

type AdminIndustryRow = IndustryApiRow & {
  parent_slug?: string | null;
  is_selectable?: boolean;
};

type SortMode = "label-asc" | "label-desc" | "slug-asc";
type ViewFilter = "all" | "catalogo" | "menu";
type ActiveFilter = "all" | "active" | "inactive";
type EligibilityFilter = "all" | "selectable" | "group";

const LOCALE_ES = "es";

function applyIndustryFilters(
  rows: AdminIndustryRow[],
  view: ViewFilter,
  active: ActiveFilter,
  eligibility: EligibilityFilter,
): AdminIndustryRow[] {
  return rows.filter((r) => {
    if (view !== "all" && r.view !== view) return false;
    if (active === "active" && !r.is_active) return false;
    if (active === "inactive" && r.is_active) return false;
    if (eligibility === "selectable" && r.is_selectable === false) return false;
    if (eligibility === "group" && r.is_selectable !== false) return false;
    return true;
  });
}

function sortIndustryRows(rows: AdminIndustryRow[], mode: SortMode): AdminIndustryRow[] {
  const out = [...rows];
  if (mode === "label-asc") {
    out.sort((a, b) => a.label.localeCompare(b.label, LOCALE_ES));
  } else if (mode === "label-desc") {
    out.sort((a, b) => b.label.localeCompare(a.label, LOCALE_ES));
  } else {
    out.sort((a, b) => a.slug.localeCompare(b.slug, LOCALE_ES));
  }
  return out;
}

function IndustryTable({
  rows,
  onEdit,
}: {
  rows: AdminIndustryRow[];
  onEdit: (row: AdminIndustryRow) => void;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center border rounded-lg border-dashed">
        Sin filas con estos criterios.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
            <th className="p-2 font-medium">Slug</th>
            <th className="p-2 font-medium">Etiqueta</th>
            <th className="p-2 font-medium">Vista</th>
            <th className="p-2 font-medium">Padre</th>
            <th className="p-2 font-medium">Activo</th>
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
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(r)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IndustryFiltersToolbar({
  sortMode,
  onSortMode,
  viewFilter,
  onViewFilter,
  activeFilter,
  onActiveFilter,
  eligibilityFilter,
  onEligibilityFilter,
}: {
  sortMode: SortMode;
  onSortMode: (v: SortMode) => void;
  viewFilter: ViewFilter;
  onViewFilter: (v: ViewFilter) => void;
  activeFilter: ActiveFilter;
  onActiveFilter: (v: ActiveFilter) => void;
  eligibilityFilter: EligibilityFilter;
  onEligibilityFilter: (v: EligibilityFilter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div className="space-y-1.5 min-w-[140px]">
        <Label className="text-xs text-muted-foreground">Ordenar</Label>
        <Select value={sortMode} onValueChange={(v) => {
          if (v === "label-asc" || v === "label-desc" || v === "slug-asc") onSortMode(v);
        }}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="label-asc">Etiqueta A → Z</SelectItem>
            <SelectItem value="label-desc">Etiqueta Z → A</SelectItem>
            <SelectItem value="slug-asc">Slug A → Z</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 min-w-[130px]">
        <Label className="text-xs text-muted-foreground">Vista</Label>
        <Select value={viewFilter} onValueChange={(v) => {
          if (v === "all" || v === "catalogo" || v === "menu") onViewFilter(v);
        }}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="catalogo">Catálogo</SelectItem>
            <SelectItem value="menu">Menú</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 min-w-[130px]">
        <Label className="text-xs text-muted-foreground">Estado</Label>
        <Select value={activeFilter} onValueChange={(v) => {
          if (v === "all" || v === "active" || v === "inactive") onActiveFilter(v);
        }}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="active">Activas</SelectItem>
            <SelectItem value="inactive">Inactivas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5 min-w-[160px]">
        <Label className="text-xs text-muted-foreground">En configuración</Label>
        <Select value={eligibilityFilter} onValueChange={(v) => {
          if (v === "all" || v === "selectable" || v === "group") onEligibilityFilter(v);
        }}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="selectable">Elegibles (lista en Config.)</SelectItem>
            <SelectItem value="group">Solo grupos</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export function AdminIndustriesSection() {
  const { toast } = useToast();
  const { mutate: globalMutate } = useSWRConfig();
  const { orderedRows, isLoading: eligibleLoading } = useIndustries();

  const { data: allData, isLoading: allLoading, mutate: mutateAdminList } = useSWR<AdminIndustryRow[]>(
    endpoints.admin.industries,
    fetcher,
  );

  const extraRows = useMemo(() => {
    const all = allData ?? [];
    if (!all.length) return [];
    const slugs = new Set((orderedRows ?? []).map((r) => r.slug));
    return all.filter((r) => !slugs.has(r.slug));
  }, [allData, orderedRows]);

  const [sortMode, setSortMode] = useState<SortMode>("label-asc");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [eligibilityFilter, setEligibilityFilter] = useState<EligibilityFilter>("all");

  /** Lista principal: siempre activas + elegibles (API); solo orden y vista. */
  const displayedEligible = useMemo(() => {
    const base = (orderedRows ?? []) as AdminIndustryRow[];
    const byView =
      viewFilter === "all" ? base : base.filter((r) => r.view === viewFilter);
    return sortIndustryRows(byView, sortMode);
  }, [orderedRows, viewFilter, sortMode]);

  /** Grupos e inactivas: aplican todos los filtros. */
  const displayedExtra = useMemo(() => {
    const f = applyIndustryFilters(extraRows, viewFilter, activeFilter, eligibilityFilter);
    return sortIndustryRows(f, sortMode);
  }, [extraRows, viewFilter, activeFilter, eligibilityFilter, sortMode]);

  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<AdminIndustryRow | null>(null);
  const [form, setForm] = useState({
    label: "",
    is_active: true,
    is_selectable: true,
    parent_slug: "",
  });
  const [createForm, setCreateForm] = useState({
    slug: "",
    label: "",
    view: "catalogo" as "catalogo" | "menu",
    clone_from: "abarrotera",
    parent_slug: "",
    is_selectable: true,
  });

  async function refreshIndustryCaches() {
    await Promise.all([globalMutate(endpoints.industries.list), mutateAdminList()]);
  }

  function openCreateDialog() {
    const firstSlug = (orderedRows ?? [])[0]?.slug ?? "abarrotera";
    setCreateForm((f) => ({ ...f, clone_from: firstSlug }));
    setCreateOpen(true);
  }

  function openEdit(row: AdminIndustryRow) {
    setEditing(row);
    setForm({
      label: row.label,
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
        is_active: form.is_active,
        is_selectable: form.is_selectable,
        parent_slug: form.parent_slug.trim() || null,
      });
      await refreshIndustryCaches();
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
    const base = (orderedRows ?? []).find((r) => r.slug === createForm.clone_from);
    if (!base) {
      toast({
        title: "Elige una industria base",
        description: "No hay industrias elegibles para clonar. Revisa la lista en Configuración.",
        variant: "destructive",
      });
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
        is_active: true,
        parent_slug: createForm.parent_slug.trim() || null,
        is_selectable: createForm.is_selectable,
      });
      await refreshIndustryCaches();
      setCreateOpen(false);
      setCreateForm({
        slug: "",
        label: "",
        view: "catalogo",
        clone_from: (orderedRows ?? [])[0]?.slug ?? "abarrotera",
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

  const listLoading = eligibleLoading || allLoading;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base flex-wrap">
            <Factory className="h-4 w-4" />
            Industrias (tipos de negocio)
            <Button type="button" variant="outline" size="sm" className="ml-auto gap-1" onClick={openCreateDialog}>
              <Plus className="h-3.5 w-3.5" />
              Nueva
            </Button>
          </CardTitle>
          <CardDescription>
            Misma lista base que <strong>Tipo de negocio / Industria</strong> en Configuración.             El orden es por los filtros de abajo (ya no hay columna “Orden” en base de datos). Los filtros{" "}
            <strong>Estado</strong> y <strong>En configuración</strong> aplican a la sección de grupos/inactivas.{" "}
            <strong>Elegible en Configuración</strong> se edita al crear o editar una fila.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <IndustryFiltersToolbar
            sortMode={sortMode}
            onSortMode={setSortMode}
            viewFilter={viewFilter}
            onViewFilter={setViewFilter}
            activeFilter={activeFilter}
            onActiveFilter={setActiveFilter}
            eligibilityFilter={eligibilityFilter}
            onEligibilityFilter={setEligibilityFilter}
          />

          {listLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (orderedRows ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin industrias elegibles en la API. Comprueba el seed o la conexión.</p>
          ) : (
            <IndustryTable rows={displayedEligible} onEdit={openEdit} />
          )}

          {!listLoading && extraRows.length > 0 ? (
            <details className="group rounded-lg border border-dashed border-border/60 bg-muted/20 p-3">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-muted-foreground">
                <ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180" />
                Otras filas (grupos e inactivas) — {displayedExtra.length} con filtros actuales
              </summary>
              <div className="mt-3">
                <IndustryTable rows={displayedExtra} onEdit={openEdit} />
              </div>
            </details>
          ) : null}
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
              <Label htmlFor="ind-sel">Elegible en Configuración (no grupo)</Label>
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
                onValueChange={(v) => {
                  if (v === "catalogo" || v === "menu") {
                    setCreateForm((f) => ({ ...f, view: v }));
                  }
                }}
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
                  {(orderedRows ?? []).map((r) => (
                    <SelectItem key={r.slug} value={r.slug}>
                      {r.slug} — {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="ni-sel">Elegible en Configuración</Label>
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
