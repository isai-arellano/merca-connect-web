"use client";

import { useState } from "react";
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Utensils, 
  Pizza, 
  Coffee, 
  IceCream, 
  Soup, 
  Cookie, 
  Croissant, 
  Beef, 
  Cake, 
  Fish, 
  Apple, 
  Cherry, 
  Grape, 
  Sandwich,
  Beer,
  Drumstick,
  Flame,
  Candy,
  Wine,
  GlassWater,
  Microwave,
  ChefHat
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
}

interface CategoriesManagerProps {
    /** Plural en minúsculas (p. ej. productos, servicios, platillos). */
    itemsPluralLower: string;
    /** menú | catálogo */
    moduleLower: string;
}

export function CategoriesManager({ itemsPluralLower, moduleLower }: CategoriesManagerProps) {
    const { toast } = useToast();
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [selectedIcon, setSelectedIcon] = useState("utensils");
    const [isCreating, setIsCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { data, isLoading, mutate } = useSWR<ApiList<Category>>(endpoints.categories.list, fetcher);
    const categories: Category[] = data?.data ?? [];

    async function handleCreate() {
        const name = newName.trim();
        if (!name) return;
        setIsCreating(true);
        try {
            await apiClient.post(endpoints.categories.create, {
                name,
                description: newDesc.trim() || null,
                icon_name: selectedIcon,
            });
            await mutate();
            setNewName("");
            setNewDesc("");
            setSelectedIcon("utensils");
            toast({ title: "Categoría creada" });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "";
            toast({
                title: "Error",
                description: msg.includes("409") ? "Ya existe una categoría con ese nombre" : "No se pudo crear la categoría",
                variant: "destructive",
            });
        } finally {
            setIsCreating(false);
        }
    }

    async function handleDelete(category: Category) {
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
                    ? `"${category.name}" tiene ${itemsPluralLower} activos. Muévelos o elimínalos primero.`
                    : "Error al eliminar la categoría",
                variant: "destructive",
            });
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestión de Categorías</CardTitle>
                <CardDescription>
                    Organiza tus {itemsPluralLower} en categorías para facilitar la navegación en el {moduleLower}.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4 p-4 border rounded-xl bg-muted/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre de Categoría</label>
                            <Input
                                placeholder="P. ej. Pizzas, Bebidas..."
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descripción</label>
                            <Input
                                placeholder="Breve detalle (opcional)"
                                value={newDesc}
                                onChange={(e) => setNewDesc(e.target.value)}
                                className="bg-white"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Elegir Icono</label>
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

                    <Button onClick={handleCreate} disabled={isCreating || !newName.trim()} className="w-full h-11">
                        {isCreating
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <><Plus className="h-4 w-4 mr-2" /> Crear Categoría</>
                        }
                    </Button>
                </div>

                <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="w-12">Icono</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="w-[80px] text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />Cargando...
                                    </TableCell>
                                </TableRow>
                            ) : categories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                                        No hay categorías aún.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categories.map((cat) => {
                                    const Icon = getFoodIcon(cat.icon_name);
                                    return (
                                        <TableRow key={cat.id} className="hover:bg-muted/30">
                                            <TableCell>
                                                <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-bold">{cat.name}</TableCell>
                                            <TableCell className="text-muted-foreground text-sm">{cat.description || "—"}</TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    disabled={deletingId === cat.id}
                                                    onClick={() => handleDelete(cat)}
                                                >
                                                    {deletingId === cat.id
                                                        ? <Loader2 className="h-4 w-4 animate-spin" />
                                                        : <Trash2 className="h-4 w-4" />
                                                    }
                                                </Button>
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
