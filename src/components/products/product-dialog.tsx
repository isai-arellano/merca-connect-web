"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IndustryConfig } from "@/config/industries";
import { useSWRConfig } from "swr";
import { endpoints } from "@/lib/api";
import { apiClient } from "@/lib/api-client";
import { Loader2 } from "lucide-react";
import { withBusinessPhoneId } from "@/lib/business";
import { useToast } from "@/hooks/use-toast";

interface ProductDialogProps {
    children: React.ReactNode;
    config: IndustryConfig;
    industry: string;
    businessPhoneId: string | null;
}

export function ProductDialog({ children, config, industry, businessPhoneId }: ProductDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { mutate } = useSWRConfig();
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!businessPhoneId) {
            toast({
                title: "Negocio no configurado",
                description: "No se pudo identificar el negocio autenticado.",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);

        const newProduct = {
            name: formData.get("name"),
            price: parseFloat(formData.get("price") as string) || 0,
            stock: parseInt(formData.get("stock") as string) || 0,
            barcode: formData.get("barcode") || null,
            ingredients: formData.get("ingredients") || null,
            preparation_time_min: parseInt(formData.get("prepTime") as string) || null,
            active_substance: formData.get("substance") || null,
        };

        try {
            const listUrl = withBusinessPhoneId(endpoints.products.list, businessPhoneId);
            await apiClient.post(listUrl, newProduct);

            await mutate(listUrl);

            setOpen(false);
        } catch (error) {
            console.error("Error creating product:", error);
            toast({
                title: "Error al crear producto",
                description: error instanceof Error ? error.message : "No se pudo guardar el producto.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Nuevo Producto</DialogTitle>
                    <DialogDescription>
                        Agrega un nuevo producto a tu catálogo. Modo: <span className="capitalize">{industry}</span>.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nombre
                            </Label>
                            <Input id="name" name="name" required placeholder="Ej. Coca Cola 600ml" className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">
                                Precio ($)
                            </Label>
                            <Input id="price" name="price" required type="number" step="0.01" placeholder="0.00" className="col-span-3" />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">
                                Categoría
                            </Label>
                            <div className="col-span-3">
                                <Select name="category">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona una" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="bebidas">Bebidas</SelectItem>
                                        <SelectItem value="botanas">Botanas</SelectItem>
                                        <SelectItem value="otros">Otros</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* --------- CAMPOS DINAMICOS --------- */}

                        {config.productFields.showStock && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="stock" className="text-right">Stock Inicial</Label>
                                <Input id="stock" name="stock" type="number" placeholder="0" className="col-span-3" />
                            </div>
                        )}

                        {config.productFields.showBarcode && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="barcode" className="text-right">Cod. Barras</Label>
                                <Input id="barcode" name="barcode" placeholder="Opcional" className="col-span-3" />
                            </div>
                        )}

                        {config.productFields.showIngredients && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="ingredients" className="text-right">Ingredientes</Label>
                                <Input id="ingredients" name="ingredients" placeholder="Ej. Tomate, Cebolla..." className="col-span-3" />
                            </div>
                        )}

                        {config.productFields.showPreparationTime && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="prepTime" className="text-right">T. Prep (min)</Label>
                                <Input id="prepTime" name="prepTime" type="number" placeholder="15" className="col-span-3" />
                            </div>
                        )}

                        {config.productFields.showActiveSubstance && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="substance" className="text-right">Sust. Activa</Label>
                                <Input id="substance" name="substance" placeholder="Ej. Paracetamol 500mg" className="col-span-3" />
                            </div>
                        )}

                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : "Guardar Producto"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
