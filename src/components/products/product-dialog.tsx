"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { catalogModuleLower, IndustryConfig, pluralProductLabel } from "@/config/industries";
import { useSWRConfig } from "swr";
import { endpoints } from "@/lib/api";
import { apiClient, ApiError, fetcher, NetworkError } from "@/lib/api-client";
import { Loader2, Plus, Trash2, X, Upload, ImageIcon } from "lucide-react";
import useSWR from "swr";
import { type ApiList, type CategoryOption as ApiCategoryOption, type PlanUsage } from "@/types/api";
import { useToast } from "@/hooks/use-toast";

export interface ProductDialogProduct {
    id: string;
    name: string;
    description?: string | null;
    price: string | number;
    category_id?: string | null;
    category_name?: string | null;
    stock?: number | null;
    barcode?: string | null;
    ingredients?: string | null;
    preparation_time_min?: number | null;
    active_substance?: string | null;
    product_type?: string | null;
    unit?: string | null;
    sku?: string | null;
    is_visible?: boolean | null;
    is_optional_offer?: boolean | null;
    image_url?: string | null;
    images?: string[] | null;
    weight_kg?: number | null;
    length_cm?: number | null;
    width_cm?: number | null;
    height_cm?: number | null;
    currency?: string | null;
}

interface ProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    config: IndustryConfig;
    product?: ProductDialogProduct;
}

interface CategoryOption {
    id: string;
    name: string;
}

interface UnitOption {
    id: string;
    name: string;
    symbol: string;
    is_system: boolean;
}

interface FormState {
    name: string;
    description: string;
    price: string;
    categoryId: string;
    stock: string;
    barcode: string;
    ingredients: string;
    prepTime: string;
    substance: string;
    productType: string;
    unit: string;
    sku: string;
    isVisible: boolean;
    isOptionalOffer: boolean;
    weightKg: string;
    lengthCm: string;
    widthCm: string;
    heightCm: string;
}

interface FieldErrors {
    price?: string;
    stock?: string;
    name?: string;
}

const EMPTY_VALUE = "__none__";
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function imageUrlsFromProduct(p: ProductDialogProduct | undefined): string[] {
    if (!p) return [];
    const imgs = p.images;
    if (Array.isArray(imgs) && imgs.length > 0) {
        return imgs.filter((u): u is string => Boolean(u && String(u).trim()));
    }
    if (p.image_url) return [p.image_url];
    return [];
}

function getInitialFormState(product?: ProductDialogProduct): FormState {
    return {
        name: product?.name ?? "",
        description: product?.description ?? "",
        price: product?.price != null ? String(product.price) : "",
        categoryId: product?.category_id ?? EMPTY_VALUE,
        stock: product?.stock != null ? String(product.stock) : "",
        barcode: product?.barcode ?? "",
        ingredients: product?.ingredients ?? "",
        prepTime: product?.preparation_time_min != null ? String(product.preparation_time_min) : "",
        substance: product?.active_substance ?? "",
        productType: product?.product_type ?? "physical",
        unit: product?.unit ?? EMPTY_VALUE,
        sku: product?.sku ?? "",
        isVisible: product?.is_visible !== false,
        isOptionalOffer: product?.is_optional_offer ?? false,
        weightKg: product?.weight_kg != null ? String(product.weight_kg) : "",
        lengthCm: product?.length_cm != null ? String(product.length_cm) : "",
        widthCm: product?.width_cm != null ? String(product.width_cm) : "",
        heightCm: product?.height_cm != null ? String(product.height_cm) : "",
    };
}

function validateForm(state: FormState): FieldErrors {
    const errors: FieldErrors = {};
    if (!state.name.trim()) errors.name = "El nombre es requerido";
    const price = Number.parseFloat(state.price);
    if (isNaN(price) || price < 0) errors.price = "El precio debe ser 0 o mayor";
    if (state.stock !== "") {
        const stock = Number.parseInt(state.stock, 10);
        if (isNaN(stock) || stock < 0) errors.stock = "El stock no puede ser negativo";
    }
    return errors;
}

export function ProductDialog({ open, onOpenChange, config, product }: ProductDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formState, setFormState] = useState<FormState>(getInitialFormState(product));
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const [newCategoryMode, setNewCategoryMode] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [isDeletingCategory, setIsDeletingCategory] = useState(false);
    const [categoryError, setCategoryError] = useState<string | null>(null);
    const newCategoryInputRef = useRef<HTMLInputElement>(null);

    const [newUnitMode, setNewUnitMode] = useState(false);
    const [newUnitName, setNewUnitName] = useState("");
    const [newUnitSymbol, setNewUnitSymbol] = useState("");
    const [isCreatingUnit, setIsCreatingUnit] = useState(false);
    const [unitError, setUnitError] = useState<string | null>(null);

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [removingImageIndex, setRemovingImageIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const { mutate } = useSWRConfig();
    const productsEndpoint = endpoints.products.list(true);
    const categoriesEndpoint = endpoints.categories.list;
    const isEditing = Boolean(product);

    const productDetailEndpoint = open && isEditing && product
        ? endpoints.products.detail(product.id)
        : null;

    const { data: categoriesResponse, isLoading: isLoadingCategories, error: categoriesError } = useSWR<ApiList<CategoryOption>>(
        open ? endpoints.categories.list : null,
        fetcher,
    );
    const { data: unitsResponse } = useSWR<ApiList<UnitOption>>(open ? endpoints.units.list : null, fetcher);
    const { data: productResponse, isLoading: isLoadingProduct } = useSWR<ProductDialogProduct>(productDetailEndpoint, fetcher);

    const { data: planUsageRaw } = useSWR<PlanUsage | { data: PlanUsage }>(open ? endpoints.business.planUsage : null, fetcher);
    const planUsage: PlanUsage | null =
        (planUsageRaw as { data: PlanUsage } | null)?.data ?? (planUsageRaw as PlanUsage | null) ?? null;
    const maxImagesAllowed = Math.min(3, planUsage?.product_image_limit ?? 1);

    const currentProduct: ProductDialogProduct | undefined = productResponse ?? product;
    const categoryOptions: CategoryOption[] = categoriesResponse?.data ?? [];
    const allUnits: UnitOption[] = unitsResponse?.data ?? [];
    const relevantUnits = allUnits.filter((u) =>
        config.relevantUnits.includes(u.symbol) || !u.is_system
    );
    const selectedCategory = categoryOptions.find((c) => c.id === formState.categoryId) ?? null;

    const seedProductId = product?.id;
    const loadedProductId = productResponse?.id;

    useEffect(() => {
        if (!open) {
            if (imagePreview?.startsWith("blob:")) {
                URL.revokeObjectURL(imagePreview);
            }
            setFormState(getInitialFormState(product));
            setFieldErrors({});
            setNewCategoryMode(false);
            setNewCategoryName("");
            setCategoryError(null);
            setNewUnitMode(false);
            setNewUnitName("");
            setNewUnitSymbol("");
            setUnitError(null);
            setImageFile(null);
            setImagePreview(null);
            return;
        }
        setFormState(getInitialFormState(productResponse ?? product));
    }, [open, seedProductId, loadedProductId]);

    useEffect(() => {
        return () => {
            if (imagePreview?.startsWith("blob:")) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    useEffect(() => {
        if (newCategoryMode) {
            setTimeout(() => newCategoryInputRef.current?.focus(), 50);
        }
    }, [newCategoryMode]);

    const updateField = (field: keyof FormState, value: string | boolean) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
        if (typeof value === "string" && field in fieldErrors) {
            setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
            toast({
                title: "Formato no permitido",
                description: "Usa JPG, PNG o WEBP para la imagen del producto.",
                variant: "destructive",
            });
            return;
        }

        if (file.size > MAX_UPLOAD_SIZE_BYTES) {
            toast({
                title: "Archivo demasiado grande",
                description: "La imagen debe ser menor a 5 MB.",
                variant: "destructive",
            });
            return;
        }

        setImageFile(file);
        const url = URL.createObjectURL(file);
        setImagePreview(url);
        e.target.value = "";
    }

    async function handleUploadImage() {
        const productId = currentProduct?.id ?? product?.id;
        if (!imageFile || !productId) return;
        const currentUrls = imageUrlsFromProduct(currentProduct);
        if (currentUrls.length >= maxImagesAllowed) {
            toast({
                title: "Límite alcanzado",
                description: `Tu plan permite hasta ${maxImagesAllowed} imagen(es) por producto.`,
                variant: "destructive",
            });
            return;
        }
        setIsUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append("file", imageFile);
            const res = await apiClient.uploadForm<ProductDialogProduct>(
                endpoints.products.uploadImage(productId),
                formData,
            );
            await mutate(productsEndpoint);
            if (productDetailEndpoint) {
                await mutate(productDetailEndpoint, res, { revalidate: true });
            }
            setImageFile(null);
            setImagePreview(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
            toast({
                title: "Imagen agregada",
                description: "La imagen se guardó en el producto.",
            });
        } catch (error: unknown) {
            let description = "No se pudo subir la imagen del producto. Intenta nuevamente.";
            if (error instanceof NetworkError) {
                description = error.message;
            } else if (error instanceof ApiError && error.message) {
                description = error.message;
            }
            toast({
                title: "Error al subir imagen",
                description,
                variant: "destructive",
            });
        } finally {
            setIsUploadingImage(false);
        }
    }

    async function handleRemoveImage(index: number) {
        const productId = currentProduct?.id ?? product?.id;
        if (!productId) return;
        setRemovingImageIndex(index);
        try {
            const updated = await apiClient.delete<ProductDialogProduct>(
                endpoints.products.deleteImage(productId, index),
            );
            await mutate(productsEndpoint);
            if (productDetailEndpoint) {
                await mutate(productDetailEndpoint, updated, { revalidate: true });
            }
            toast({ title: "Imagen eliminada" });
        } catch (error: unknown) {
            let description = "No se pudo eliminar la imagen.";
            if (error instanceof NetworkError) description = error.message;
            else if (error instanceof ApiError && error.message) description = error.message;
            toast({ title: "Error", description, variant: "destructive" });
        } finally {
            setRemovingImageIndex(null);
        }
    }

    async function handleCreateCategory() {
        const name = newCategoryName.trim();
        if (!name || !categoriesEndpoint) return;

        setCategoryError(null);
        setIsCreatingCategory(true);
        try {
            const created = await apiClient.post<ApiCategoryOption>(endpoints.categories.create, { name });
            const newId = String(created.id);
            const newName = created.name ?? name;
            await mutate(
                endpoints.categories.list,
                async (current) => {
                    const prevList = current?.data ?? [];
                    if (prevList.some((c: CategoryOption) => c.id === newId)) {
                        return current ?? { data: prevList };
                    }
                    return { data: [...prevList, { id: newId, name: newName }] };
                },
                { revalidate: true },
            );
            updateField("categoryId", newId);
            setNewCategoryMode(false);
            setNewCategoryName("");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "";
            setCategoryError(msg.includes("409") ? "Ya existe una categoría con ese nombre" : "No se pudo crear la categoría");
        } finally {
            setIsCreatingCategory(false);
        }
    }

    async function handleCreateUnit() {
        const name = newUnitName.trim();
        const symbol = newUnitSymbol.trim();
        if (!name || !symbol) return;
        setUnitError(null);
        setIsCreatingUnit(true);
        try {
            const created = await apiClient.post<UnitOption>(endpoints.units.create, { name, symbol });
            await mutate(
                endpoints.units.list,
                async (current) => {
                    const prevList = current?.data ?? [];
                    const sym = created.symbol;
                    if (prevList.some((u: UnitOption) => u.symbol === sym)) {
                        return current ?? { data: prevList };
                    }
                    return { data: [...prevList, created] };
                },
                { revalidate: true },
            );
            updateField("unit", created.symbol);
            setNewUnitMode(false);
            setNewUnitName("");
            setNewUnitSymbol("");
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "";
            setUnitError(msg.includes("409") ? "Ya existe una unidad con ese símbolo o nombre" : "No se pudo crear la unidad");
        } finally {
            setIsCreatingUnit(false);
        }
    }

    async function handleDeleteCategory() {
        if (!selectedCategory || !categoriesEndpoint) return;
        setCategoryError(null);
        setIsDeletingCategory(true);
        try {
            await apiClient.delete(endpoints.categories.delete(selectedCategory.id));
            await mutate(categoriesEndpoint);
            updateField("categoryId", EMPTY_VALUE);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "";
            const plural = pluralProductLabel(config.productLabel).toLowerCase();
            setCategoryError(msg.includes("409") ? `No se puede eliminar: "${selectedCategory.name}" tiene ${plural} activos` : "No se pudo eliminar la categoría");
        } finally {
            setIsDeletingCategory(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const errors = validateForm(formState);
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }
        setIsSubmitting(true);

        const payload = {
            name: formState.name.trim(),
            description: formState.description.trim() || null,
            price: Number.parseFloat(formState.price),
            stock: formState.stock !== "" ? Number.parseInt(formState.stock, 10) : 0,
            barcode: formState.barcode || null,
            ingredients: formState.ingredients || null,
            preparation_time_min: formState.prepTime !== "" ? Number.parseInt(formState.prepTime, 10) : null,
            active_substance: formState.substance || null,
            category_id: formState.categoryId === EMPTY_VALUE ? null : formState.categoryId,
            product_type: formState.productType,
            unit: formState.unit === EMPTY_VALUE ? null : formState.unit,
            sku: formState.sku || null,
            is_visible: formState.isVisible,
            is_optional_offer: formState.isOptionalOffer,
            weight_kg: formState.weightKg !== "" ? Number.parseFloat(formState.weightKg) : null,
            length_cm: formState.lengthCm !== "" ? Number.parseFloat(formState.lengthCm) : null,
            width_cm: formState.widthCm !== "" ? Number.parseFloat(formState.widthCm) : null,
            height_cm: formState.heightCm !== "" ? Number.parseFloat(formState.heightCm) : null,
        };

        try {
            if (isEditing && product) {
                await apiClient.patch(endpoints.products.detail(product.id), payload);
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

    const galleryUrls = imageUrlsFromProduct(currentProduct);
    const moduleLabel = catalogModuleLower(config);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? `Editar ${config.productLabel}` : `Nuevo ${config.productLabel}`}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditing ? `Actualiza los datos del ${config.productLabel.toLowerCase()}.` : `Agrega un nuevo ${config.productLabel.toLowerCase()} a tu ${moduleLabel}.`}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {isEditing && isLoadingProduct && (
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
                            </div>
                        )}

                        {/* Imagen — solo en modo edición */}
                        {isEditing && (
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right pt-2">Imágenes</Label>
                                <div className="col-span-3 space-y-2">
                                    <p className="text-xs text-muted-foreground">
                                        Hasta {maxImagesAllowed} imagen(es) según tu plan (máx. 3). La primera es la principal.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {galleryUrls.map((url, idx) => (
                                            <div key={`${url}-${idx}`} className="relative group">
                                                <img
                                                    src={url}
                                                    alt={`Imagen ${idx + 1}`}
                                                    className="w-16 h-16 rounded-md object-cover border border-border"
                                                />
                                                <button
                                                    type="button"
                                                    title="Quitar imagen"
                                                    disabled={removingImageIndex !== null}
                                                    onClick={() => handleRemoveImage(idx)}
                                                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs shadow opacity-90 hover:opacity-100 disabled:opacity-50"
                                                >
                                                    {removingImageIndex === idx ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <X className="h-3 w-3" />
                                                    )}
                                                </button>
                                                {idx === 0 && (
                                                    <span className="absolute bottom-0 left-0 right-0 bg-black/55 text-[9px] text-white text-center py-0.5 rounded-b-md">
                                                        Principal
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                        {galleryUrls.length === 0 && !imagePreview && (
                                            <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center text-muted-foreground border border-border">
                                                <ImageIcon className="h-6 w-6" />
                                            </div>
                                        )}
                                        {imagePreview && (
                                            <img
                                                src={imagePreview}
                                                alt="Nueva"
                                                className="w-16 h-16 rounded-md object-cover border border-dashed border-primary"
                                            />
                                        )}
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={galleryUrls.length >= maxImagesAllowed}
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            Seleccionar archivo
                                        </Button>
                                        {imageFile && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                disabled={isUploadingImage || galleryUrls.length >= maxImagesAllowed}
                                                onClick={handleUploadImage}
                                                className="bg-primary text-primary-foreground hover:opacity-90"
                                            >
                                                {isUploadingImage ? (
                                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                ) : (
                                                    <Upload className="h-3 w-3 mr-1" />
                                                )}
                                                Subir
                                            </Button>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    {imageFile && (
                                        <p className="text-xs text-muted-foreground">{imageFile.name}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Nombre */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="name" className="text-right pt-2">Nombre</Label>
                            <div className="col-span-3">
                                <Input
                                    id="name"
                                    required
                                    placeholder={`Ej. ${config.productLabel}`}
                                    value={formState.name}
                                    onChange={(e) => updateField("name", e.target.value)}
                                    className={fieldErrors.name ? "border-destructive" : ""}
                                />
                                {fieldErrors.name && <p className="mt-1 text-xs text-destructive">{fieldErrors.name}</p>}
                            </div>
                        </div>

                        {/* Descripción */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="description" className="text-right pt-2">Descripción</Label>
                            <Textarea
                                id="description"
                                placeholder="Descripción breve (opcional)"
                                className="col-span-3 resize-none"
                                rows={2}
                                value={formState.description}
                                onChange={(e) => updateField("description", e.target.value)}
                            />
                        </div>

                        {/* Precio */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="price" className="text-right pt-2">Precio</Label>
                            <div className="col-span-3 flex items-center gap-2">
                                <Input
                                    id="price"
                                    required
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={formState.price}
                                    onChange={(e) => updateField("price", e.target.value)}
                                    className={fieldErrors.price ? "border-destructive flex-1" : "flex-1"}
                                />
                                <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md border border-border">MXN</span>
                            </div>
                        </div>
                        {fieldErrors.price && (
                            <div className="grid grid-cols-4 gap-4">
                                <div />
                                <p className="col-span-3 text-xs text-destructive -mt-2">{fieldErrors.price}</p>
                            </div>
                        )}

                        {/* Tipo de producto */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Tipo</Label>
                            <Select value={formState.productType} onValueChange={(v) => updateField("productType", v)}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="physical">Físico</SelectItem>
                                    <SelectItem value="digital">Digital</SelectItem>
                                    <SelectItem value="service">Servicio</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Categoría */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">Categoría</Label>
                            <div className="col-span-3 space-y-2">
                                {!newCategoryMode ? (
                                    <div className="flex gap-2">
                                        <Select
                                            value={formState.categoryId}
                                            onValueChange={(value) => {
                                                updateField("categoryId", value);
                                                setCategoryError(null);
                                            }}
                                            disabled={isLoadingCategories}
                                        >
                                            <SelectTrigger className="flex-1">
                                                <SelectValue placeholder={isLoadingCategories ? "Cargando..." : "Selecciona una"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={EMPTY_VALUE}>Sin categoría</SelectItem>
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
                                            title="Nueva categoría"
                                            onClick={() => { setNewCategoryMode(true); setCategoryError(null); }}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                        {selectedCategory && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                title={`Eliminar "${selectedCategory.name}"`}
                                                disabled={isDeletingCategory}
                                                onClick={handleDeleteCategory}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                            >
                                                {isDeletingCategory
                                                    ? <Loader2 className="h-4 w-4 animate-spin" />
                                                    : <Trash2 className="h-4 w-4" />
                                                }
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <Input
                                                ref={newCategoryInputRef}
                                                placeholder="Nombre de la categoría"
                                                value={newCategoryName}
                                                onChange={(e) => { setNewCategoryName(e.target.value); setCategoryError(null); }}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter") { e.preventDefault(); handleCreateCategory(); }
                                                    if (e.key === "Escape") { setNewCategoryMode(false); setNewCategoryName(""); setCategoryError(null); }
                                                }}
                                                className="flex-1"
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                disabled={isCreatingCategory || !newCategoryName.trim()}
                                                onClick={handleCreateCategory}
                                            >
                                                {isCreatingCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => { setNewCategoryMode(false); setNewCategoryName(""); setCategoryError(null); }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Enter para guardar · Esc para cancelar</p>
                                    </div>
                                )}
                                {categoryError && <p className="text-xs text-destructive">{categoryError}</p>}
                                {categoriesError && !newCategoryMode && (
                                    <p className="text-xs text-destructive">No se pudieron cargar las categorías.</p>
                                )}
                            </div>
                        </div>

                        {/* Unidad */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <Label className="text-right pt-2">Unidad</Label>
                            <div className="col-span-3 space-y-2">
                                {!newUnitMode ? (
                                    <div className="flex gap-2">
                                        <Select value={formState.unit} onValueChange={(v) => { updateField("unit", v); setUnitError(null); }}>
                                            <SelectTrigger className="flex-1">
                                                <SelectValue placeholder="Sin unidad" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value={EMPTY_VALUE}>Sin unidad</SelectItem>
                                                {relevantUnits.map((u) => (
                                                    <SelectItem key={u.id} value={u.symbol}>
                                                        {u.name} ({u.symbol})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            title="Nueva unidad"
                                            onClick={() => { setNewUnitMode(true); setUnitError(null); }}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <div className="flex gap-2 flex-wrap">
                                            <Input
                                                placeholder="Nombre (ej. caja)"
                                                value={newUnitName}
                                                onChange={(e) => { setNewUnitName(e.target.value); setUnitError(null); }}
                                                className="flex-1 min-w-[120px]"
                                            />
                                            <Input
                                                placeholder="Símbolo (ej. cja)"
                                                value={newUnitSymbol}
                                                onChange={(e) => { setNewUnitSymbol(e.target.value); setUnitError(null); }}
                                                className="w-24"
                                            />
                                            <Button
                                                type="button"
                                                size="icon"
                                                disabled={isCreatingUnit || !newUnitName.trim() || !newUnitSymbol.trim()}
                                                onClick={handleCreateUnit}
                                            >
                                                {isCreatingUnit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => { setNewUnitMode(false); setNewUnitName(""); setNewUnitSymbol(""); setUnitError(null); }}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {unitError && <p className="text-xs text-destructive">{unitError}</p>}
                            </div>
                        </div>

                        {/* SKU — condicional */}
                        {config.productFields.showSKU && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="sku" className="text-right">SKU</Label>
                                <Input
                                    id="sku"
                                    placeholder="Código interno (opcional)"
                                    className="col-span-3"
                                    value={formState.sku}
                                    onChange={(e) => updateField("sku", e.target.value)}
                                />
                            </div>
                        )}

                        {/* Stock — condicional */}
                        {config.productFields.showStock && (
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="stock" className="text-right pt-2">Stock</Label>
                                <div className="col-span-3">
                                    <Input
                                        id="stock"
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={formState.stock}
                                        onChange={(e) => updateField("stock", e.target.value)}
                                        className={fieldErrors.stock ? "border-destructive" : ""}
                                    />
                                    {fieldErrors.stock && <p className="mt-1 text-xs text-destructive">{fieldErrors.stock}</p>}
                                </div>
                            </div>
                        )}

                        {/* Código de barras — condicional */}
                        {config.productFields.showBarcode && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="barcode" className="text-right">Cód. Barras</Label>
                                <Input
                                    id="barcode"
                                    placeholder="Opcional"
                                    className="col-span-3"
                                    value={formState.barcode}
                                    onChange={(e) => updateField("barcode", e.target.value)}
                                />
                            </div>
                        )}

                        {/* Ingredientes — condicional */}
                        {config.productFields.showIngredients && (
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label htmlFor="ingredients" className="text-right pt-2">Ingredientes</Label>
                                <Textarea
                                    id="ingredients"
                                    placeholder="Ej. Tomate, Cebolla..."
                                    className="col-span-3 resize-none"
                                    rows={2}
                                    value={formState.ingredients}
                                    onChange={(e) => updateField("ingredients", e.target.value)}
                                />
                            </div>
                        )}

                        {/* Tiempo de preparación — condicional */}
                        {config.productFields.showPreparationTime && (
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="prepTime" className="text-right">T. Prep (min)</Label>
                                <Input
                                    id="prepTime"
                                    type="number"
                                    min="0"
                                    placeholder="15"
                                    className="col-span-3"
                                    value={formState.prepTime}
                                    onChange={(e) => updateField("prepTime", e.target.value)}
                                />
                            </div>
                        )}

                        {/* Sustancia activa — condicional */}
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

                        {/* Dimensiones — condicional (solo para físicos) */}
                        {config.productFields.showDimensions && formState.productType === "physical" && (
                            <div className="grid grid-cols-4 items-start gap-4">
                                <Label className="text-right pt-2">Dimensiones</Label>
                                <div className="col-span-3 grid grid-cols-2 gap-2">
                                    <div>
                                        <Label htmlFor="weightKg" className="text-xs text-muted-foreground mb-1 block">Peso (kg)</Label>
                                        <Input
                                            id="weightKg"
                                            type="number"
                                            step="0.001"
                                            min="0"
                                            placeholder="0.000"
                                            value={formState.weightKg}
                                            onChange={(e) => updateField("weightKg", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="lengthCm" className="text-xs text-muted-foreground mb-1 block">Largo (cm)</Label>
                                        <Input
                                            id="lengthCm"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            value={formState.lengthCm}
                                            onChange={(e) => updateField("lengthCm", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="widthCm" className="text-xs text-muted-foreground mb-1 block">Ancho (cm)</Label>
                                        <Input
                                            id="widthCm"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            value={formState.widthCm}
                                            onChange={(e) => updateField("widthCm", e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="heightCm" className="text-xs text-muted-foreground mb-1 block">Alto (cm)</Label>
                                        <Input
                                            id="heightCm"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            value={formState.heightCm}
                                            onChange={(e) => updateField("heightCm", e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Checkboxes: Visible + Oferta opcional */}
                        <div className="grid grid-cols-4 items-start gap-4">
                            <div className="col-start-2 col-span-3 space-y-3">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="isVisible"
                                        checked={formState.isVisible}
                                        onCheckedChange={(checked) => updateField("isVisible", Boolean(checked))}
                                    />
                                    <div>
                                        <Label htmlFor="isVisible" className="cursor-pointer">Visible en {moduleLabel}</Label>
                                        <p className="text-xs text-muted-foreground">Los clientes pueden ver este producto</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="isOptionalOffer"
                                        checked={formState.isOptionalOffer}
                                        onCheckedChange={(checked) => updateField("isOptionalOffer", Boolean(checked))}
                                    />
                                    <div>
                                        <Label htmlFor="isOptionalOffer" className="cursor-pointer">Oferta opcional (Zafer)</Label>
                                        <p className="text-xs text-muted-foreground">Zafer puede sugerir este producto como complemento</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isSubmitting || isLoadingProduct || newCategoryMode || newUnitMode}>
                            {isSubmitting
                                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                                : isEditing ? "Guardar Cambios" : `Guardar ${config.productLabel}`
                            }
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
