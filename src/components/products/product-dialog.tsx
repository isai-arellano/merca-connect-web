"use client";

import { useEffect, useMemo, useState } from "react";
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

interface ProductDialogProduct {
    id: string;
    name: string;
    price: string | number;
    stock?: number | null;
    barcode?: string | null;
    ingredients?: string | null;
    preparation_time_min?: number | null;
    active_substance?: string | null;
    category_name?: string | null;
}

interface ProductDialogProps {
    children: React.ReactNode;
    config: IndustryConfig;
    industry: string;
    businessPhoneId: string | null;
    product?: ProductDialogProduct;
}

const DEFAULT_CATEGORY_OPTIONS = [
    { value: "bebidas", label: "Bebidas" },
    { value: "botanas", label: "Botanas" },
    { value: "otros", label: "Otros" },
];

export function ProductDialog({ children, config, industry, businessPhoneId, product }: ProductDialogProps) {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categoryValue, setCategoryValue] = useState("");
    const { mutate } = useSWRConfig();
    const productsEndpoint = businessPhoneId ? endpoints.products.list(businessPhoneId) : null;
    const isEditing = Boolean(product);
    const categoryOptions = useMemo(() => {
        const options = [...DEFAULT_CATEGORY_OPTIONS];

        if (
            product?.category_name &&
            !options.some((option) => option.value === product.category_name)
        ) {
            options.push({
                value: product.category_name,
                label: product.category_name,
            });
        }

        return options;
    }, [product?.category_name]);

    useEffect(() => {
        if (!open) {
            setCategoryValue("");
            return;
        }

        setCategoryValue(product?.category_name ?? "");
    }, [open, product?.category_name]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);

        const productPayload = {
            name: formData.get("name"),
            price: parseFloat(formData.get("price") as string) || 0,
            stock: parseInt(formData.get("stock") as string) || 0,
            barcode: formData.get("barcode") || null,
            ingredients: formData.get("ingredients") || null,
            preparation_time_min: parseInt(formData.get("prepTime") as string) || null,
            active_substance: formData.get("substance") || null,
            category_name: categoryValue || null,
        };

        if (!productsEndpoint) {
            setIsSubmitting(false);
            return;
        }

        try {
            if (isEditing && product) {
                await apiClient.patch(
                    endpoints.products.detail(product.id, businessPhoneId),
                    productPayload,
                );
            } else {
                await apiClient.post(productsEndpoint, productPayload);
            }

            await mutate(productsEndpoint);

            setOpen(false);
        } catch (error) {
            console.error("Error creating product:", error);
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
                    <DialogTitle>{isEditing ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Actualiza los datos del producto." : "Agrega un nuevo producto a tu catálogo."} Modo: <span className="capitalize">{industry}</span>.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Nombre
                            </Label>
                            <Input id="name" name="name" required placeholder="Ej. Coca Cola 600ml" className="col-span-3" defaultValue={product?.name ?? ""} />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">
                                Precio ($)
                            </Label>
                            <Input id="price" name="price" required type="number" step="0.01" placeholder="0.00" className="col-span-3" defaultValue={product?.price ?? ""} />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="category" className="text-right">
                                Categoría
                            </Label>
                            <div className="col-span-3">
                                <Select value={categoryValue} onValueChange={setCategoryValue}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona una" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categoryOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {config.productFields.showStock && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="stock" className="text-right">Stock Inicial</Label>
                                <Input id="stock" name="stock" type="number" placeholder="0" className="col-span-3" defaultValue={product?.stock ?? ""} />
                            </div>
                        )}

                        {config.productFields.showBarcode && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="barcode" className="text-right">Cod. Barras</Label>
                                <Input id="barcode" name="barcode" placeholder="Opcional" className="col-span-3" defaultValue={product?.barcode ?? ""} />
                            </div>
                        )}

                        {config.productFields.showIngredients && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="ingredients" className="text-right">Ingredientes</Label>
                                <Input id="ingredients" name="ingredients" placeholder="Ej. Tomate, Cebolla..." className="col-span-3" defaultValue={product?.ingredients ?? ""} />
                            </div>
                        )}

                        {config.productFields.showPreparationTime && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="prepTime" className="text-right">T. Prep (min)</Label>
                                <Input id="prepTime" name="prepTime" type="number" placeholder="15" className="col-span-3" defaultValue={product?.preparation_time_min ?? ""} />
                            </div>
                        )}

                        {config.productFields.showActiveSubstance && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="substance" className="text-right">Sust. Activa</Label>
                                <Input id="substance" name="substance" placeholder="Ej. Paracetamol 500mg" className="col-span-3" defaultValue={product?.active_substance ?? ""} />
                            </div>
                        )}

                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : isEditing ? "Guardar Cambios" : "Guardar Producto"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
