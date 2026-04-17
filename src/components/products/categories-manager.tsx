"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiClient, fetcher } from "@/lib/api-client";
import { endpoints } from "@/lib/api";
import useSWR from "swr";
import { type ApiList } from "@/types/api";

interface Category {
    id: string;
    name: string;
    description?: string | null;
    sort_order: number;
}

interface CategoriesManagerProps {
    businessPhoneId: string | null;
}

export function CategoriesManager({ businessPhoneId }: CategoriesManagerProps) {
    const { toast } = useToast();
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const endpoint = businessPhoneId ? endpoints.categories.list(businessPhoneId) : null;
    const { data, isLoading, mutate } = useSWR<ApiList<Category>>(endpoint, fetcher);
    const categories: Category[] = data?.data ?? [];

    async function handleCreate() {
        const name = newName.trim();
        if (!name || !endpoint || !businessPhoneId) return;
        setIsCreating(true);
        try {
            await apiClient.post(endpoints.categories.create(businessPhoneId), {
                name,
                description: newDesc.trim() || null,
            });
            await mutate();
            setNewName("");
            setNewDesc("");
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
                    ? `"${category.name}" tiene productos activos. Muévelos o elimínalos primero.`
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
                    Organiza tus productos en categorías para facilitar la navegación en el catálogo.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2 items-end">
                    <Input
                        placeholder="Nombre de la categoría *"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }}
                        className="flex-1"
                    />
                    <Input
                        placeholder="Descripción (opcional)"
                        value={newDesc}
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="flex-1"
                    />
                    <Button onClick={handleCreate} disabled={isCreating || !newName.trim()} className="shrink-0">
                        {isCreating
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <><Plus className="h-4 w-4 mr-1" /> Agregar</>
                        }
                    </Button>
                </div>

                <div className="rounded-lg border border-border overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead className="w-[80px] text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin inline mr-2" />Cargando...
                                    </TableCell>
                                </TableRow>
                            ) : categories.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                                        No hay categorías. Crea la primera arriba.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                categories.map((cat) => (
                                    <TableRow key={cat.id} className="hover:bg-muted/30">
                                        <TableCell className="font-medium">{cat.name}</TableCell>
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
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
