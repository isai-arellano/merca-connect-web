"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IndustryConfig } from "@/config/industries";
import { useSWRConfig } from "swr";
import { endpoints } from "@/lib/api";
import { apiClient, fetcher } from "@/lib/api-client";
import { Loader2, Plus, X } from "lucide-react";
import useSWR from "swr";

export interface ProductDialogProduct {
    id: string;
    name: string;
    price: string | number;
    category_id?: string | null;
    stock?: number | null;
    barcode?: string | null;
    ingredients?: string | null;
    preparation_time_min?: number | null;
    active_substance?: string | null;
    category_name?: string | null;
}

interface ProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    config: IndustryConfig;
    industry: string;
    businessPhoneId: string | null;
    product?: ProductDialogProduct;
}

interface CategoryOption {
    id: string;
    name: string;
}

interface FormState {
    name: string;
    price: string;
    categoryId: string;
    stock: string;
    barcode: string;
    ingredients: string;
    prepTime: string;
    substance: string;
}

const EMPTY_CATEGORY_VALUE = "__none__";

function getInitialFormState(product?: ProductDialogProduct): FormState {
    return {
        name: product?.name ?? "",
        price: product?.price != null ? String(product.price) : "",
        categoryId: product?.category_id ?? EMPTY_CATEGORY_VALUE,
        stock: product?.stock != null ? String(product.stock) : "",
        barcode: product?.barcode ?? "",
        ingredients: product?.ingredients ?? "",
        prepTime: product?.preparation_time_min != null ? String(product.preparation_time_min) : "",
        substance: product?.active_substance ?? "",
    };
}

export function ProductDialog({ open, onOpenChange, config, industry, businessPhoneId, product }: ProductDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formState, setFormState] = useState<FormState>(getInitialFormState(product));

    const [newCategoryMode, setNewCategoryMode] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [categoryError, setCategoryError] = useState<string | null>(null);
    const newCategoryInputRef = useRef<HTMLInputElement>(null);

    const { mutate } = useSWRConfig();
    const productsEndpoint = businessPhoneId ? endpoints.products.list(businessPhoneId) : null;
    const categoriesEndpoint = businessPhoneId ? endpoints.categories.list(businessPhoneId) : null;
    const isEditing = Boolean(product);

    const productDetailEndpoint = open && isEditing && product && businessPhoneId
        ? endpoints.products.detail(product.id, businessPhoneId)
        : null;

    const { data: categoriesResponse, isLoading: isLoadingCategories, error: categoriesError } = useSWR(
        open && categoriesEndpoint ? categoriesEndpoint : null,
        fetcher,
    );
    const { data: productResponse, isLoading: isLoadingProduct } = useSWR(
        productDetailEndpoint,
        fetcher,
    );

    const currentProduct = (productResponse ?? product) as ProductDialogProduct | undefined;
    const categoryOptions = (categoriesResponse?.data ?? []) as CategoryOption[];

    useEffect(() => {
        if (!open) {
            setFormState(getInitialFormState(product));
            setNewCategoryMode(false);
            setNewCategoryName("");
            setCategoryError(null);
            return;
        }
        setFormState(getInitialFormState(currentProduct));
    }, [open, product, currentProduct]);

    useEffect(() => {
        if (newCategoryMode) {
            setTimeout(() => newCategoryInputRef.current?.focus(), 50);
        }
    }, [newCategoryMode]);

    const updateField = (field: keyof FormState, value: string) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
    };

    async function handleCreateCategory() {
        const name = newCategoryName.trim();
        if (!name || !categoriesEndpoint) return;

        setCategoryError(null);
        setIsCreatingCategory(true);

        try {
            const created = await apiClient.post(endpoints.categories.create, { name });
            await mutate(categoriesEndpoint);
            updateField("categoryId", created.id);
            setNewCategoryMode(false);
            setNewCategoryName("");
        } catch (err: any) {
            const detail = err?.message ?? "Error al crear la categoría";
            setCategoryError(detail.includes("409") ? "Ya existe una categoría con ese nombre" : "No se pudo crear la categoría");
        } finally {
            setIsCreatingCategory(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!productsEndpoint) return;
        setIsSubmitting(true);

        const payload = {
            name: formState.name,
            price: Number.parseFloat(formState.price) || 0,
            stock: Number.parseInt(formState.stock, 10) || 0,
            barcode: formState.barcode || null,
            ingredients: formState.ingredients || null,
            preparation_time_min: Number.parseInt(formState.prepTime, 10) || null,
            active_substance: formState.substance || null,
            category_id: formState.categoryId === EMPTY_CATEGORY_VALUE ? null : formState.categoryId,
        };

        try {
            if (isEditing && product) {
                await apiClient.patch(endpoints.products.detail(product.id, businessPhoneId), payload);
            } else {
                await apiClient.post(productsEndpoint, payload);
            }
            await mutate(productsEndpoint);
            if (categoriesEndpoint) await mutate(categoriesEndpoint);
            onOpenChange(false);
        } catch (error) {
            console.error("Error al guardar producto:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "Actualiza los datos del producto." : "Agrega un nuevo producto a tu catálogo."}{" "}
                        Modo: <span className="capitalize">{industry}</span>.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {isEditing && isLoadingProduct && (
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" /> Cargando producto...
                            </div>
                        )}

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">Nombre</Label>
                            <Input
                                id="name"
                                required
                                placeholder="Ej. Coca Cola 600ml"
                                className="col-span-3"
                                value={formState.name}
                                onChange={(e) => updateField("name", e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="price" className="text-right">Precio ($)</Label>
                            <Input
                                id="price"
                                required
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="col-span-3"
                                value={formState.price}
                                onChange={(e) => updateField("price", e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">Categoría</Label>
                            <div className="col-span-3 space-y-2">
                                {!newCategoryMode ? (
                                    <div className="flex gap-2">
                                        <Select
                                            value={formState.categoryId}
                                            onValueChange={(value) => updateField("categoryId", value)}
                                            disabled={isLoadingCategories}
                                        >
                                            <SelectTrigger id="category" className="flex-1">
                                                <SelectValue placeholder={isLoadingCategories ? "Cargando..." : "Selecciona una"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={EMPTY_CATEGORY_VALUE}>Sin categoría</SelectItem>
                                                {categoryOptions.map((option) => (
                                                    <SelectItem key={option.id} value={option.id}>
                                                        {option.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            className="shrink-0"
                                            title="Nueva categoría"
                                            onClick={() => setNewCategoryMode(true)}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <Input
                                                ref={newCategoryInputRef}
                                                placeholder="Nombre de la categoría"
                                                value={newCategoryName}
                                                onChange={(e) => {
                                                    setNewCategoryName(e.target.value);
                                                    setCategoryError(null);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") {
                                                        e.preventDefault();
                                                        handleCreateCategory();
                                                    }
                                                    if (e.key === "Escape") {
                                                        setNewCategoryMode(false);
                                                        setNewCategoryName("");
                                                        setCategoryError(null);
                                                    }
                                                }}
                                                className="flex-1"
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                className="shrink-0"
                                                disabled={isCreatingCategory || !newCategoryName.trim()}
                                                onClick={handleCreateCategory}
                                            >
                                                {isCreatingCategory
                                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                                    : <Plus className="h-4 w-4" />
                                                }
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="shrink-0"
                                                onClick={() => {
                                                    setNewCategoryMode(false);
                                                    setNewCategoryName("");
                                                    setCategoryError(null);
                                                }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        {categoryError && (
                                            <p className="text-xs text-destructive">{categoryError}</p>
                                        )}
                                        <p className="text-xs text-muted-foreground">Enter para guardar · Esc para cancelar</p>
                                    </div>
                                )}
                                {categoriesError && !newCategoryMode && (
                                    <p className="text-xs text-destructive">No se pudieron cargar las categorías.</p>
                                )}
                            </div>
                        </div>

                        {config.productFields.showStock && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="stock" className="text-right">Stock Inicial</Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    placeholder="0"
                                    className="col-span-3"
                                    value={formState.stock}
                                    onChange={(e) => updateField("stock", e.target.value)}
                                />
                            </div>
                        )}

                        {config.productFields.showBarcode && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="barcode" className="text-right">Cod. Barras</Label>
                                <Input
                                    id="barcode"
                                    placeholder="Opcional"
                                    className="col-span-3"
                                    value={formState.barcode}
                                    onChange={(e) => updateField("barcode", e.target.value)}
                                />
                            </div>
                        )}

                        {config.productFields.showIngredients && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="ingredients" className="text-right">Ingredientes</Label>
                                <Input
                                    id="ingredients"
                                    placeholder="Ej. Tomate, Cebolla..."
                                    className="col-span-3"
                                    value={formState.ingredients}
                                    onChange={(e) => updateField("ingredients", e.target.value)}
                                />
                            </div>
                        )}

                        {config.productFields.showPreparationTime && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="prepTime" className="text-right">T. Prep (min)</Label>
                                <Input
                                    id="prepTime"
                                    type="number"
                                    placeholder="15"
                                    className="col-span-3"
                                    value={formState.prepTime}
                                    onChange={(e) => updateField("prepTime", e.target.value)}
                                />
                            </div>
                        )}

                        {config.productFields.showActiveSubstance && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="substance" className="text-right">Sust. Activa</Label>
                                <Input
                                    id="substance"
                                    placeholder="Ej. Paracetamol 500mg"
                                    className="col-span-3"
                                    value={formState.substance}
                                    onChange={(e) => updateField("substance", e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting || isLoadingProduct || newCategoryMode}>
                            {isSubmitting
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                                : isEditing ? "Guardar Cambios" : "Guardar Producto"
                            }
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
