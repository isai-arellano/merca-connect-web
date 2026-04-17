"use client";

import { useState } from "react";
import { Plus, Search, Filter, Loader2, ExternalLink, Eye, EyeOff, Tag, Trash2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getIndustryConfig } from "@/config/industries";
import { useSession } from "next-auth/react";
import { ProductDialog, ProductDialogProduct } from "@/components/products/product-dialog";
import { CategoriesManager } from "@/components/products/categories-manager";
import { UnitsManager } from "@/components/products/units-manager";
import { motion, Variants } from "framer-motion";
import useSWR from "swr";
import { endpoints } from "@/lib/api";
import { apiClient, fetcher } from "@/lib/api-client";
import { getSessionBusinessPhoneId } from "@/lib/business";
import { type ApiList } from "@/types/api";
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

export default function ProductsPage() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductDialogProduct | undefined>(undefined);
    const [actingProductId, setActingProductId] = useState<string | null>(null);

    const sessionBusinessPhoneId = getSessionBusinessPhoneId(session);

    const { data: settingsData } = useSWR<{ slug?: string; type?: string }>(session ? endpoints.business.settings : null, fetcher);
    const productsEndpoint = sessionBusinessPhoneId ? endpoints.products.list(sessionBusinessPhoneId, true) : null;
    const { data: response, isLoading, mutate: mutateProducts } = useSWR<ApiList<Product>>(session && productsEndpoint ? productsEndpoint : null, fetcher);

    const businessSlug: string | null = settingsData?.slug ?? null;
    const businessType: string = settingsData?.type ?? "";
    const hasIndustry = Boolean(settingsData?.type);
    const config = getIndustryConfig(businessType);

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
                    {businessSlug ? (
                        <Button variant="outline" asChild className="w-full sm:w-auto justify-center">
                            <a href={`/catalogo/${businessSlug}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" /> Ver {moduleTitle.toLowerCase()} público
                            </a>
                        </Button>
                    ) : (
                        <Button variant="outline" disabled title="Configura un slug en Ajustes" className="w-full sm:w-auto justify-center">
                            <ExternalLink className="mr-2 h-4 w-4" /> {moduleTitle} público (sin slug)
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
                businessType={businessType}
                businessPhoneId={sessionBusinessPhoneId}
                product={selectedProduct}
            />
        </motion.div>
    );
}
