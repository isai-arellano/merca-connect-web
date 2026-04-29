"use client";

import { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Edit2,
  X,
  Check,
  Utensils, Pizza, Coffee, IceCream, Soup, Cookie, Croissant, 
  Beef, Cake, Fish, Apple, Cherry, Grape, Sandwich, Beer, 
  Drumstick, Flame, Candy, Wine, GlassWater, Microwave, ChefHat 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiClient, fetcher } from "@/lib/api-client";
import { endpoints } from "@/lib/api";
import useSWR from "swr";
import { type ApiList } from "@/types/api";
import { cn } from "@/lib/utils";

const FOOD_ICONS = [
  { name: "utensils", icon: Utensils },
  { name: "pizza", icon: Pizza },
  { name: "coffee", icon: Coffee },
  { name: "ice-cream", icon: IceCream },
  { name: "soup", icon: Soup },
  { name: "cookie", icon: Cookie },
  { name: "croissant", icon: Croissant },
  { name: "beef", icon: Beef },
  { name: "cake", icon: Cake },
  { name: "fish", icon: Fish },
  { name: "apple", icon: Apple },
  { name: "cherry", icon: Cherry },
  { name: "grape", icon: Grape },
  { name: "sandwich", icon: Sandwich },
  { name: "beer", icon: Beer },
  { name: "drumstick", icon: Drumstick },
  { name: "flame", icon: Flame },
  { name: "candy", icon: Candy },
  { name: "wine", icon: Wine },
  { name: "glass-water", icon: GlassWater },
  { name: "microwave", icon: Microwave },
  { name: "chef-hat", icon: ChefHat },
];

export const getFoodIcon = (name: string | null | undefined) => {
  const found = FOOD_ICONS.find(i => i.name === name);
  return found ? found.icon : Utensils;
};

interface Category {
    id: string;
    name: string;
    description?: string | null;
    icon_name?: string | null;
    sort_order: number;
    is_active: boolean;
}

interface CategoriesManagerProps {
    itemsPluralLower: string;
    moduleLower: string;
}

export function CategoriesManager({ itemsPluralLower, moduleLower }: CategoriesManagerProps) {
    const { toast } = useToast();
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [selectedIcon, setSelectedIcon] = useState("utensils");
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { data, isLoading, mutate } = useSWR<ApiList<Category>>(endpoints.categories.list, fetcher);
    const categories: Category[] = data?.data ?? [];

    function startEdit(cat: Category) {
      setEditingCategory(cat);
      setNewName(cat.name);
      setNewDesc(cat.description || "");
      setSelectedIcon(cat.icon_name || "utensils");
    }

    function cancelEdit() {
      setEditingCategory(null);
      setNewName("");
      setNewDesc("");
      setSelectedIcon("utensils");
    }

    async function handleSave() {
        const name = newName.trim();
        if (!name) return;
        setIsSaving(true);
        try {
            if (editingCategory) {
              // Update
              await apiClient.patch(endpoints.categories.delete(editingCategory.id), {
                  name,
                  description: newDesc.trim() || null,
                  icon_name: selectedIcon,
                  sort_order: editingCategory.sort_order
              });
              toast({ title: "Categoría actualizada" });
            } else {
              // Create
              await apiClient.post(endpoints.categories.create, {
                  name,
                  description: newDesc.trim() || null,
                  icon_name: selectedIcon,
              });
              toast({ title: "Categoría creada" });
            }
            await mutate();
            cancelEdit();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "";
            toast({
                title: "Error",
                description: msg.includes("409") ? "Ya existe una categoría con ese nombre" : "No se pudo guardar la categoría",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete(category: Category) {
        const confirmed = window.confirm(`¿Seguro que deseas eliminar "${category.name}"?`);
        if (!confirmed) return;
        setDeletingId(category.id);
        try {
            await apiClient.delete(endpoints.categories.delete(category.id));
            await mutate();
            toast({ title: `"${category.name}" eliminada` });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "";
            toast({
                title: "No se puede eliminar",
                description: msg.includes("409")
                    ? `"${category.name}" tiene ${itemsPluralLower} activos.`
                    : "Error al eliminar",
                variant: "destructive",
            });
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{editingCategory ? "Editar Categoría" : "Gestión de Categorías"}</CardTitle>
                <CardDescription>
                    {editingCategory 
                      ? `Modificando los detalles de "${editingCategory.name}"`
                      : `Organiza tus ${itemsPluralLower} en categorías.`}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className={cn(
                  "space-y-4 p-4 border rounded-xl transition-all duration-300",
                  editingCategory ? "bg-primary/5 border-primary/20 shadow-inner" : "bg-muted/20"
                )}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre</label>
                            <Input
                                placeholder="Nombre..."
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descripción</label>
                            <Input
                                placeholder="Descripción..."
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Icono</label>
                          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{selectedIcon}</span>
                        </div>
                        <div className="grid grid-cols-6 sm:grid-cols-11 gap-2 border p-3 rounded-lg bg-white">
                            {FOOD_ICONS.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <button
                                        key={item.name}
                                        type="button"
                                        onClick={() => setSelectedIcon(item.name)}
                                        className={cn(
                                            "h-10 w-10 flex items-center justify-center rounded-lg transition-all",
                                            selectedIcon === item.name 
                                                ? "bg-primary text-primary-foreground shadow-md scale-110" 
                                                : "hover:bg-muted text-muted-foreground"
                                        )}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex gap-2">
                      {editingCategory && (
                        <Button variant="ghost" onClick={cancelEdit} className="flex-1 h-11 font-bold">
                          Cancelar
                        </Button>
                      )}
                      <Button onClick={handleSave} disabled={isSaving || !newName.trim()} className="flex-[2] h-11 font-bold">
                          {isSaving
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : editingCategory ? "Guardar Cambios" : "Crear Categoría"
                          }
                      </Button>
                    </div>
                </div>

                <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-12">Icono</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="w-[120px] text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-20 text-center">
                                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                    </TableCell>
                                </TableRow>
                            ) : categories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                                        No hay categorías.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categories.map((cat) => {
                                    const Icon = getFoodIcon(cat.icon_name);
                                    return (
                                        <TableRow key={cat.id} className="hover:bg-muted/30 group">
                                            <TableCell>
                                                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                              <div className="font-bold">{cat.name}</div>
                                              <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{cat.description || "Sin descripción"}</div>
                                            </TableCell>
                                            <TableCell>
                                              <div className={cn(
                                                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                cat.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                              )}>
                                                <div className={cn("h-1.5 w-1.5 rounded-full", cat.is_active ? "bg-green-500" : "bg-red-500")} />
                                                {cat.is_active ? "Activa" : "Inactiva"}
                                              </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                              <div className="flex justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                                                    onClick={() => startEdit(cat)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                    disabled={deletingId === cat.id}
                                                    onClick={() => handleDelete(cat)}
                                                >
                                                    {deletingId === cat.id
                                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                                        : <Trash2 className="h-4 w-4" />
                                                    }
                                                </Button>
                                              </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
