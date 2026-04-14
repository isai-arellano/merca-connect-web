"use client";

import { useState } from "react";
import { Plus, Trash2, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiClient, fetcher } from "@/lib/api-client";
import { endpoints } from "@/lib/api";
import useSWR from "swr";

interface Unit {
    id: string;
    name: string;
    symbol: string;
    is_system: boolean;
    is_active: boolean;
}

export function UnitsManager() {
    const { toast } = useToast();
    const [newName, setNewName] = useState("");
    const [newSymbol, setNewSymbol] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const { data, isLoading, mutate } = useSWR(endpoints.units.list, fetcher);
    const allUnits = (data?.data ?? []) as Unit[];
    const systemUnits = allUnits.filter((u) => u.is_system);
    const customUnits = allUnits.filter((u) => !u.is_system);

    async function handleCreate() {
        const name = newName.trim();
        const symbol = newSymbol.trim();
        if (!name || !symbol) return;
        setIsCreating(true);
        try {
            await apiClient.post(endpoints.units.create, { name, symbol });
            await mutate();
            setNewName("");
            setNewSymbol("");
            toast({ title: "Unidad creada" });
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "";
            toast({
                title: "Error",
                description: msg.includes("409") ? "Ya existe una unidad con ese nombre" : "No se pudo crear la unidad",
                variant: "destructive",
            });
        } finally {
            setIsCreating(false);
        }
    }

    async function handleDelete(unit: Unit) {
        setDeletingId(unit.id);
        try {
            await apiClient.delete(endpoints.units.delete(unit.id));
            await mutate();
            toast({ title: `"${unit.name}" eliminada` });
        } catch {
            toast({ title: "Error al eliminar la unidad", variant: "destructive" });
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Gestión de Unidades</CardTitle>
                <CardDescription>
                    Las unidades del sistema son compartidas y no se pueden eliminar. Crea unidades personalizadas para tu negocio.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Unidades del sistema</h3>
                    </div>
                    <div className="rounded-lg border border-border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Símbolo</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-16 text-center text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin inline" />
                                        </TableCell>
                                    </TableRow>
                                ) : systemUnits.map((unit) => (
                                    <TableRow key={unit.id} className="hover:bg-muted/20">
                                        <TableCell className="font-medium">{unit.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-mono">{unit.symbol}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="outline" className="text-xs text-muted-foreground">Sistema</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <Separator />

                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Unidades personalizadas</h3>

                    <div className="flex gap-2 items-center">
                        <Input
                            placeholder="Nombre (ej: cajas)"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }}
                            className="flex-1"
                        />
                        <Input
                            placeholder="Símbolo (ej: cja)"
                            value={newSymbol}
                            onChange={(e) => setNewSymbol(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleCreate(); } }}
                            className="w-36"
                        />
                        <Button
                            onClick={handleCreate}
                            disabled={isCreating || !newName.trim() || !newSymbol.trim()}
                            className="shrink-0"
                        >
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
                                    <TableHead>Símbolo</TableHead>
                                    <TableHead className="w-[80px] text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customUnits.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-16 text-center text-muted-foreground text-sm">
                                            No hay unidades personalizadas.
                                        </TableCell>
                                    </TableRow>
                                ) : customUnits.map((unit) => (
                                    <TableRow key={unit.id} className="hover:bg-muted/30">
                                        <TableCell className="font-medium">{unit.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-mono">{unit.symbol}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                disabled={deletingId === unit.id}
                                                onClick={() => handleDelete(unit)}
                                            >
                                                {deletingId === unit.id
                                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                                    : <Trash2 className="h-4 w-4" />
                                                }
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
