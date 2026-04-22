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
  ChevronRight,
  SlidersHorizontal,
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
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
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
    .map((i) => `• ${i.name} x${i.quantity} — ${formatPrice(i.price * i.quantity)}`)
    .join("\n");
  const notesLine = notes.trim() ? `\n\n📝 *Notas:* ${notes.trim()}` : "";
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

// ─── Tipos de estado de filtros ───────────────────────────────────────────────

interface FilterState {
  category: string | null;
  search: string;
  maxPrice: number;
}

// ─── Barra de filtros premium ─────────────────────────────────────────────────

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
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const categories = useMemo(
    () => sections.map((s) => ({ id: s.id, name: s.name })),
    [sections]
  );

  return (
    <div className="space-y-3">
      {/* Fila búsqueda + toggle precio */}
      <div className="flex gap-2">
        <div className={`flex flex-1 items-center gap-2 rounded-2xl px-4 py-2.5 ${tokens.filterBg}`}>
          <Search className={`h-4 w-4 shrink-0 ${tokens.subtitle} opacity-60`} />
          <input
            type="text"
            placeholder={view === "menu" ? "Buscar en el menú…" : "Buscar productos…"}
            value={filters.search}
            onChange={(e) => onFilter({ search: e.target.value })}
            className={`flex-1 bg-transparent text-sm outline-none placeholder:opacity-50 ${tokens.title}`}
          />
          {filters.search && (
            <button
              onClick={() => onFilter({ search: "" })}
              className={`opacity-60 hover:opacity-100 transition-opacity ${tokens.subtitle}`}
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {maxProductPrice > 0 && (
          <button
            onClick={() => setShowPriceFilter((v) => !v)}
            className={`flex items-center gap-1.5 rounded-2xl px-3 py-2.5 text-xs font-semibold transition-all ${
              showPriceFilter
                ? `${tokens.buttonBg} ${tokens.buttonText}`
                : `${tokens.filterBg} ${tokens.subtitle}`
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Slider de precio colapsable */}
      {showPriceFilter && maxProductPrice > 0 && (
        <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-xs ${tokens.filterBg} ${tokens.subtitle}`}>
          <span className="shrink-0 font-medium">Hasta</span>
          <input
            type="range"
            min={0}
            max={maxProductPrice}
            step={10}
            value={filters.maxPrice}
            onChange={(e) => onFilter({ maxPrice: Number(e.target.value) })}
            className="flex-1 cursor-pointer accent-current"
          />
          <span className={`shrink-0 tabular-nums font-semibold ${tokens.accent}`}>
            {formatPrice(filters.maxPrice)}
          </span>
        </div>
      )}

      {/* Chips de categoría con scroll horizontal */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
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

      {/* Contador de resultados */}
      <p className={`text-xs tabular-nums ${tokens.subtitle}`}>
        <span className={`font-semibold ${tokens.accent}`}>{totalResults}</span>{" "}
        {view === "menu"
          ? totalResults === 1 ? "platillo encontrado" : "platillos encontrados"
          : totalResults === 1 ? "producto encontrado" : "productos encontrados"}
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

  // Vista MENÚ — card horizontal
  if (view === "menu") {
    return (
      <div
        className={`group relative flex gap-4 rounded-2xl border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-px ${tokens.border} ${tokens.cardBackground}`}
      >
        <div className="flex flex-1 flex-col gap-1.5 min-w-0">
          <p className={`font-bold text-base leading-snug ${tokens.title}`}>
            {product.name}
          </p>
          {product.description && (
            <p className={`text-sm line-clamp-2 leading-relaxed ${tokens.subtitle}`}>
              {product.description}
            </p>
          )}
          <div className="mt-auto pt-3 flex items-center justify-between gap-3 flex-wrap">
            <span className={`text-xl font-extrabold tabular-nums ${tokens.accent}`}>
              {formatPrice(product.price)}
            </span>
            {qtyInCart === 0 ? (
              <button
                onClick={onAdd}
                className={`flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold shadow-sm transition-all active:scale-95 hover:opacity-90 ${tokens.buttonBg} ${tokens.buttonText}`}
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar
              </button>
            ) : (
              <div className={`flex items-center gap-2 rounded-full px-2 py-1 ${tokens.filterBg}`}>
                <button
                  onClick={() => onQtyChange(qtyInCart - 1)}
                  className={`flex h-6 w-6 items-center justify-center rounded-full ${tokens.buttonBg} ${tokens.buttonText} transition-transform active:scale-90`}
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className={`min-w-[20px] text-center text-sm font-bold tabular-nums ${tokens.title}`}>
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

        {/* Imagen derecha */}
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl">
          {urls[0] ? (
            <Image
              src={urls[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="96px"
            />
          ) : (
            <div className={`flex h-full w-full items-center justify-center ${tokens.filterBg}`}>
              <UtensilsCrossed className={`h-8 w-8 opacity-25 ${tokens.subtitle}`} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vista CATÁLOGO — card vertical con imagen cuadrada
  return (
    <div
      className={`group flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${tokens.border} ${tokens.cardBackground}`}
    >
      {/* Imagen */}
      <div className="relative aspect-square w-full overflow-hidden bg-black/5">
        {urls.length > 0 ? (
          <>
            <Image
              src={urls[imgIdx] ?? urls[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {/* Dots para galería multi-imagen */}
            {urls.length > 1 && (
              <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1.5 px-2">
                {urls.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Imagen ${i + 1}`}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImgIdx(i); }}
                    className={`h-1.5 rounded-full transition-all ${
                      i === imgIdx ? "w-4 bg-white shadow" : "w-1.5 bg-white/45 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className={`flex h-full w-full items-center justify-center ${tokens.filterBg}`}>
            <Package className={`h-10 w-10 opacity-20 ${tokens.subtitle}`} />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <p className={`font-bold text-sm leading-snug line-clamp-2 ${tokens.title}`}>
          {product.name}
        </p>
        {product.description && (
          <p className={`text-xs line-clamp-2 leading-relaxed ${tokens.subtitle}`}>
            {product.description}
          </p>
        )}
        <div className="mt-auto pt-2 flex items-center justify-between gap-1">
          <div>
            <span className={`text-base font-extrabold tabular-nums ${tokens.accent}`}>
              {formatPrice(product.price)}
            </span>
            {product.unit && product.unit !== "pieza" && (
              <span className={`ml-1 text-[10px] ${tokens.subtitle}`}>/{product.unit}</span>
            )}
          </div>
        </div>

        {/* Botón agregar / contador */}
        {qtyInCart === 0 ? (
          <button
            onClick={onAdd}
            className={`mt-1 w-full rounded-xl py-2 text-xs font-bold shadow-sm transition-all active:scale-95 hover:opacity-90 ${tokens.buttonBg} ${tokens.buttonText}`}
          >
            + Agregar
          </button>
        ) : (
          <div className={`mt-1 flex items-center justify-between rounded-xl px-2 py-1 ${tokens.filterBg}`}>
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

// ─── Drawer del carrito premium ───────────────────────────────────────────────

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
      // fallback silencioso — clipboard puede no estar disponible en HTTP
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
        {/* Header */}
        <SheetHeader className={`border-b px-5 py-4 ${tokens.sectionBorder}`}>
          <div className="flex items-center justify-between">
            <SheetTitle className={`flex items-center gap-2 text-base font-bold ${tokens.title}`}>
              <ShoppingCart className="h-5 w-5" />
              Mi pedido
              {totalItems > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tokens.badge}`}>
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

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className={`rounded-full p-5 ${tokens.filterBg}`}>
                <ShoppingCart className={`h-8 w-8 opacity-25 ${tokens.subtitle}`} />
              </div>
              <p className={`text-sm font-semibold ${tokens.subtitle}`}>Tu carrito está vacío</p>
              <p className={`text-xs opacity-60 ${tokens.subtitle}`}>
                Agrega productos para continuar
              </p>
            </div>
          ) : (
            <>
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 rounded-2xl border p-3 ${tokens.border} ${tokens.cardBackground}`}
                >
                  {item.image_url && (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
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
                    <p className={`text-sm font-bold truncate ${tokens.title}`}>{item.name}</p>
                    <p className={`text-xs ${tokens.subtitle}`}>{formatPrice(item.price)} c/u</p>
                  </div>
                  <div className={`flex items-center gap-1.5 rounded-xl px-1.5 py-1 ${tokens.filterBg}`}>
                    <button
                      onClick={() => onQtyChange(item.id, item.quantity - 1)}
                      className={`flex h-6 w-6 items-center justify-center rounded-lg transition-transform active:scale-90 ${tokens.buttonBg} ${tokens.buttonText}`}
                    >
                      <Minus className="h-2.5 w-2.5" />
                    </button>
                    <span className={`min-w-[20px] text-center text-sm font-bold tabular-nums ${tokens.title}`}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onQtyChange(item.id, item.quantity + 1)}
                      className={`flex h-6 w-6 items-center justify-center rounded-lg transition-transform active:scale-90 ${tokens.buttonBg} ${tokens.buttonText}`}
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
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {/* Notas */}
              <div className="pt-2">
                <label className={`block text-xs font-semibold mb-1.5 ${tokens.subtitle}`}>
                  Notas / instrucciones especiales
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: sin cebolla, extra salsa…"
                  rows={3}
                  className={`w-full resize-none rounded-xl border px-3 py-2.5 text-sm outline-none placeholder:opacity-40 ${tokens.border} ${tokens.filterBg} ${tokens.title}`}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className={`border-t px-5 py-5 space-y-3 ${tokens.sectionBorder}`}>
            <div className={`flex items-center justify-between font-bold ${tokens.title}`}>
              <span className="text-sm">Total</span>
              <span className={`text-2xl tabular-nums ${tokens.accent}`}>
                {formatPrice(totalPrice)}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleCopy}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border py-3 text-sm font-semibold transition-all active:scale-95 ${tokens.border} ${tokens.filterBg} ${tokens.title}`}
              >
                {copied ? (
                  <><CheckCheck className="h-4 w-4" />¡Copiado!</>
                ) : (
                  <><Copy className="h-4 w-4" />Copiar pedido</>
                )}
              </button>
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition-all active:scale-95 hover:opacity-90"
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

// ─── Shell interactivo ────────────────────────────────────────────────────────

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
      .filter((s): s is PublicCatalogSection => s !== null);
  }, [catalog.sections, filters]);

  const totalResults = useMemo(
    () => filteredSections.reduce((sum, s) => sum + s.products.length, 0),
    [filteredSections]
  );

  const atLimit =
    catalog.plan_limit !== null &&
    catalog.total_products >= (catalog.plan_limit ?? 0);

  const hasActiveFilters = filters.search || filters.category !== null;

  return (
    <>
      {atLimit && (
        <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${tokens.border} ${tokens.cardBackground} ${tokens.subtitle}`}>
          Mostrando los primeros {catalog.plan_limit} productos disponibles.
        </div>
      )}

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

      {filteredSections.length === 0 ? (
        <div className={`mt-8 flex flex-col items-center gap-4 rounded-2xl border py-16 text-center ${tokens.border} ${tokens.cardBackground}`}>
          <div className={`rounded-full p-5 ${tokens.filterBg}`}>
            {view === "menu" ? (
              <UtensilsCrossed className={`h-10 w-10 opacity-25 ${tokens.subtitle}`} />
            ) : (
              <Package className={`h-10 w-10 opacity-25 ${tokens.subtitle}`} />
            )}
          </div>
          <div>
            <p className={`text-base font-bold ${tokens.title}`}>
              {hasActiveFilters ? "Sin resultados" : "Sin productos disponibles"}
            </p>
            <p className={`text-sm mt-1 ${tokens.subtitle}`}>
              {hasActiveFilters
                ? "Ningún producto coincide con tu búsqueda."
                : "Este catálogo no tiene productos publicados aún."}
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => setFilters({ category: null, search: "", maxPrice: maxProductPrice })}
              className={`text-sm font-semibold underline underline-offset-2 ${tokens.accent}`}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="mt-8 space-y-12">
          {filteredSections.map((section) => (
            <section key={section.id ?? "__none__"} aria-label={section.name}>
              {/* Cabecera de sección */}
              <div className={`flex flex-wrap items-end justify-between gap-2 border-b pb-3 mb-5 ${tokens.sectionBorder}`}>
                <div>
                  <h2 className={`text-xl font-extrabold tracking-tight ${tokens.title}`}>
                    {section.name}
                  </h2>
                  <p className={`mt-0.5 text-xs ${tokens.subtitle}`}>
                    {section.products.length}{" "}
                    {view === "menu" ? "opciones" : "artículos"}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tokens.badge}`}>
                  {section.products.length}{" "}
                  {view === "menu" ? "platillos" : "productos"}
                </span>
              </div>

              {/* Grid / Lista */}
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
                      onQtyChange={(newQty) => cart.updateQty(product.id, newQty)}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* FAB carrito */}
      {cart.isReady && cart.totalItems > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full px-5 py-3.5 shadow-2xl transition-all hover:scale-105 active:scale-95 ${tokens.buttonBg} ${tokens.buttonText}`}
          aria-label={`Ver carrito — ${cart.totalItems} artículos`}
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[10px] font-bold">
              {cart.totalItems}
            </span>
          </div>
          <span className="font-bold text-sm tabular-nums">
            {formatPrice(cart.totalPrice)}
          </span>
          <ChevronRight className="h-4 w-4 opacity-70" />
        </button>
      )}

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

  type SocialLink = { href: string; label: string; icon: React.ReactNode };

  const socialLinks: SocialLink[] = [];

  if (info?.instagram) {
    const handle = info.instagram.replace("@", "");
    socialLinks.push({
      href: info.instagram.startsWith("http") ? info.instagram : `https://instagram.com/${handle}`,
      label: "Instagram",
      icon: <Instagram className="h-4 w-4" />,
    });
  }
  if (info?.facebook) {
    socialLinks.push({
      href: info.facebook.startsWith("http") ? info.facebook : `https://facebook.com/${info.facebook}`,
      label: "Facebook",
      icon: <Facebook className="h-4 w-4" />,
    });
  }
  if (info?.tiktok) {
    const handle = info.tiktok.replace("@", "");
    socialLinks.push({
      href: info.tiktok.startsWith("http") ? info.tiktok : `https://tiktok.com/@${handle}`,
      label: "TikTok",
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.76a4.85 4.85 0 01-1.01-.07z" />
        </svg>
      ),
    });
  }
  if (info?.website) {
    socialLinks.push({
      href: info.website.startsWith("http") ? info.website : `https://${info.website}`,
      label: "Sitio web",
      icon: <Globe className="h-4 w-4" />,
    });
  }

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-xl">
      {/* Fondo: banner o gradiente */}
      {bannerUrl ? (
        <div className="relative h-52 w-full sm:h-72">
          <Image
            src={bannerUrl}
            alt={`Banner de ${catalog.business_name}`}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1024px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        </div>
      ) : (
        <div className={`h-52 sm:h-72 ${tokens.headerBg} relative overflow-hidden`}>
          {/* Patrón decorativo */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "radial-gradient(circle, white 1.5px, transparent 1.5px)",
              backgroundSize: "28px 28px",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-8 -right-8 h-64 w-64 rounded-full opacity-10"
            style={{ background: "radial-gradient(circle, white, transparent 70%)" }}
            aria-hidden
          />
        </div>
      )}

      {/* Contenido sobre el banner */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-5 sm:px-8 sm:pb-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-5">
          {/* Logo */}
          <div className="relative h-20 w-20 shrink-0 sm:h-24 sm:w-24">
            <div className="h-full w-full overflow-hidden rounded-2xl border-2 border-white/30 bg-white/15 backdrop-blur-md shadow-xl">
              {catalog.catalog_logo_url ? (
                <Image
                  src={catalog.catalog_logo_url}
                  alt={`Logo de ${catalog.business_name}`}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  {isMenu ? (
                    <UtensilsCrossed className="h-9 w-9 text-white/80" />
                  ) : (
                    <Package className="h-9 w-9 text-white/80" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Textos */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-3xl">
                {catalog.business_name}
              </h1>
              <span className="rounded-full bg-white/15 backdrop-blur-sm px-3 py-0.5 text-xs font-semibold text-white ring-1 ring-white/25">
                {isMenu ? "Menú digital" : "Catálogo digital"}
              </span>
            </div>
            <p className="capitalize text-sm text-white/70">
              {catalog.business_type.replace(/_/g, " ")}
            </p>

            {/* Chips de info */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {info?.address && (
                <span className="flex items-center gap-1.5 rounded-full bg-black/30 backdrop-blur-sm px-3 py-1 text-xs text-white/90">
                  <MapPin className="h-3 w-3 shrink-0" />
                  <span className="truncate max-w-[150px]">{info.address}</span>
                </span>
              )}
              {(info?.phone ?? catalog.phone_number) && (
                <span className="flex items-center gap-1.5 rounded-full bg-black/30 backdrop-blur-sm px-3 py-1 text-xs text-white/90">
                  <Phone className="h-3 w-3 shrink-0" />
                  {info?.phone ?? catalog.phone_number}
                </span>
              )}
              {info?.payment_methods && info.payment_methods.length > 0 && (
                <span className="flex items-center gap-1.5 rounded-full bg-black/30 backdrop-blur-sm px-3 py-1 text-xs text-white/90">
                  <CreditCard className="h-3 w-3 shrink-0" />
                  {info.payment_methods.join(", ")}
                </span>
              )}
            </div>

            {/* Redes sociales */}
            {socialLinks.length > 0 && (
              <div className="mt-2.5 flex items-center gap-1.5">
                {socialLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white/80 ring-1 ring-white/20 transition-all hover:bg-white/20 hover:text-white"
                  >
                    {link.icon}
                  </a>
                ))}
                <ExternalLink className="h-3 w-3 text-white/35 ml-0.5" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Descripción del negocio ──────────────────────────────────────────────────

function BusinessDescription({
  info,
  tokens,
}: {
  info: CatalogBusinessInfo | undefined;
  tokens: ResolvedThemeTokens;
}) {
  if (!info?.description) return null;

  return (
    <div className={`rounded-2xl border px-5 py-4 ${tokens.border} ${tokens.cardBackground}`}>
      <p className={`text-sm leading-relaxed ${tokens.subtitle}`}>{info.description}</p>
    </div>
  );
}

// ─── Componente principal público ─────────────────────────────────────────────

export function PublicCatalogView({ catalog }: { catalog: PublicCatalogData }) {
  const view: PublicView = catalog.public_view ?? "catalogo";
  const tokens = resolveThemeTokens(
    catalog.catalog_theme as CatalogThemeApiData | undefined,
    view
  );

  return (
    <div className={`min-h-screen ${tokens.pageBackground}`}>
      <ThemeVarsInjector tokens={tokens} />

      <div className="mx-auto max-w-5xl px-4 py-6 sm:py-10 space-y-4">
        {/* Header con banner */}
        <CatalogHeader catalog={catalog} view={view} tokens={tokens} />

        {/* Descripción */}
        <BusinessDescription info={catalog.business_info} tokens={tokens} />

        {/* Filtros + grid interactivo */}
        <CatalogInteractiveShell catalog={catalog} view={view} tokens={tokens} />

        {/* Footer */}
        <footer className="pt-8 pb-4 text-center">
          <p className={`text-xs ${tokens.subtitle} opacity-40`}>
            Powered by MercaConnect · Catálogos digitales para negocios
          </p>
        </footer>
      </div>
    </div>
  );
}
