"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  ShoppingCart,
  Package,
  UtensilsCrossed,
  Search,
  Minus,
  Plus,
  Trash2,
  Copy,
  MessageCircle,
  X,
  CheckCheck,
  MapPin,
  Phone,
  CreditCard,
  Globe,
  Instagram,
  Facebook,
  ExternalLink,
} from "lucide-react";
import {
  resolveThemeTokens,
  type CatalogThemeApiData,
  type PublicView,
  type ResolvedThemeTokens,
} from "@/config/catalog-themes";
import { useCatalogCart } from "@/hooks/useCatalogCart";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

// ─── Tipos públicos ────────────────────────────────────────────────────────────

export interface PublicCatalogProductItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  unit: string | null;
  image_url: string | null;
  /** Galería (máx. 3); si viene vacío, usar solo image_url */
  images?: string[];
  category_name: string | null;
}

export interface PublicCatalogSection {
  id: string | null;
  name: string;
  products: PublicCatalogProductItem[];
}

export interface CatalogBusinessInfo {
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  payment_methods?: string[];
  delivery_zone?: string | null;
  business_category?: string | null;
  delivery_mode?: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  whatsapp_social?: string | null;
  catalog_banner_url?: string | null;
}

export interface PublicCatalogData {
  business_name: string;
  business_type: string;
  slug: string | null;
  total_products: number;
  plan_limit: number | null;
  sections: PublicCatalogSection[];
  catalog_logo_url: string | null;
  phone_number?: string | null;
  public_view?: PublicView;
  catalog_theme?: {
    preset: string;
    custom?: { primary: string; secondary: string };
  };
  business_info?: CatalogBusinessInfo;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(price);
}

function productImageUrls(p: PublicCatalogProductItem): string[] {
  if (p.images && p.images.length > 0) return p.images.filter(Boolean);
  if (p.image_url) return [p.image_url];
  return [];
}

function cleanPhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function buildWhatsAppText(
  businessName: string,
  items: Array<{ name: string; quantity: number; price: number }>,
  total: number,
  notes: string
): string {
  const lines = items
    .map(
      (i) =>
        `• ${i.name} x${i.quantity} — ${formatPrice(i.price * i.quantity)}`
    )
    .join("\n");
  const notesLine = notes.trim()
    ? `\n\n📝 *Notas:* ${notes.trim()}`
    : "";
  return `🛒 *Pedido en ${businessName}*\n\n${lines}${notesLine}\n\n*Total: ${formatPrice(total)}*\n¿Están disponibles estos productos?`;
}

// ─── CSS Variables para tema custom ──────────────────────────────────────────

function ThemeVarsInjector({ tokens }: { tokens: ResolvedThemeTokens }) {
  if (!tokens.isCustom || !tokens.cssVars) return null;
  const styleStr = Object.entries(tokens.cssVars)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  return <style>{`:root{${styleStr}}`}</style>;
}

// ─── Filtros ──────────────────────────────────────────────────────────────────

interface FilterState {
  category: string | null;
  search: string;
  minPrice: number;
  maxPrice: number;
}

function CatalogFilterBar({
  sections,
  filters,
  maxProductPrice,
  totalResults,
  onFilter,
  tokens,
  view,
}: {
  sections: PublicCatalogSection[];
  filters: FilterState;
  maxProductPrice: number;
  totalResults: number;
  onFilter: (f: Partial<FilterState>) => void;
  tokens: ResolvedThemeTokens;
  view: PublicView;
}) {
  const categories = useMemo(
    () => sections.map((s) => ({ id: s.id, name: s.name })),
    [sections]
  );

  return (
    <div className="space-y-3">
      {/* Búsqueda */}
      <div
        className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${tokens.filterBg}`}
      >
        <Search className={`h-4 w-4 shrink-0 opacity-50 ${tokens.subtitle}`} />
        <input
          type="text"
          placeholder={
            view === "menu" ? "Buscar platillos…" : "Buscar productos…"
          }
          value={filters.search}
          onChange={(e) => onFilter({ search: e.target.value })}
          className={`flex-1 bg-transparent text-sm outline-none placeholder:opacity-50 ${tokens.title}`}
        />
        {filters.search && (
          <button
            onClick={() => onFilter({ search: "" })}
            className={`opacity-60 hover:opacity-100 transition-opacity ${tokens.subtitle}`}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Chips de categoría */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => onFilter({ category: null })}
          className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
            filters.category === null
              ? `${tokens.buttonBg} ${tokens.buttonText} shadow-sm`
              : `${tokens.filterBg} ${tokens.subtitle} hover:opacity-80`
          }`}
        >
          Todos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id ?? cat.name}
            onClick={() => onFilter({ category: cat.id ?? cat.name })}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
              filters.category === (cat.id ?? cat.name)
                ? `${tokens.buttonBg} ${tokens.buttonText} shadow-sm`
                : `${tokens.filterBg} ${tokens.subtitle} hover:opacity-80`
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Slider de precio */}
      {maxProductPrice > 0 && (
        <div
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-xs ${tokens.filterBg} ${tokens.subtitle}`}
        >
          <span className="shrink-0 font-medium">Precio:</span>
          <input
            type="range"
            min={0}
            max={maxProductPrice}
            step={10}
            value={filters.maxPrice}
            onChange={(e) => onFilter({ maxPrice: Number(e.target.value) })}
            className="flex-1 accent-current cursor-pointer"
          />
          <span className="shrink-0 tabular-nums">
            hasta {formatPrice(filters.maxPrice)}
          </span>
        </div>
      )}

      {/* Total de resultados */}
      <p className={`text-xs tabular-nums ${tokens.subtitle}`}>
        {totalResults}{" "}
        {view === "menu"
          ? totalResults === 1
            ? "platillo"
            : "platillos"
          : totalResults === 1
            ? "producto"
            : "productos"}
        {" encontrados"}
      </p>
    </div>
  );
}

// ─── Tarjeta de producto ──────────────────────────────────────────────────────

function ProductCard({
  product,
  view,
  tokens,
  onAdd,
  qtyInCart,
  onQtyChange,
}: {
  product: PublicCatalogProductItem;
  view: PublicView;
  tokens: ResolvedThemeTokens;
  onAdd: () => void;
  qtyInCart: number;
  onQtyChange: (qty: number) => void;
}) {
  const urls = productImageUrls(product);
  const [imgIdx, setImgIdx] = useState(0);

  const isMenu = view === "menu";

  if (isMenu) {
    return (
      <div
        className={`group relative flex gap-4 rounded-2xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${tokens.border} ${tokens.cardBackground}`}
      >
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <p className={`font-semibold text-base leading-snug ${tokens.title}`}>
            {product.name}
          </p>
          {product.description && (
            <p className={`text-sm line-clamp-2 ${tokens.subtitle}`}>
              {product.description}
            </p>
          )}
          <div className="mt-auto pt-3 flex items-center justify-between gap-3">
            <span className={`text-lg font-bold ${tokens.accent}`}>
              {formatPrice(product.price)}
            </span>
            {qtyInCart === 0 ? (
              <button
                onClick={onAdd}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm transition-transform active:scale-95 hover:opacity-90 ${tokens.buttonBg} ${tokens.buttonText}`}
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </button>
            ) : (
              <div
                className={`flex items-center gap-2 rounded-full px-2 py-1 ${tokens.filterBg}`}
              >
                <button
                  onClick={() => onQtyChange(qtyInCart - 1)}
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${tokens.buttonBg} ${tokens.buttonText} transition-transform active:scale-90`}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span
                  className={`min-w-[20px] text-center text-sm font-bold tabular-nums ${tokens.title}`}
                >
                  {qtyInCart}
                </span>
                <button
                  onClick={onAdd}
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${tokens.buttonBg} ${tokens.buttonText} transition-transform active:scale-90`}
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
        {/* Imagen a la derecha */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
          {urls[0] ? (
            <Image
              src={urls[0]}
              alt={product.name}
              fill
              className="object-cover"
              sizes="96px"
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center ${tokens.filterBg}`}
            >
              <UtensilsCrossed className={`h-8 w-8 opacity-30 ${tokens.subtitle}`} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Layout catálogo — grid vertical
  return (
    <div
      className={`group flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${tokens.border} ${tokens.cardBackground}`}
    >
      {/* Imagen(es) */}
      <div className="relative aspect-square w-full overflow-hidden">
        {urls.length > 0 ? (
          <>
            <Image
              src={urls[imgIdx] ?? urls[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {urls.length > 1 && (
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 px-2">
                {urls.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Imagen ${i + 1} de ${urls.length}`}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      i === imgIdx ? "bg-white shadow" : "bg-white/45 hover:bg-white/70"
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setImgIdx(i);
                    }}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center ${tokens.filterBg}`}
          >
            <Package className={`h-12 w-12 opacity-25 ${tokens.subtitle}`} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p
          className={`font-semibold text-sm leading-snug line-clamp-2 ${tokens.title}`}
        >
          {product.name}
        </p>
        {product.description && (
          <p className={`text-xs line-clamp-2 ${tokens.subtitle}`}>
            {product.description}
          </p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <span className={`text-base font-bold ${tokens.accent}`}>
            {formatPrice(product.price)}
          </span>
          {product.unit && product.unit !== "pieza" && (
            <span className={`text-[10px] ${tokens.subtitle}`}>
              /{product.unit}
            </span>
          )}
        </div>

        {/* Botón agregar / contador */}
        {qtyInCart === 0 ? (
          <button
            onClick={onAdd}
            className={`mt-1 w-full rounded-xl py-2 text-xs font-semibold shadow-sm transition-all active:scale-95 hover:opacity-90 ${tokens.buttonBg} ${tokens.buttonText}`}
          >
            + Agregar
          </button>
        ) : (
          <div
            className={`mt-1 flex items-center justify-between rounded-xl px-2 py-1 ${tokens.filterBg}`}
          >
            <button
              onClick={() => onQtyChange(qtyInCart - 1)}
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${tokens.buttonBg} ${tokens.buttonText} transition-transform active:scale-90`}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className={`text-sm font-bold tabular-nums ${tokens.title}`}>
              {qtyInCart}
            </span>
            <button
              onClick={onAdd}
              className={`flex h-7 w-7 items-center justify-center rounded-lg ${tokens.buttonBg} ${tokens.buttonText} transition-transform active:scale-90`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Drawer del carrito ───────────────────────────────────────────────────────

function CartDrawer({
  open,
  onClose,
  businessName,
  phone,
  tokens,
  items,
  onQtyChange,
  onRemove,
  onClear,
  totalItems,
  totalPrice,
}: {
  open: boolean;
  onClose: () => void;
  businessName: string;
  phone: string | null | undefined;
  tokens: ResolvedThemeTokens;
  items: ReturnType<typeof useCatalogCart>["items"];
  onQtyChange: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  totalItems: number;
  totalPrice: number;
}) {
  const [copied, setCopied] = useState(false);
  const [notes, setNotes] = useState("");

  const orderText = useMemo(
    () => buildWhatsAppText(businessName, items, totalPrice, notes),
    [businessName, items, totalPrice, notes]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(orderText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback silencioso
    }
  };

  const whatsappUrl = phone
    ? `https://wa.me/${cleanPhone(phone)}?text=${encodeURIComponent(orderText)}`
    : null;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className={`flex w-full flex-col p-0 sm:max-w-md ${tokens.cartBg}`}
      >
        <SheetHeader
          className={`border-b px-5 py-4 ${tokens.sectionBorder}`}
        >
          <div className="flex items-center justify-between">
            <SheetTitle
              className={`flex items-center gap-2 text-base font-bold ${tokens.title}`}
            >
              <ShoppingCart className="h-5 w-5" />
              Mi pedido
              {totalItems > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tokens.badge}`}
                >
                  {totalItems}
                </span>
              )}
            </SheetTitle>
            {items.length > 0 && (
              <button
                onClick={onClear}
                className={`text-xs underline underline-offset-2 opacity-60 hover:opacity-100 transition-opacity ${tokens.subtitle}`}
              >
                Vaciar
              </button>
            )}
          </div>
        </SheetHeader>

        {/* Lista de items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className={`rounded-full p-4 ${tokens.filterBg}`}>
                <ShoppingCart
                  className={`h-8 w-8 opacity-30 ${tokens.subtitle}`}
                />
              </div>
              <p className={`text-sm ${tokens.subtitle}`}>
                Tu carrito está vacío
              </p>
              <p className={`text-xs opacity-60 ${tokens.subtitle}`}>
                Agrega productos para continuar
              </p>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 ${tokens.border} ${tokens.cardBackground}`}
                >
                  {/* Thumbnail */}
                  {item.image_url && (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-semibold truncate ${tokens.title}`}
                    >
                      {item.name}
                    </p>
                    <p className={`text-xs ${tokens.subtitle}`}>
                      {formatPrice(item.price)} c/u
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 rounded-lg px-1.5 py-1 ${tokens.filterBg}`}
                  >
                    <button
                      onClick={() => onQtyChange(item.id, item.quantity - 1)}
                      className={`flex h-6 w-6 items-center justify-center rounded-md transition-transform active:scale-90 ${tokens.buttonBg} ${tokens.buttonText}`}
                    >
                      <Minus className="h-2.5 w-2.5" />
                    </button>
                    <span
                      className={`min-w-[20px] text-center text-sm font-bold tabular-nums ${tokens.title}`}
                    >
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onQtyChange(item.id, item.quantity + 1)}
                      className={`flex h-6 w-6 items-center justify-center rounded-md transition-transform active:scale-90 ${tokens.buttonBg} ${tokens.buttonText}`}
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </button>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-bold ${tokens.accent}`}>
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemove(item.id)}
                    className={`opacity-40 hover:opacity-80 transition-opacity ${tokens.subtitle}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {/* Notas especiales */}
              <div className="pt-2">
                <label
                  className={`block text-xs font-medium mb-1.5 ${tokens.subtitle}`}
                >
                  Notas / instrucciones especiales
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: sin cebolla, extra salsa, alergia a mariscos…"
                  rows={3}
                  className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none placeholder:opacity-40 ${tokens.border} ${tokens.filterBg} ${tokens.title}`}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer carrito */}
        {items.length > 0 && (
          <div
            className={`border-t px-5 py-5 space-y-3 ${tokens.sectionBorder}`}
          >
            <div
              className={`flex items-center justify-between font-semibold ${tokens.title}`}
            >
              <span className="text-sm">Total</span>
              <span className={`text-xl ${tokens.accent}`}>
                {formatPrice(totalPrice)}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleCopy}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all active:scale-95 ${tokens.border} ${tokens.filterBg} ${tokens.title}`}
              >
                {copied ? (
                  <>
                    <CheckCheck className="h-4 w-4" />
                    ¡Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copiar pedido
                  </>
                )}
              </button>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all active:scale-95 hover:opacity-90"
                  style={{ backgroundColor: "#25D366" }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Enviar por WhatsApp
                </a>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Shell interactivo (Client Component) ─────────────────────────────────────

function CatalogInteractiveShell({
  catalog,
  view,
  tokens,
}: {
  catalog: PublicCatalogData;
  view: PublicView;
  tokens: ResolvedThemeTokens;
}) {
  const slug = catalog.slug ?? "default";
  const cart = useCatalogCart(slug);
  const [cartOpen, setCartOpen] = useState(false);

  const maxProductPrice = useMemo(() => {
    let max = 0;
    for (const s of catalog.sections) {
      for (const p of s.products) {
        if (p.price > max) max = p.price;
      }
    }
    return max;
  }, [catalog.sections]);

  const [filters, setFilters] = useState<FilterState>({
    category: null,
    search: "",
    minPrice: 0,
    maxPrice: maxProductPrice,
  });

  useEffect(() => {
    setFilters((f) => ({ ...f, maxPrice: maxProductPrice }));
  }, [maxProductPrice]);

  const updateFilter = (partial: Partial<FilterState>) => {
    setFilters((f) => ({ ...f, ...partial }));
  };

  const filteredSections = useMemo(() => {
    return catalog.sections
      .map((section) => {
        if (
          filters.category !== null &&
          (section.id ?? section.name) !== filters.category
        )
          return null;

        const products = section.products.filter((p) => {
          const matchSearch =
            !filters.search ||
            p.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            p.description?.toLowerCase().includes(filters.search.toLowerCase());
          const matchPrice = p.price <= filters.maxPrice;
          return matchSearch && matchPrice;
        });

        if (products.length === 0) return null;
        return { ...section, products };
      })
      .filter(Boolean) as PublicCatalogSection[];
  }, [catalog.sections, filters]);

  const totalResults = useMemo(
    () => filteredSections.reduce((sum, s) => sum + s.products.length, 0),
    [filteredSections]
  );

  const atLimit =
    catalog.plan_limit !== null &&
    catalog.total_products >= (catalog.plan_limit ?? 0);

  return (
    <>
      {/* Aviso de límite de plan */}
      {atLimit && (
        <div
          className={`mt-4 rounded-xl border px-4 py-3 text-sm ${tokens.border} ${tokens.cardBackground} ${tokens.subtitle}`}
        >
          Mostrando los primeros {catalog.plan_limit} productos disponibles.
        </div>
      )}

      {/* Filtros */}
      <div className="mt-6">
        <CatalogFilterBar
          sections={catalog.sections}
          filters={filters}
          maxProductPrice={maxProductPrice}
          totalResults={totalResults}
          onFilter={updateFilter}
          tokens={tokens}
          view={view}
        />
      </div>

      {/* Resultados */}
      {filteredSections.length === 0 ? (
        <div
          className={`mt-8 flex flex-col items-center gap-4 rounded-2xl border py-16 text-center ${tokens.border} ${tokens.cardBackground}`}
        >
          <div className={`rounded-full p-4 ${tokens.filterBg}`}>
            {view === "menu" ? (
              <UtensilsCrossed
                className={`h-10 w-10 opacity-30 ${tokens.subtitle}`}
              />
            ) : (
              <Package className={`h-10 w-10 opacity-30 ${tokens.subtitle}`} />
            )}
          </div>
          <p className={`text-base font-medium ${tokens.title}`}>
            No hay productos que coincidan con tu búsqueda.
          </p>
          <button
            onClick={() =>
              setFilters({
                category: null,
                search: "",
                minPrice: 0,
                maxPrice: maxProductPrice,
              })
            }
            className={`text-sm underline underline-offset-2 ${tokens.accent}`}
          >
            Limpiar filtros
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {filteredSections.map((section) => (
            <section key={section.id ?? "__none__"} className="space-y-4">
              <div
                className={`flex flex-wrap items-end justify-between gap-2 border-b pb-3 ${tokens.sectionBorder}`}
              >
                <div>
                  <h2 className={`text-xl font-semibold ${tokens.title}`}>
                    {section.name}
                  </h2>
                  <p className={`mt-0.5 text-xs ${tokens.subtitle}`}>
                    {section.products.length}{" "}
                    {view === "menu" ? "opciones" : "productos"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${tokens.badge}`}
                >
                  {section.products.length}{" "}
                  {view === "menu" ? "en esta sección" : "artículos"}
                </span>
              </div>

              <div
                className={
                  view === "menu"
                    ? "mx-auto max-w-2xl space-y-3"
                    : "grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3"
                }
              >
                {section.products.map((product) => {
                  const cartItem = cart.items.find((i) => i.id === product.id);
                  const qty = cartItem?.quantity ?? 0;
                  return (
                    <ProductCard
                      key={product.id}
                      product={product}
                      view={view}
                      tokens={tokens}
                      qtyInCart={qty}
                      onAdd={() =>
                        cart.addItem({
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          image_url: product.image_url,
                          unit: product.unit,
                        })
                      }
                      onQtyChange={(newQty) =>
                        cart.updateQty(product.id, newQty)
                      }
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* FAB del carrito */}
      {cart.isReady && cart.totalItems > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full px-5 py-3.5 shadow-xl transition-all hover:scale-105 active:scale-95 ${tokens.buttonBg} ${tokens.buttonText}`}
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
              {cart.totalItems}
            </span>
          </div>
          <span className="font-semibold text-sm">
            {formatPrice(cart.totalPrice)}
          </span>
        </button>
      )}

      {/* Drawer */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        businessName={catalog.business_name}
        phone={catalog.phone_number}
        tokens={tokens}
        items={cart.items}
        onQtyChange={cart.updateQty}
        onRemove={cart.removeItem}
        onClear={cart.clearCart}
        totalItems={cart.totalItems}
        totalPrice={cart.totalPrice}
      />
    </>
  );
}

// ─── Header premium ───────────────────────────────────────────────────────────

function CatalogHeader({
  catalog,
  view,
  tokens,
}: {
  catalog: PublicCatalogData;
  view: PublicView;
  tokens: ResolvedThemeTokens;
}) {
  const isMenu = view === "menu";
  const info = catalog.business_info;
  const bannerUrl = info?.catalog_banner_url ?? null;

  const socialLinks: Array<{
    href: string;
    label: string;
    icon: React.ReactNode;
  }> = [];

  if (info?.instagram) {
    socialLinks.push({
      href: info.instagram.startsWith("http")
        ? info.instagram
        : `https://instagram.com/${info.instagram.replace("@", "")}`,
      label: "Instagram",
      icon: <Instagram className="h-4 w-4" />,
    });
  }
  if (info?.facebook) {
    socialLinks.push({
      href: info.facebook.startsWith("http")
        ? info.facebook
        : `https://facebook.com/${info.facebook}`,
      label: "Facebook",
      icon: <Facebook className="h-4 w-4" />,
    });
  }
  if (info?.tiktok) {
    socialLinks.push({
      href: info.tiktok.startsWith("http")
        ? info.tiktok
        : `https://tiktok.com/@${info.tiktok.replace("@", "")}`,
      label: "TikTok",
      icon: (
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
        </svg>
      ),
    });
  }
  if (info?.website) {
    socialLinks.push({
      href: info.website.startsWith("http")
        ? info.website
        : `https://${info.website}`,
      label: "Sitio web",
      icon: <Globe className="h-4 w-4" />,
    });
  }

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Fondo — banner o gradiente */}
      {bannerUrl ? (
        <div className="relative h-48 w-full sm:h-64">
          <Image
            src={bannerUrl}
            alt={`Banner de ${catalog.business_name}`}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1024px"
            priority
          />
          {/* Overlay oscuro */}
          <div className="absolute inset-0 bg-black/55" />
        </div>
      ) : (
        <div className={`h-48 sm:h-64 ${tokens.headerBg}`}>
          {/* Patrón decorativo */}
          <div
            className="pointer-events-none absolute inset-0 opacity-5"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
            aria-hidden
          />
        </div>
      )}

      {/* Contenido sobre el banner */}
      <div className="absolute inset-0 flex flex-col justify-end px-6 pb-6 sm:px-10 sm:pb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-6">
          {/* Logo */}
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white/20 ring-2 ring-white/40 backdrop-blur-sm shadow-lg">
            {catalog.catalog_logo_url ? (
              <Image
                src={catalog.catalog_logo_url}
                alt={`Logo de ${catalog.business_name}`}
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            ) : isMenu ? (
              <UtensilsCrossed className="h-10 w-10 text-white/80" />
            ) : (
              <Package className="h-10 w-10 text-white/80" />
            )}
          </div>

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl drop-shadow">
                {catalog.business_name}
              </h1>
              <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/30 backdrop-blur-sm">
                {isMenu ? "Menú digital" : "Catálogo digital"}
              </span>
            </div>
            <p className="mt-1 capitalize text-sm text-white/75">
              {catalog.business_type.replace(/_/g, " ")}
            </p>

            {/* Chips de info del negocio */}
            <div className="mt-3 flex flex-wrap gap-2">
              {info?.address && (
                <span className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-xs text-white/90 backdrop-blur-sm">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate max-w-[160px]">{info.address}</span>
                </span>
              )}
              {(info?.phone ?? catalog.phone_number) && (
                <span className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-xs text-white/90 backdrop-blur-sm">
                  <Phone className="h-3 w-3 shrink-0" />
                  {info?.phone ?? catalog.phone_number}
                </span>
              )}
              {info?.payment_methods && info.payment_methods.length > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1 text-xs text-white/90 backdrop-blur-sm">
                  <CreditCard className="h-3 w-3 shrink-0" />
                  {info.payment_methods.join(", ")}
                </span>
              )}
            </div>

            {/* Redes sociales */}
            {socialLinks.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-black/30 text-white/80 backdrop-blur-sm ring-1 ring-white/20 transition-all hover:bg-white/20 hover:text-white"
                  >
                    {link.icon}
                  </a>
                ))}
                <ExternalLink className="h-3 w-3 text-white/40" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Description strip ────────────────────────────────────────────────────────

function BusinessDescription({
  info,
  tokens,
}: {
  info: CatalogBusinessInfo;
  tokens: ResolvedThemeTokens;
}) {
  if (!info.description) return null;
  return (
    <div
      className={`mt-4 rounded-xl border px-4 py-3 text-sm leading-relaxed ${tokens.border} ${tokens.cardBackground} ${tokens.subtitle}`}
    >
      {info.description}
    </div>
  );
}

// ─── Componente raíz (exportado) ──────────────────────────────────────────────

export function PublicCatalogView({ catalog }: { catalog: PublicCatalogData }) {
  const view: PublicView = catalog.public_view ?? "catalogo";

  const themeApiData: CatalogThemeApiData = {
    preset:
      (catalog.catalog_theme?.preset as CatalogThemeApiData["preset"]) ??
      "default",
    custom: catalog.catalog_theme?.custom,
  };
  const tokens = resolveThemeTokens(themeApiData, view);

  return (
    <div className={`min-h-screen ${tokens.pageBackground}`}>
      {/* Inyectar CSS variables si el tema es custom */}
      <ThemeVarsInjector tokens={tokens} />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
        {/* Header premium */}
        <CatalogHeader catalog={catalog} view={view} tokens={tokens} />

        {/* Descripción del negocio */}
        {catalog.business_info && (
          <BusinessDescription info={catalog.business_info} tokens={tokens} />
        )}

        {/* Contenido interactivo (carrito + filtros + grid) */}
        <CatalogInteractiveShell catalog={catalog} view={view} tokens={tokens} />

        {/* Footer */}
        <footer
          className={`mt-16 flex flex-col items-center gap-3 border-t pt-8 pb-4 ${tokens.sectionBorder}`}
        >
          {/* Redes sociales en footer (si existen) */}
          {catalog.business_info && (
            <div className="flex items-center gap-3">
              {catalog.business_info.instagram && (
                <a
                  href={
                    catalog.business_info.instagram.startsWith("http")
                      ? catalog.business_info.instagram
                      : `https://instagram.com/${catalog.business_info.instagram.replace("@", "")}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`opacity-50 hover:opacity-100 transition-opacity ${tokens.subtitle}`}
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
              {catalog.business_info.facebook && (
                <a
                  href={
                    catalog.business_info.facebook.startsWith("http")
                      ? catalog.business_info.facebook
                      : `https://facebook.com/${catalog.business_info.facebook}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`opacity-50 hover:opacity-100 transition-opacity ${tokens.subtitle}`}
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              )}
              {catalog.business_info.website && (
                <a
                  href={
                    catalog.business_info.website.startsWith("http")
                      ? catalog.business_info.website
                      : `https://${catalog.business_info.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`opacity-50 hover:opacity-100 transition-opacity ${tokens.subtitle}`}
                  aria-label="Sitio web"
                >
                  <Globe className="h-4 w-4" />
                </a>
              )}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className={`text-xs ${tokens.subtitle}`}>Potenciado por</span>
            <span className={`text-xs font-bold ${tokens.accent}`}>
              MercaConnect
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
