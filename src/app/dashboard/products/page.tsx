"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    Filter,
    Loader2,
    ExternalLink,
    Eye,
    EyeOff,
    Tag,
    Trash2,
    Link as LinkIcon,
    AlertCircle,
    Save,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getIndustryConfig, getPublicCatalogRoute } from "@/config/industries";
import {
    CATALOG_THEME_PRESETS,
    CATALOG_THEME_PRESET_API_WIRE,
    type CatalogThemePreset,
} from "@/config/catalog-themes";
import { useIndustries } from "@/hooks/useIndustries";
import { useSession } from "next-auth/react";
import { ProductDialog, ProductDialogProduct } from "@/components/products/product-dialog";
import { CategoriesManager } from "@/components/products/categories-manager";
import { UnitsManager } from "@/components/products/units-manager";
import { motion, Variants } from "framer-motion";
import useSWR from "swr";
import { endpoints } from "@/lib/api";
import { apiClient, fetcher, ApiError, NetworkError } from "@/lib/api-client";
import { getSessionBusinessPhoneId } from "@/lib/business";
import { type ApiList, type BusinessSettings } from "@/types/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Product {
    id: string;
    name: string;
    description?: string | null;
    category_id?: string | null;
    category_name?: string | null;
    price: string | number;
    currency?: string | null;
    product_type?: string | null;
    unit?: string | null;
    sku?: string | null;
    stock?: number | null;
    is_visible?: boolean | null;
    is_optional_offer?: boolean | null;
    image_url?: string | null;
    barcode?: string | null;
    ingredients?: string | null;
    preparation_time_min?: number | null;
    active_substance?: string | null;
    weight_kg?: number | null;
    length_cm?: number | null;
    width_cm?: number | null;
    height_cm?: number | null;
    is_active?: boolean;
}

function toFiniteNumber(value: string | number | null | undefined): number {
    const parsed = typeof value === "number" ? value : Number.parseFloat(value ?? "0");
    return Number.isFinite(parsed) ? parsed : 0;
}

const containerVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, staggerChildren: 0.1 } },
};
const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
};

const PRODUCT_TYPE_LABELS: Record<string, string> = {
    physical: "Físico",
    digital: "Digital",
    service: "Servicio",
};

function formatValidationDetail(error: ApiError): string {
    const body = error.responseBody;
    if (!body || typeof body !== "object") return "";
    const detail = (body as Record<string, unknown>).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail[0] && typeof detail[0] === "object" && "msg" in (detail[0] as object)) {
        return String((detail[0] as { msg: string }).msg);
    }
    return "";
}

export default function ProductsPage() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductDialogProduct | undefined>(undefined);
    const [actingProductId, setActingProductId] = useState<string | null>(null);

    const sessionBusinessPhoneId = getSessionBusinessPhoneId(session);
    const { industriesMap } = useIndustries();

    const {
        data: settingsRaw,
        mutate: mutateSettings,
    } = useSWR<BusinessSettings | { data: BusinessSettings }>(session ? endpoints.business.settings : null, fetcher);
    const settingsData: BusinessSettings =
        (settingsRaw as { data: BusinessSettings } | null)?.data ?? (settingsRaw as BusinessSettings | null) ?? {};

    const [catalogSlug, setCatalogSlug] = useState("");
    const [themePreset, setThemePreset] = useState<CatalogThemePreset>("default");
    const [catalogMetaSaving, setCatalogMetaSaving] = useState(false);
    const [catalogSlugApiError, setCatalogSlugApiError] = useState<string | null>(null);
    const [catalogSlugValidationError, setCatalogSlugValidationError] = useState<string | null>(null);

    useEffect(() => {
        setCatalogSlug(settingsData.slug ?? "");
        setThemePreset("default");
    }, [settingsData.slug, settingsData.config?.catalog_theme?.preset]);
    const productsEndpoint = sessionBusinessPhoneId ? endpoints.products.list(sessionBusinessPhoneId, true) : null;
    const { data: response, isLoading, mutate: mutateProducts } = useSWR<ApiList<Product>>(session && productsEndpoint ? productsEndpoint : null, fetcher);

    const businessType: string = settingsData?.type ?? "";
    const previewSlug: string | null = (() => {
        const typed = catalogSlug.trim();
        if (typed) return typed;
        const saved = settingsData.slug?.trim();
        return saved || null;
    })();
    const hasIndustry = Boolean(settingsData?.type);
    const config = getIndustryConfig(businessType, industriesMap);

    const products: Product[] = response?.data ?? [];
    const activeProducts = products.filter((product) => product.is_active !== false);
    const disabledProducts = products.filter((product) => product.is_active === false);

    const filteredProducts = searchTerm.trim()
        ? activeProducts.filter((p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.category_name ?? "").toLowerCase().includes(searchTerm.toLowerCase())
        )
        : activeProducts;

    const filteredDisabledProducts = searchTerm.trim()
        ? disabledProducts.filter((p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.category_name ?? "").toLowerCase().includes(searchTerm.toLowerCase())
        )
        : disabledProducts;

    const moduleTitle = config.view === "menu" ? "Menú" : "Catálogo";
    const publicRouteSegment = getPublicCatalogRoute(settingsData?.type, industriesMap);

    function openCreate() { setSelectedProduct(undefined); setDialogOpen(true); }
    function openEdit(product: Product) { setSelectedProduct(product as ProductDialogProduct); setDialogOpen(true); }

    async function handleDisableProduct(product: Product) {
        const confirmed = window.confirm(`¿Deseas deshabilitar "${product.name}"? Dejará de mostrarse en ${moduleTitle.toLowerCase()}.`);
        if (!confirmed) return;
        setActingProductId(product.id);
        try {
            await apiClient.delete(endpoints.products.disable(product.id));
            await mutateProducts();
            toast({ title: "Producto deshabilitado", description: "Ya no se mostrará en tu catálogo/menú." });
        } catch {
            toast({ title: "No se pudo deshabilitar", description: "Intenta de nuevo en unos segundos.", variant: "destructive" });
        } finally {
            setActingProductId(null);
        }
    }

    async function handleHardDeleteProduct(product: Product) {
        const confirmed = window.confirm(`Esta acción eliminará definitivamente "${product.name}" y su imagen. ¿Deseas continuar?`);
        if (!confirmed) return;
        setActingProductId(product.id);
        try {
            await apiClient.delete(endpoints.products.hardDelete(product.id));
            await mutateProducts();
            toast({ title: "Producto eliminado", description: "Se eliminó de forma definitiva." });
        } catch {
            toast({ title: "No se pudo eliminar", description: "Intenta nuevamente.", variant: "destructive" });
        } finally {
            setActingProductId(null);
        }
    }

    async function handleEnableProduct(product: Product) {
        setActingProductId(product.id);
        try {
            await apiClient.patch(endpoints.products.detail(product.id, sessionBusinessPhoneId), { is_active: true });
            await mutateProducts();
            toast({ title: "Producto habilitado", description: "Ya vuelve a estar disponible en tu catálogo/menú." });
        } catch {
            toast({ title: "No se pudo habilitar", description: "Intenta nuevamente.", variant: "destructive" });
        } finally {
            setActingProductId(null);
        }
    }

    async function handleSaveCatalogPublic() {
        const trimmed = catalogSlug.trim();
        setCatalogSlugValidationError(null);
        setCatalogSlugApiError(null);
        if (!trimmed) {
            setCatalogSlugValidationError("La URL pública es obligatoria.");
            return;
        }
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)) {
            setCatalogSlugValidationError("Solo letras minúsculas, números y guiones (ej. mi-tienda).");
            return;
        }
        if (trimmed.length < 3 || trimmed.length > 100) {
            setCatalogSlugValidationError("Entre 3 y 100 caracteres.");
            return;
        }
        setCatalogMetaSaving(true);
        try {
            await apiClient.patch(endpoints.business.settings, {
                slug: trimmed,
                config: {
                    catalog_theme: {
                        preset:
                            themePreset === "default"
                                ? CATALOG_THEME_PRESET_API_WIRE
                                : themePreset,
                    },
                },
            });
            await mutateSettings();
            toast({
                title: "Guardado",
                description: "URL y tema del catálogo público actualizados.",
            });
        } catch (error: unknown) {
            if (error instanceof ApiError && error.status === 409) {
                setCatalogSlugApiError("Este slug ya está en uso por otro negocio.");
            } else if (error instanceof NetworkError) {
                toast({ title: "Error de red", description: error.message, variant: "destructive" });
            } else if (error instanceof ApiError) {
                const detail = formatValidationDetail(error);
                toast({
                    title: "Error al guardar",
                    description: detail || error.message,
                    variant: "destructive",
                });
            } else {
                toast({ title: "Error al guardar", variant: "destructive" });
            }
        } finally {
            setCatalogMetaSaving(false);
        }
    }

    if (!hasIndustry) {
        return (
            <motion.div className="max-w-3xl mx-auto" variants={containerVariants} initial="hidden" animate="show">
                <motion.div variants={itemVariants} className="rounded-2xl border border-border/60 bg-background p-6 shadow-sm space-y-4">
                    <h1 className="text-2xl font-bold tracking-tight">Primero configura tu tipo de negocio</h1>
                    <p className="text-sm text-muted-foreground">
                        Para habilitar catálogo/menú, categorías y unidades, necesitas seleccionar tu industria en configuración.
                    </p>
                    <Button asChild>
                        <a href="/dashboard/settings">Ir a configuración</a>
                    </Button>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="space-y-6 max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <motion.div
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                variants={itemVariants}
            >
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{moduleTitle}</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {config.label} · Gestiona tus {config.productLabel.toLowerCase()}s
                    </p>
                </div>
                <div className="flex w-full sm:w-auto flex-col sm:flex-row gap-2">
                    {previewSlug ? (
                        <Button variant="outline" asChild className="w-full sm:w-auto justify-center">
                            <a href={`/${publicRouteSegment}/${previewSlug}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" /> Ver {moduleTitle.toLowerCase()} público
                            </a>
                        </Button>
                    ) : (
                        <Button variant="outline" disabled title="Define la URL en «Catálogo público» abajo" className="w-full sm:w-auto justify-center">
                            <ExternalLink className="mr-2 h-4 w-4" /> {moduleTitle} público (sin URL)
                        </Button>
                    )}
                    <Button
                        className="w-full sm:w-auto bg-primary text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
                        onClick={openCreate}
                    >
                        <Plus className="mr-2 h-4 w-4" /> Nuevo {config.productLabel}
                    </Button>
                </div>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-border/60 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Catálogo público</CardTitle>
                        <CardDescription>
                            URL y apariencia de tu {moduleTitle.toLowerCase()} visible para clientes.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="catalog-public-slug" className="flex items-center gap-2 text-foreground">
                                    <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                    URL del catálogo público
                                </Label>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Identificador único. Solo letras minúsculas, números y guiones.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <span className="text-sm text-brand-forest/80 font-medium shrink-0">
                                    /{publicRouteSegment}/
                                </span>
                                <Input
                                    id="catalog-public-slug"
                                    value={catalogSlug}
                                    onChange={(e) => {
                                        setCatalogSlugApiError(null);
                                        setCatalogSlugValidationError(null);
                                        setCatalogSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                                    }}
                                    placeholder="mi-tienda"
                                    className={
                                        catalogSlugValidationError || catalogSlugApiError
                                            ? "border-destructive focus-visible:ring-destructive max-w-md"
                                            : "max-w-md"
                                    }
                                />
                            </div>
                            {catalogSlugValidationError && (
                                <p className="text-xs text-destructive flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    {catalogSlugValidationError}
                                </p>
                            )}
                            {catalogSlugApiError && (
                                <p className="text-xs text-destructive flex items-center gap-1.5">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    {catalogSlugApiError}
                                </p>
                            )}
                            {previewSlug && !catalogSlugValidationError && !catalogSlugApiError && (
                                <a
                                    href={`/${publicRouteSegment}/${previewSlug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-forest hover:underline"
                                >
                                    <ExternalLink className="h-3 w-3 shrink-0" />
                                    /{publicRouteSegment}/{previewSlug}
                                </a>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label className="text-foreground">Tema público</Label>
                            <div className="flex items-start gap-3 rounded-xl border border-border/70 p-3 bg-muted/20">
                                <input
                                    type="radio"
                                    id="catalog-theme-default"
                                    name="catalog-theme"
                                    className="mt-1 h-4 w-4 accent-brand-forest"
                                    checked={themePreset === "default"}
                                    onChange={() => setThemePreset("default")}
                                    aria-label="Tema Default"
                                />
                                <div className="min-w-0 flex-1 space-y-2">
                                    <label htmlFor="catalog-theme-default" className="text-sm font-medium cursor-pointer">
                                        Default
                                    </label>
                                    <p className="text-xs text-muted-foreground">
                                        {CATALOG_THEME_PRESETS.default.description}
                                    </p>
                                    <div
                                        className={`rounded-lg border p-3 max-w-sm ${CATALOG_THEME_PRESETS.default.tokens[publicRouteSegment].cardBackground} ${CATALOG_THEME_PRESETS.default.tokens[publicRouteSegment].border}`}
                                    >
                                        <div className={`text-xs font-semibold ${CATALOG_THEME_PRESETS.default.tokens[publicRouteSegment].title}`}>
                                            Vista previa
                                        </div>
                                        <div className={`mt-1 text-[11px] ${CATALOG_THEME_PRESETS.default.tokens[publicRouteSegment].subtitle}`}>
                                            {publicRouteSegment === "menu" ? "Menú público" : "Catálogo público"}
                                        </div>
                                        <div className="mt-2 flex items-center gap-1.5">
                                            <span className={`h-2.5 w-2.5 rounded-full ${CATALOG_THEME_PRESETS.default.tokens[publicRouteSegment].badge}`} />
                                            <span className={`h-2.5 w-2.5 rounded-full ${CATALOG_THEME_PRESETS.default.tokens[publicRouteSegment].accent}`} />
                                            <span
                                                className={`h-2.5 w-2.5 rounded-full ${CATALOG_THEME_PRESETS.default.tokens[publicRouteSegment].pageBackground} border ${CATALOG_THEME_PRESETS.default.tokens[publicRouteSegment].border}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            type="button"
                            onClick={handleSaveCatalogPublic}
                            disabled={catalogMetaSaving}
                            className="bg-brand-forest text-white hover:bg-brand-forest/90"
                        >
                            {catalogMetaSaving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="mr-2 h-4 w-4" />
                            )}
                            Guardar URL y tema
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Tabs defaultValue="products">
                    <TabsList className="mb-4">
                        <TabsTrigger value="products">{config.productLabel}s</TabsTrigger>
                        <TabsTrigger value="disabled">Deshabilitados</TabsTrigger>
                        <TabsTrigger value="categories">Categorías</TabsTrigger>
                        <TabsTrigger value="units">Unidades</TabsTrigger>
                    </TabsList>

                    <TabsContent value="products" className="space-y-4">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder={`Buscar ${config.productLabel.toLowerCase()}s...`}
                                    className="pl-9 bg-background focus-visible:ring-primary"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon" className="bg-background">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-background overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="border-border">
                                        <TableHead className="w-[50px]"></TableHead>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead className="text-right">Precio</TableHead>
                                        {config.productFields.showStock && (
                                            <TableHead className="text-right">Stock</TableHead>
                                        )}
                                        <TableHead className="text-center">Visible</TableHead>
                                        <TableHead className="text-center">Oferta</TableHead>
                                        <TableHead className="text-right w-[100px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="h-4 w-4 animate-spin" /> Cargando...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredProducts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                                {searchTerm
                                                    ? "Sin resultados para tu búsqueda."
                                                    : `No hay ${config.productLabel.toLowerCase()}s en tu ${moduleTitle.toLowerCase()}.`
                                                }
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredProducts.map((product) => (
                                            <TableRow key={product.id} className="border-border hover:bg-muted/50 transition-colors">
                                                <TableCell>
                                                    {product.image_url ? (
                                                        <Image
                                                            src={product.image_url}
                                                            alt={product.name}
                                                            width={36}
                                                            height={36}
                                                            className="w-9 h-9 rounded-md object-cover border border-border"
                                                        />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">
                                                            —
                                                        </div>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {product.category_name || "Sin categoría"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="text-xs">
                                                        {PRODUCT_TYPE_LABELS[product.product_type ?? "physical"] ?? "Físico"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    ${toFiniteNumber(product.price).toFixed(2)}{" "}
                                                    <span className="text-xs text-muted-foreground">MXN</span>
                                                </TableCell>
                                                {config.productFields.showStock && (
                                                    <TableCell className="text-right">
                                                        <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                                                            (product.stock ?? 0) > 10
                                                                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                                                                : "bg-red-500/10 text-red-700 dark:text-red-400"
                                                        }`}>
                                                            {product.stock ?? 0}
                                                        </span>
                                                    </TableCell>
                                                )}
                                                <TableCell className="text-center">
                                                    {product.is_visible !== false
                                                        ? <Eye className="h-4 w-4 text-emerald-500 mx-auto" />
                                                        : <EyeOff className="h-4 w-4 text-muted-foreground mx-auto" />
                                                    }
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {product.is_optional_offer && (
                                                        <Tag className="h-4 w-4 text-amber-500 mx-auto" />
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                                            onClick={() => openEdit(product)}
                                                        >
                                                            Editar
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={actingProductId === product.id}
                                                            className="h-8 px-2 text-amber-700 hover:text-amber-800"
                                                            onClick={() => handleDisableProduct(product)}
                                                        >
                                                            {actingProductId === product.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Deshabilitar"}
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            disabled={actingProductId === product.id}
                                                            className="h-8 px-2 text-destructive hover:text-destructive"
                                                            onClick={() => handleHardDeleteProduct(product)}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="disabled" className="space-y-4">
                        <div className="rounded-2xl border border-border/60 bg-background overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="border-border">
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead className="text-right">Precio</TableHead>
                                        <TableHead className="text-right w-[160px]">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDisabledProducts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                                                No tienes productos deshabilitados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredDisabledProducts.map((product) => (
                                            <TableRow key={product.id} className="border-border">
                                                <TableCell className="font-medium">{product.name}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm">
                                                    {product.category_name || "Sin categoría"}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    ${toFiniteNumber(product.price).toFixed(2)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={actingProductId === product.id}
                                                        onClick={() => handleEnableProduct(product)}
                                                    >
                                                        {actingProductId === product.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                                                        Habilitar
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="categories">
                        <CategoriesManager businessPhoneId={sessionBusinessPhoneId} />
                    </TabsContent>

                    <TabsContent value="units">
                        <UnitsManager relevantUnits={config.relevantUnits} />
                    </TabsContent>
                </Tabs>
            </motion.div>

            <ProductDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                config={config}
                businessPhoneId={sessionBusinessPhoneId}
                product={selectedProduct}
            />
        </motion.div>
    );
}
