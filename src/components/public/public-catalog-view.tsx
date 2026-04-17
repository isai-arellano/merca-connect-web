import Image from "next/image";
import { Clock3, Package, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { CATALOG_THEME_PRESETS, resolveCatalogThemePreset, type PublicView } from "@/config/catalog-themes";

export interface PublicCatalogProductItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string | null;
  image_url: string | null;
  category_name: string | null;
}

export interface PublicCatalogSection {
  id: string | null;
  name: string;
  products: PublicCatalogProductItem[];
}

export interface PublicCatalogData {
  business_name: string;
  business_type: string;
  slug: string | null;
  total_products: number;
  plan_limit: number | null;
  sections: PublicCatalogSection[];
  catalog_logo_url: string | null;
  public_view?: PublicView;
  catalog_theme?: {
    preset: string;
  };
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(price);
}

function ProductCard({
  product,
  view,
  accentClass,
  borderClass,
  cardClass,
}: {
  product: PublicCatalogProductItem;
  view: PublicView;
  accentClass: string;
  borderClass: string;
  cardClass: string;
}) {
  const isMenu = view === "menu";

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${borderClass} ${cardClass}`}>
      <div className="flex gap-3">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            width={80}
            height={80}
            className="h-20 w-20 rounded-lg object-cover shrink-0"
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-black/5">
            {isMenu ? <UtensilsCrossed className="h-6 w-6 opacity-70" /> : <Package className="h-6 w-6 opacity-70" />}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-semibold truncate">{product.name}</p>
          {product.description && (
            <p className="mt-1 text-xs opacity-80 line-clamp-3">{product.description}</p>
          )}
          <div className="mt-3 flex items-center justify-between">
            <span className={`text-sm font-bold ${accentClass}`}>{formatPrice(product.price)}</span>
            {isMenu ? (
              <span className="text-[11px] opacity-75 inline-flex items-center gap-1">
                <Clock3 className="h-3.5 w-3.5" />
                Preparación sugerida
              </span>
            ) : product.unit && product.unit !== "pieza" ? (
              <span className="text-[11px] opacity-75">/ {product.unit}</span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PublicCatalogView({ catalog }: { catalog: PublicCatalogData }) {
  const view: PublicView = catalog.public_view ?? "catalogo";
  const isMenu = view === "menu";
  const preset = resolveCatalogThemePreset(catalog.catalog_theme?.preset);
  const tokens =
    CATALOG_THEME_PRESETS[preset]?.tokens[view] ??
    CATALOG_THEME_PRESETS.brand_classic.tokens[view];
  const atLimit = catalog.plan_limit !== null && catalog.total_products >= catalog.plan_limit;

  return (
    <div className={`min-h-screen ${tokens.pageBackground}`}>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className={`mb-8 rounded-2xl border p-5 ${tokens.border} ${tokens.cardBackground}`}>
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-black/5 overflow-hidden">
              {catalog.catalog_logo_url ? (
                <Image
                  src={catalog.catalog_logo_url}
                  alt={`Logo de ${catalog.business_name}`}
                  width={56}
                  height={56}
                  className="h-14 w-14 object-cover"
                />
              ) : isMenu ? (
                <UtensilsCrossed className="h-7 w-7 opacity-70" />
              ) : (
                <ShoppingBag className="h-7 w-7 opacity-70" />
              )}
            </div>
            <div className="min-w-0">
              <h1 className={`text-2xl font-bold ${tokens.title}`}>{catalog.business_name}</h1>
              <p className={`text-sm capitalize ${tokens.subtitle}`}>
                {catalog.business_type} · {isMenu ? "Menú digital" : "Catálogo digital"}
              </p>
            </div>
            <span className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${tokens.badge}`}>
              {isMenu ? "Menú" : "Catálogo"}
            </span>
          </div>
        </div>

        {atLimit && (
          <div className={`mb-6 rounded-lg border px-4 py-3 text-sm ${tokens.border} ${tokens.cardBackground}`}>
            Mostrando los primeros {catalog.plan_limit} elementos disponibles.
          </div>
        )}

        {catalog.sections.length === 0 ? (
          <div className={`flex flex-col items-center gap-3 rounded-2xl border py-20 text-center ${tokens.border} ${tokens.cardBackground}`}>
            <Package className="h-10 w-10 opacity-70" />
            <p className={`text-lg font-medium ${tokens.title}`}>
              {isMenu ? "Este menú aún no tiene platillos." : "Este catálogo aún no tiene productos."}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {catalog.sections.map((section) => (
              <section key={section.id ?? "__none__"} className={`rounded-2xl border p-4 ${tokens.border} ${tokens.cardBackground}`}>
                <div className="mb-4 flex items-center justify-between border-b pb-2">
                  <h2 className={`text-lg font-semibold ${tokens.title}`}>{section.name}</h2>
                  <span className={`text-xs font-medium rounded-full px-2 py-1 ${tokens.badge}`}>
                    {section.products.length} {isMenu ? "opciones" : "productos"}
                  </span>
                </div>
                <div className={`grid gap-3 ${isMenu ? "md:grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                  {section.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      view={view}
                      accentClass={tokens.accent}
                      borderClass={tokens.border}
                      cardClass={tokens.cardBackground}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
