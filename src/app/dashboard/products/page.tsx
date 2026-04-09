"use client";

import { useState } from "react";
import { Plus, Search, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { INDUSTRIES, IndustryType } from "@/config/industries";
import { useSession } from "next-auth/react";
import { ProductDialog } from "@/components/products/product-dialog";
import { motion, Variants } from "framer-motion";
import useSWR from "swr";
import { endpoints } from "@/lib/api";
import { getSessionBusinessPhoneId } from "@/lib/business";

interface Product {
    id: string;
    name: string;
    category_id?: string | null;
    price: string | number;
    stock?: number | null;
    barcode?: string | null;
    ingredients?: string | null;
    preparation_time_min?: number | null;
}

function toFiniteNumber(value: string | number | null | undefined): number {
    const parsed = typeof value === "number" ? value : Number.parseFloat(value ?? "0");
    return Number.isFinite(parsed) ? parsed : 0;
}

function getStockValue(stock: number | null | undefined): number | null {
    return typeof stock === "number" && Number.isFinite(stock) ? stock : null;
}

const containerVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
};

export default function ProductsPage() {
    const { data: session } = useSession();
    const [searchTerm, setSearchTerm] = useState("");

    const sessionBusinessPhoneId = getSessionBusinessPhoneId(session);

    const currentIndustry: IndustryType = "abarrotera";
    const config = INDUSTRIES[currentIndustry];

    const { data: response, isLoading } = useSWR(
        session && sessionBusinessPhoneId ? endpoints.products.list : null
    );

    const products = (response?.data || []) as Product[];

    return (
        <motion.div
            className="space-y-6 max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <motion.div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" variants={itemVariants}>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Catálogo de Productos
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Gestiona tu inventario. Vista adaptada para: <span className="font-medium capitalize text-foreground">{currentIndustry}</span>.
                    </p>
                </div>
                <ProductDialog config={config} industry={currentIndustry}>
                    <Button className="bg-primary text-primary-foreground shadow-sm hover:opacity-90 transition-opacity">
                        <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
                    </Button>
                </ProductDialog>
            </motion.div>

            <motion.div className="flex items-center gap-2" variants={itemVariants}>
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar productos..."
                        className="pl-9 bg-background focus-visible:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon" className="bg-background">
                    <Filter className="h-4 w-4" />
                </Button>
            </motion.div>

            <motion.div className="rounded-xl border border-border bg-background overflow-hidden shadow-sm" variants={itemVariants}>
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="border-border">
                            <TableHead className="w-[300px]">Nombre</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right">Precio</TableHead>

                            {config.productFields.showStock && <TableHead className="text-right">Stock</TableHead>}
                            {config.productFields.showBarcode && <TableHead className="hidden md:table-cell">Código</TableHead>}
                            {config.productFields.showIngredients && <TableHead>Ingredientes</TableHead>}
                            {config.productFields.showPreparationTime && <TableHead>Tiempos (min)</TableHead>}

                            <TableHead className="text-right w-[100px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Cargando productos...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    No hay productos en tu catálogo.
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product) => {
                                const stockValue = getStockValue(product.stock);

                                return (
                                <TableRow key={product.id} className="border-border hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{product.category_id || "Sin Categoría"}</TableCell>
                                    <TableCell className="text-right font-medium">${toFiniteNumber(product.price).toFixed(2)}</TableCell>

                                    {config.productFields.showStock && (
                                        <TableCell className="text-right">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${stockValue !== null && stockValue > 10 ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-red-500/10 text-red-700 dark:text-red-400'}`}>
                                                {stockValue ?? "N/A"}
                                            </span>
                                        </TableCell>
                                    )}

                                    {config.productFields.showBarcode && (
                                        <TableCell className="hidden md:table-cell text-muted-foreground font-mono text-xs">
                                            {product.barcode || "N/A"}
                                        </TableCell>
                                    )}

                                    {config.productFields.showIngredients && (
                                        <TableCell className="text-muted-foreground text-sm">{product.ingredients || "N/A"}</TableCell>
                                    )}

                                    {config.productFields.showPreparationTime && (
                                        <TableCell className="text-muted-foreground text-sm">{product.preparation_time_min ? `${product.preparation_time_min} min` : "N/A"}</TableCell>
                                    )}

                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground hover:text-foreground">
                                            Editar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </motion.div>
        </motion.div>
    );
}
