"use client";

import { useState, useEffect, useRef } from "react";
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
    ImageIcon,
    Upload,
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
    type CatalogThemePreset,
    type CatalogThemeCustom,
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const MAX_BANNER_BYTES = 10 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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
    images?: string[];
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
    const [themeCustom, setThemeCustom] = useState<CatalogThemeCustom>({ primary: "#1A3E35", secondary: "#74E79C" });
    const [catalogPublic, setCatalogPublic] = useState(false);
    const [catalogMetaSaving, setCatalogMetaSaving] = useState(false);
    const [catalogSlugApiError, setCatalogSlugApiError] = useState<string | null>(null);
    const [catalogSlugValidationError, setCatalogSlugValidationError] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);
    const bannerInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setCatalogSlug(settingsData.slug ?? "");
        const rawTheme = settingsData.config?.catalog_theme;
        const preset = rawTheme?.preset;
        if (preset === "peach" || preset === "ocean" || preset === "custom") {
            setThemePreset(preset as CatalogThemePreset);
        } else {
            setThemePreset("default");
        }
        if (rawTheme?.custom?.primary && rawTheme?.custom?.secondary) {
            setThemeCustom({ primary: rawTheme.custom.primary, secondary: rawTheme.custom.secondary });
        }
        setCatalogPublic(settingsData.config?.catalog_public === true);
    }, [settingsData.slug, settingsData.config?.catalog_theme, settingsData.config?.catalog_public]);

    useEffect(() => {
        return () => {
            if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
        };
    }, [logoPreview]);

    useEffect(() => {
        return () => {
            if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
        };
    }, [bannerPreview]);
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

    const currentLogoUrl =
        logoPreview ?? (typeof settingsData.config?.catalog_logo_url === "string" ? settingsData.config.catalog_logo_url : null);

    function handleLogoFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!ALLOWED_LOGO_TYPES.has(file.type)) {
            toast({
                title: "Formato no permitido",
                description: "Usa JPG, PNG o WEBP.",
                variant: "destructive",
            });
            return;
        }
        if (file.size > MAX_LOGO_BYTES) {
            toast({
                title: "Archivo demasiado grande",
                description: "El logo debe ser menor a 5 MB.",
                variant: "destructive",
            });
            return;
        }
        if (logoPreview?.startsWith("blob:")) URL.revokeObjectURL(logoPreview);
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
        event.target.value = "";
    }

    async function handleUploadLogo() {
        if (!logoFile) return;
        setIsUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append("file", logoFile);
            await apiClient.uploadForm(endpoints.business.logoUpload, formData);
            await mutateSettings();
            setLogoFile(null);
            setLogoPreview(null);
            toast({ title: "Logo actualizado" });
        } catch (error: unknown) {
            let description = "No se pudo subir el logo.";
            if (error instanceof NetworkError) description = error.message;
            else if (error instanceof ApiError && error.message) description = error.message;
            toast({ title: "Error", description, variant: "destructive" });
        } finally {
            setIsUploadingLogo(false);
        }
    }

    function handleBannerFileChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;
        if (!ALLOWED_LOGO_TYPES.has(file.type)) {
            toast({
                title: "Formato no permitido",
                description: "Usa JPG, PNG o WEBP.",
                variant: "destructive",
            });
            return;
        }
        if (file.size > MAX_BANNER_BYTES) {
            toast({
                title: "Archivo demasiado grande",
                description: "El banner debe ser menor a 10 MB.",
                variant: "destructive",
            });
            return;
        }
        if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
        setBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
        event.target.value = "";
    }

    async function handleUploadBanner() {
        if (!bannerFile) return;
        setIsUploadingBanner(true);
        try {
            const formData = new FormData();
            formData.append("file", bannerFile);
            await apiClient.uploadForm(endpoints.business.bannerUpload, formData);
            await mutateSettings();
            setBannerFile(null);
            setBannerPreview(null);
            toast({ title: "Portada actualizada" });
        } catch (error: unknown) {
            let description = "No se pudo subir la portada.";
            if (error instanceof NetworkError) description = error.message;
            else if (error instanceof ApiError && error.message) description = error.message;
            toast({ title: "Error", description, variant: "destructive" });
        } finally {
            setIsUploadingBanner(false);
        }
    }

    async function handleSaveCatalogPublic() {
        const trimmed = catalogSlug.trim();
        setCatalogSlugValidationError(null);
        setCatalogSlugApiError(null);
        if (catalogPublic) {
            if (!trimmed) {
                setCatalogSlugValidationError("Define una URL (slug) para el catálogo público.");
                return;
            }
            if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trimmed)) {
                setCatalogSlugValidationError("Solo letras minúsculas, números y guiones.");
                return;
            }
            if (trimmed.length < 3 || trimmed.length > 100) {
                setCatalogSlugValidationError("Entre 3 y 100 caracteres.");
                return;
            }
        }
        const prevCfg = { ...(settingsData.config || {}) };
        setCatalogMetaSaving(true);
        try {
            await apiClient.patch(endpoints.business.settings, {
                slug: catalogPublic ? trimmed : settingsData.slug ?? null,
                config: {
                    ...prevCfg,
                    catalog_public: catalogPublic,
                    catalog_theme: {
                        preset: themePreset,
                        ...(themePreset === "custom" && { custom: themeCustom }),
                    },
                },
            });
            await mutateSettings();
            toast({
                title: "Guardado",
                description: "Ajustes del catálogo público actualizados.",
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
                        <a href="/dashboard">Ir al tablero</a>
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
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                variants={itemVariants}
            >
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">{moduleTitle}</h1>
                <div className="flex w-full sm:w-auto flex-wrap gap-2">
                    {catalogPublic && previewSlug ? (
                        <Button variant="outline" asChild size="sm" className="justify-center">
                            <a href={`/${publicRouteSegment}/${previewSlug}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" /> Ver público
                            </a>
                        </Button>
                    ) : (
                        <Button variant="outline" size="sm" disabled className="justify-center" title={!catalogPublic ? "Activa el catálogo público abajo" : "Define la URL abajo"}>
                            <ExternalLink className="mr-2 h-4 w-4" /> Ver público
                        </Button>
                    )}
                    <Button size="sm" className="bg-primary text-primary-foreground shadow-sm hover:opacity-90" onClick={openCreate}>
                        <Plus className="mr-2 h-4 w-4" /> Nuevo {config.productLabel}
                    </Button>
                </div>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card className="rounded-2xl border-border/60 shadow-sm">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">{moduleTitle} público</CardTitle>
                        <CardDescription className="text-xs">
                            Activa la vista para clientes, URL, tema y logo. Si está desactivado, la página pública no estará disponible.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        <div className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2.5">
                            <div>
                                <p className="text-sm font-medium">Visible públicamente</p>
                                <p className="text-xs text-muted-foreground">Controla si el enlace público responde o no.</p>
                            </div>
                            <Switch checked={catalogPublic} onCheckedChange={setCatalogPublic} aria-label="Catálogo público activo" />
                        </div>

                        <div className={`space-y-2 ${!catalogPublic ? "opacity-50 pointer-events-none" : ""}`}>
                            <Label htmlFor="catalog-public-slug" className="text-xs font-medium flex items-center gap-1.5">
                                <LinkIcon className="h-3.5 w-3.5" /> URL ({publicRouteSegment})
                            </Label>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 max-w-lg">
                                <span className="text-sm text-muted-foreground shrink-0">/{publicRouteSegment}/</span>
                                <Input
                                    id="catalog-public-slug"
                                    value={catalogSlug}
                                    onChange={(e) => {
                                        setCatalogSlugApiError(null);
                                        setCatalogSlugValidationError(null);
                                        setCatalogSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                                    }}
                                    placeholder="mi-tienda"
                                    disabled={!catalogPublic}
                                    className={
                                        catalogSlugValidationError || catalogSlugApiError
                                            ? "border-destructive"
                                            : ""
                                    }
                                />
                            </div>
                            {catalogSlugValidationError && (
                                <p className="text-xs text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    {catalogSlugValidationError}
                                </p>
                            )}
                            {catalogSlugApiError && (
                                <p className="text-xs text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                    {catalogSlugApiError}
                                </p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label className="text-xs font-medium">Tema del catálogo</Label>
                            <p className="text-xs text-muted-foreground">Elige la paleta visual que verán tus clientes.</p>
                            {/* Picker de temas preset */}
                            <div className="grid grid-cols-3 gap-2">
                                {(["default", "peach", "ocean"] as const).map((key) => {
                                    const def = CATALOG_THEME_PRESETS[key];
                                    const [c1, c2, c3] = def.previewColors;
                                    const selected = themePreset === key;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setThemePreset(key)}
                                            className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-2.5 text-center transition-all ${
                                                selected
                                                    ? "border-brand-forest ring-1 ring-brand-forest/40"
                                                    : "border-muted hover:border-brand-forest/40"
                                            }`}
                                        >
                                            {/* Preview de colores */}
                                            <div className="flex gap-1">
                                                {[c1, c2, c3].map((c, i) => (
                                                    <span
                                                        key={i}
                                                        className="h-4 w-4 rounded-full ring-1 ring-black/10"
                                                        style={{ backgroundColor: c }}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-[11px] font-semibold leading-none">{def.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                            {/* Opción Custom */}
                            <button
                                type="button"
                                onClick={() => setThemePreset("custom")}
                                className={`flex w-full items-center gap-3 rounded-xl border-2 px-3 py-2.5 transition-all ${
                                    themePreset === "custom"
                                        ? "border-brand-forest ring-1 ring-brand-forest/40"
                                        : "border-muted hover:border-brand-forest/40"
                                }`}
                            >
                                <div className="flex gap-1">
                                    <span className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ backgroundColor: themeCustom.primary }} />
                                    <span className="h-4 w-4 rounded-full ring-1 ring-black/10" style={{ backgroundColor: themeCustom.secondary }} />
                                </div>
                                <span className="text-[11px] font-semibold">Personalizado</span>
                            </button>
                            {/* Color pickers si es custom */}
                            {themePreset === "custom" && (
                                <div className="flex flex-wrap gap-4 rounded-xl border bg-muted/40 p-3">
                                    <label className="flex flex-col gap-1 text-xs font-medium">
                                        Color principal
                                        <input
                                            type="color"
                                            value={themeCustom.primary}
                                            onChange={(e) => setThemeCustom((t) => ({ ...t, primary: e.target.value }))}
                                            className="h-8 w-16 cursor-pointer rounded border"
                                        />
                                    </label>
                                    <label className="flex flex-col gap-1 text-xs font-medium">
                                        Color secundario
                                        <input
                                            type="color"
                                            value={themeCustom.secondary}
                                            onChange={(e) => setThemeCustom((t) => ({ ...t, secondary: e.target.value }))}
                                            className="h-8 w-16 cursor-pointer rounded border"
                                        />
                                    </label>
                                    <p className="w-full text-[11px] text-muted-foreground">
                                        El sistema genera automáticamente los colores de texto, fondo y botones con el mejor contraste.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-medium flex items-center gap-1.5">
                                <ImageIcon className="h-3.5 w-3.5" /> Logo
                            </Label>
                            <div className="flex flex-wrap items-center gap-3">
                                {currentLogoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element -- blob previews
                                    <img
                                        src={currentLogoUrl}
                                        alt="Logo"
                                        width={48}
                                        height={48}
                                        className="h-12 w-12 rounded-md border object-cover"
                                    />
                                ) : (
                                    <div className="h-12 w-12 rounded-md border bg-muted flex items-center justify-center text-muted-foreground">
                                        <ImageIcon className="h-5 w-5" />
                                    </div>
                                )}
                                <div className="flex flex-col gap-1.5">
                                    <Input
                                        ref={logoInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="max-w-[220px] text-xs h-8"
                                        onChange={handleLogoFileChange}
                                    />
                                    {logoFile && (
                                        <Button type="button" size="sm" variant="secondary" disabled={isUploadingLogo} onClick={handleUploadLogo}>
                                            {isUploadingLogo ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                                            Subir logo
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground">Se optimiza para el catálogo o menú público. Se convierte a WebP automáticamente.</p>
                        </div>

                        {/* Banner / portada */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium flex items-center gap-1.5">
                                <ImageIcon className="h-3.5 w-3.5" /> Imagen de portada
                                <span className="text-[10px] font-normal text-muted-foreground">(header del catálogo)</span>
                            </Label>
                            {/* Preview del banner actual */}
                            {(bannerPreview ?? settingsData.config?.catalog_banner_url) && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={bannerPreview ?? (settingsData.config?.catalog_banner_url as string)}
                                    alt="Banner"
                                    className="w-full max-h-24 rounded-md border object-cover"
                                />
                            )}
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <Input
                                        ref={bannerInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="max-w-[220px] text-xs h-8"
                                        onChange={handleBannerFileChange}
                                    />
                                    {bannerFile && (
                                        <Button type="button" size="sm" variant="secondary" disabled={isUploadingBanner} onClick={handleUploadBanner}>
                                            {isUploadingBanner ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                                            Subir portada
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground">Imagen ancha que aparece como fondo del header. Se convierte a WebP automáticamente.</p>
                        </div>

                        <Button
                            type="button"
                            onClick={handleSaveCatalogPublic}
                            disabled={catalogMetaSaving}
                            size="sm"
                            className="bg-brand-forest text-white hover:bg-brand-forest/90"
                        >
                            {catalogMetaSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            Guardar cambios
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
