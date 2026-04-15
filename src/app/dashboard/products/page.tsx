"use client";

import { useState } from "react";
import { Plus, Search, Filter, Loader2, ExternalLink, Eye, EyeOff, Tag } from "lucide-react";
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
import { fetcher } from "@/lib/api-client";
import { getSessionBusinessPhoneId } from "@/lib/business";

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
    const [searchTerm, setSearchTerm] = useState("");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductDialogProduct | undefined>(undefined);

    const sessionBusinessPhoneId = getSessionBusinessPhoneId(session);

    const { data: settingsData } = useSWR(session ? endpoints.business.settings : null, fetcher);
    const productsEndpoint = sessionBusinessPhoneId ? endpoints.products.list(sessionBusinessPhoneId) : null;
    const { data: response, isLoading } = useSWR(session && productsEndpoint ? productsEndpoint : null, fetcher);

    const businessSlug: string | null = settingsData?.slug ?? null;
    const businessType: string = settingsData?.type ?? "abarrotera";
    const config = getIndustryConfig(businessType);

    const products = (response?.data || []) as Product[];
    const filteredProducts = searchTerm.trim()
        ? products.filter((p) =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.category_name ?? "").toLowerCase().includes(searchTerm.toLowerCase())
        )
        : products;

    const moduleTitle = config.view === "menu" ? "Menú" : "Catálogo";

    function openCreate() { setSelectedProduct(undefined); setDialogOpen(true); }
    function openEdit(product: Product) { setSelectedProduct(product as ProductDialogProduct); setDialogOpen(true); }

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
                <div className="flex gap-2">
                    {businessSlug ? (
                        <Button variant="outline" asChild>
                            <a href={`/catalogo/${businessSlug}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" /> Ver {moduleTitle.toLowerCase()} público
                            </a>
                        </Button>
                    ) : (
                        <Button variant="outline" disabled title="Configura un slug en Ajustes">
                            <ExternalLink className="mr-2 h-4 w-4" /> {moduleTitle} público (sin slug)
                        </Button>
                    )}
                    <Button
                        className="bg-primary text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
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
                                                        <img
                                                            src={product.image_url}
                                                            alt={product.name}
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
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-2 text-muted-foreground hover:text-foreground"
                                                        onClick={() => openEdit(product)}
                                                    >
                                                        Editar
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
