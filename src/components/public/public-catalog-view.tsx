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
  titleClass,
  subtitleClass,
}: {
  product: PublicCatalogProductItem;
  view: PublicView;
  accentClass: string;
  borderClass: string;
  cardClass: string;
  titleClass: string;
  subtitleClass: string;
}) {
  const isMenu = view === "menu";

  return (
    <div
      className={`group rounded-xl border p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-brand-spring/50 ${borderClass} ${cardClass}`}
    >
      <div className="flex gap-3">
        {product.image_url ? (
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg ring-1 ring-black/5">
            <Image
              src={product.image_url}
              alt={product.name}
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-brand-mint">
            {isMenu ? (
              <UtensilsCrossed className="h-6 w-6 text-brand-forest/45" />
            ) : (
              <Package className="h-6 w-6 text-brand-forest/45" />
            )}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className={`font-semibold truncate ${titleClass}`}>{product.name}</p>
          {product.description && (
            <p className={`mt-1 text-xs line-clamp-3 ${subtitleClass}`}>{product.description}</p>
          )}
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className={`text-sm font-bold ${accentClass}`}>{formatPrice(product.price)}</span>
            {isMenu ? (
              <span className={`text-[11px] inline-flex items-center gap-1 ${subtitleClass}`}>
                <Clock3 className="h-3.5 w-3.5 shrink-0" />
                Preparación sugerida
              </span>
            ) : product.unit && product.unit !== "pieza" ? (
              <span className={`text-[11px] ${subtitleClass}`}>/ {product.unit}</span>
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
    CATALOG_THEME_PRESETS[preset]?.tokens[view] ?? CATALOG_THEME_PRESETS.default.tokens[view];
  const atLimit = catalog.plan_limit !== null && catalog.total_products >= catalog.plan_limit;

  return (
    <div className={`min-h-screen ${tokens.pageBackground}`}>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        <div className={`relative overflow-hidden rounded-2xl border shadow-sm ${tokens.border} ${tokens.cardBackground}`}>
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-spring/0 via-brand-spring to-brand-spring/0" aria-hidden />
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-mint ring-1 ring-brand-forest/10">
                {catalog.catalog_logo_url ? (
                  <Image
                    src={catalog.catalog_logo_url}
                    alt={`Logo de ${catalog.business_name}`}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                ) : isMenu ? (
                  <UtensilsCrossed className="h-8 w-8 text-brand-forest/50" />
                ) : (
                  <ShoppingBag className="h-8 w-8 text-brand-forest/50" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className={`text-2xl font-bold tracking-tight sm:text-3xl ${tokens.title}`}>{catalog.business_name}</h1>
                <p className={`mt-1 text-sm capitalize ${tokens.subtitle}`}>
                  {catalog.business_type} · {isMenu ? "Menú digital" : "Catálogo digital"}
                </p>
              </div>
              <span className={`inline-flex shrink-0 self-start rounded-full px-4 py-1.5 text-xs font-semibold sm:self-center ${tokens.badge}`}>
                {isMenu ? "Menú" : "Catálogo"}
              </span>
            </div>
          </div>
        </div>

        {atLimit && (
          <div className={`mt-6 rounded-xl border px-4 py-3 text-sm ${tokens.border} ${tokens.cardBackground} ${tokens.subtitle}`}>
            Mostrando los primeros {catalog.plan_limit} elementos disponibles.
          </div>
        )}

        {catalog.sections.length === 0 ? (
          <div
            className={`mt-8 flex flex-col items-center gap-4 rounded-2xl border py-20 text-center ${tokens.border} ${tokens.cardBackground}`}
          >
            <div className="rounded-full bg-brand-mint p-4">
              <Package className="h-10 w-10 text-brand-forest/50" />
            </div>
            <p className={`text-lg font-medium ${tokens.title}`}>
              {isMenu ? "Este menú aún no tiene platillos." : "Este catálogo aún no tiene productos."}
            </p>
          </div>
        ) : (
          <div className="mt-10 space-y-10">
            {catalog.sections.map((section) => (
              <section key={section.id ?? "__none__"} className="space-y-4">
                <div className={`flex flex-wrap items-end justify-between gap-2 border-b border-brand-spring/35 pb-3`}>
                  <div>
                    <h2 className={`text-xl font-semibold ${tokens.title}`}>{section.name}</h2>
                    <p className={`mt-0.5 text-xs ${tokens.subtitle}`}>
                      {section.products.length} {isMenu ? "opciones" : "productos"}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${tokens.badge}`}>
                    {section.products.length} {isMenu ? "en esta sección" : "artículos"}
                  </span>
                </div>
                <div
                  className={`grid gap-4 ${isMenu ? "md:max-w-2xl md:mx-auto" : "sm:grid-cols-2 lg:grid-cols-3"}`}
                >
                  {section.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      view={view}
                      accentClass={tokens.accent}
                      borderClass={tokens.border}
                      cardClass={tokens.cardBackground}
                      titleClass={tokens.title}
                      subtitleClass={tokens.subtitle}
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
