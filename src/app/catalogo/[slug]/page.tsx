import { notFound } from "next/navigation";
import { API_URL } from "@/lib/api";
import type { Metadata } from "next";
import Image from "next/image";
import { ShoppingBag, Package } from "lucide-react";

interface CatalogProductItem {
    id: string;
    name: string;
    description: string | null;
    price: number;
    unit: string | null;
    image_url: string | null;
    category_name: string | null;
}

interface CatalogSection {
    id: string | null;
    name: string;
    products: CatalogProductItem[];
}

interface CatalogData {
    business_name: string;
    business_type: string;
    slug: string | null;
    total_products: number;
    plan_limit: number | null;
    sections: CatalogSection[];
}

async function getCatalog(slug: string): Promise<CatalogData | null> {
    try {
        const res = await fetch(
            `${API_URL}/api/v1/catalog/${encodeURIComponent(slug)}`,
            { next: { revalidate: 60 } },
        );
        if (!res.ok) return null;
        return res.json();
    } catch {
        return null;
    }
}

export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
    const { slug } = await params;
    const catalog = await getCatalog(slug);
    if (!catalog) return { title: "Catálogo no encontrado" };
    return {
        title: `${catalog.business_name} — Catálogo`,
        description: `Explora los productos de ${catalog.business_name}.`,
    };
}

function formatPrice(price: number): string {
    return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(price);
}

function ProductCard({ product }: { product: CatalogProductItem }) {
    return (
        <div className="flex gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            {product.image_url ? (
                <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-16 w-16 rounded-lg object-cover shrink-0"
                />
            ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Package className="h-6 w-6 text-muted-foreground" />
                </div>
            )}
            <div className="flex flex-1 flex-col justify-between min-w-0">
                <div>
                    <p className="font-semibold text-foreground truncate">{product.name}</p>
                    {product.description && (
                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                    )}
                </div>
                <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">{formatPrice(product.price)}</span>
                    {product.unit && product.unit !== "pieza" && (
                        <span className="text-xs text-muted-foreground">/ {product.unit}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

export default async function CatalogPage(
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const catalog = await getCatalog(slug);

    if (!catalog) notFound();

    const atLimit = catalog.plan_limit !== null && catalog.total_products >= catalog.plan_limit;

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-2xl px-4 py-8">
                <div className="mb-8 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <ShoppingBag className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{catalog.business_name}</h1>
                        <p className="text-sm text-muted-foreground capitalize">{catalog.business_type}</p>
                    </div>
                </div>

                {atLimit && (
                    <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        Mostrando los primeros {catalog.plan_limit} productos del catálogo.
                    </div>
                )}

                {catalog.sections.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
                        <Package className="h-10 w-10" />
                        <p className="text-lg font-medium">Este catálogo aún no tiene productos.</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {catalog.sections.map((section) => (
                            <section key={section.id ?? "__none__"}>
                                <h2 className="mb-3 border-b border-border pb-2 text-lg font-semibold text-foreground">
                                    {section.name}
                                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                                        ({section.products.length})
                                    </span>
                                </h2>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    {section.products.map((product) => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                )}

                <div className="mt-12 flex flex-col items-center justify-center gap-2 border-t border-border pt-6 text-xs text-muted-foreground">
                    <Image
                        src="/images/isologo-mc-white.webp"
                        alt="MercaConnect"
                        width={80}
                        height={24}
                        className="h-6 w-auto object-contain"
                        unoptimized
                    />
                    <div className="flex items-center gap-2">
                        <span>Powered by</span>
                        <a
                            href="https://kolyn.io"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 hover:text-foreground"
                        >
                            <Image
                                src="/images/isologo-kolyn.webp"
                                alt="Kolyn"
                                width={16}
                                height={16}
                                className="h-4 w-4 object-contain"
                                unoptimized
                            />
                            <span className="font-medium">kolyn.io</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
