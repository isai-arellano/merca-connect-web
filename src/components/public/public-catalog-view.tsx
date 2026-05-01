"use client";

import Image from "next/image";
import { useLayoutEffect, useMemo, useState } from "react";
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
  House,
  Clock3,
  SlidersHorizontal,
} from "lucide-react";
import {
  buildGlobalUiThemeCssFromPubVars,
  resolveThemeTokens,
  type CatalogThemeApiData,
  type PublicView,
  type ResolvedThemeTokens,
} from "@/config/catalog-themes";
import { useCatalogCart } from "@/hooks/useCatalogCart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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

/** Día en horario (API puede enviar `from` o `from_`) */
export interface PublicDaySchedule {
  open?: boolean;
  from?: string;
  from_?: string;
  to?: string;
}

export interface PublicWeekSchedule {
  monday?: PublicDaySchedule;
  tuesday?: PublicDaySchedule;
  wednesday?: PublicDaySchedule;
  thursday?: PublicDaySchedule;
  friday?: PublicDaySchedule;
  saturday?: PublicDaySchedule;
  sunday?: PublicDaySchedule;
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
  /** Horario desde `config.schedule` (ajustes del negocio) */
  schedule?: PublicWeekSchedule | null;
}

export interface PublicCatalogData {
  business_name: string;
  business_type: string;
  slug: string | null;
  total_products: number;
  plan_limit: number | null;
  sections: PublicCatalogSection[];
  catalog_logo_url: string | null;
  whatsapp_display_number?: string | null;
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

function cleanLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const WEEK_DAY_KEYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;

const WEEK_DAY_LABEL: Record<(typeof WEEK_DAY_KEYS)[number], string> = {
  monday: "Lun",
  tuesday: "Mar",
  wednesday: "Mié",
  thursday: "Jue",
  friday: "Vie",
  saturday: "Sáb",
  sunday: "Dom",
};

function dayTimeFrom(d: PublicDaySchedule | undefined): string {
  if (!d?.open) return "";
  const a = (d.from ?? d.from_ ?? "").trim();
  const b = (d.to ?? "").trim();
  if (a && b) return `${a} – ${b}`;
  return a || b || "—";
}

function formatScheduleForToast(
  sched: PublicWeekSchedule | null | undefined
): { title: string; body: string } {
  if (!sched) {
    return {
      title: "Horario de atención",
      body: "No hay horario publicado. Contacta al negocio para confirmar.",
    };
  }
  const lines: string[] = [];
  for (const key of WEEK_DAY_KEYS) {
    const day = sched[key];
    if (day?.open) {
      const t = dayTimeFrom(day);
      lines.push(`${WEEK_DAY_LABEL[key]}: ${t}`);
    }
  }
  if (lines.length === 0) {
    return {
      title: "Horario de atención",
      body: "Sin horas configuradas. Contacta al negocio para confirmar.",
    };
  }
  return { title: "Horario de atención", body: lines.join(" · ") };
}

function buildWhatsAppText(
  businessName: string,
  items: Array<{ name: string; quantity: number; price: number }>,
  total: number,
  opts: {
    fulfillmentType: "delivery" | "pickup";
    deliveryAddress: string;
    paymentMethod: string;
    notes: string;
  }
): string {
  const lines = items
    .map((i) => `• ${i.name} x${i.quantity} — ${formatPrice(i.price * i.quantity)}`)
    .join("\n");

  const fulfillmentLabel = opts.fulfillmentType === "delivery" ? "Domicilio" : "Recoger en tienda";
  const addressLine = opts.fulfillmentType === "delivery" && opts.deliveryAddress.trim()
    ? `\n🏠 *Dirección:* ${opts.deliveryAddress.trim()}`
    : "";
  const paymentLabel =
    opts.paymentMethod === "efectivo" ? "Efectivo" :
    opts.paymentMethod === "transferencia" ? "Transferencia SPEI" :
    opts.paymentMethod === "tarjeta" ? "Tarjeta" : opts.paymentMethod;
  const notesLine = opts.notes.trim() ? `\n📝 *Notas:* ${opts.notes.trim()}` : "";

  return (
    `🛒 *Pedido en ${businessName}*\n\n` +
    `Quiero pedir estos artículos:\n\n${lines}\n\n` +
    `📦 *Entrega:* ${fulfillmentLabel}${addressLine}\n` +
    `💳 *Pago:* ${paymentLabel}` +
    `${notesLine}\n\n` +
    `*Total: ${formatPrice(total)}*`
  );
}

// ─── CSS Variables (presets + custom) + tokens de UI globales en :root (Sheet portal) ─

const MERCA_PUB_CATALOG_ROOT_CLASS = "merca-pub-catalog-active";
const MERCA_PUB_CATALOG_STYLE_ID = "merca-pub-catalog-theme";

function ThemeVarsInjector({ tokens }: { tokens: ResolvedThemeTokens }) {
  const serializedCssVars = JSON.stringify(tokens.cssVars ?? {});

  useLayoutEffect(() => {
    const pubThemeByKey = JSON.parse(serializedCssVars) as Record<string, string>;
    if (Object.keys(pubThemeByKey).length === 0) return;

    const scopedPubCatalogCss = Object.entries(pubThemeByKey)
      .map(([cssVariableName, cssValue]) => `${cssVariableName}:${cssValue}`)
      .join(";");
    const globalUiThemeCss = buildGlobalUiThemeCssFromPubVars(pubThemeByKey);
    const style = document.createElement("style");
    style.id = MERCA_PUB_CATALOG_STYLE_ID;
    style.textContent = `:root.${MERCA_PUB_CATALOG_ROOT_CLASS}{${globalUiThemeCss}}[data-pub-catalog]{${scopedPubCatalogCss}}`;
    document.head.appendChild(style);
    document.documentElement.classList.add(MERCA_PUB_CATALOG_ROOT_CLASS);
    return () => {
      document.documentElement.classList.remove(MERCA_PUB_CATALOG_ROOT_CLASS);
      style.remove();
    };
  }, [serializedCssVars]);

  return null;
}

// ─── Tipos de estado de filtros ───────────────────────────────────────────────

type CatalogSort = "default" | "price_asc" | "price_desc" | "name_asc";

interface FilterState {
  category: string | null;
  search: string;
  /** `null` = usar el máximo actual del catálogo (evita efecto de sincronización). */
  maxPrice: number | null;
  sort: CatalogSort;
}

function sortProductsList<T extends { name: string; price: number }>(
  products: T[],
  sort: CatalogSort
): T[] {
  const list = [...products];
  switch (sort) {
    case "price_asc":
      return list.sort((a, b) => a.price - b.price);
    case "price_desc":
      return list.sort((a, b) => b.price - a.price);
    case "name_asc":
      return list.sort((a, b) => a.name.localeCompare(b.name, "es", { sensitivity: "base" }));
    default:
      return list;
  }
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
        <div className="relative flex flex-1 items-center">
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder={view === "menu" ? "Buscar en el menú…" : "Buscar productos…"}
            value={filters.search}
            onChange={(e) => onFilter({ search: e.target.value })}
            className="h-11 rounded-2xl border-muted/80 bg-muted/40 pl-10 pr-10 text-sm shadow-none"
            aria-label={view === "menu" ? "Buscar en el menú" : "Buscar productos"}
          />
          {filters.search ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2 text-muted-foreground"
              onClick={() => onFilter({ search: "" })}
              aria-label="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>
        {maxProductPrice > 0 ? (
          <Button
            type="button"
            variant={showPriceFilter ? "default" : "outline"}
            size="icon"
            className="h-11 w-11 shrink-0 rounded-2xl"
            onClick={() => setShowPriceFilter((v) => !v)}
            aria-label="Filtrar por precio"
            aria-pressed={showPriceFilter}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {/* Slider de precio colapsable */}
      {showPriceFilter && maxProductPrice > 0 ? (
        <Card className="rounded-2xl border-muted/60 bg-muted/30 py-0 shadow-none">
          <CardContent className="flex items-center gap-3 px-4 py-3 text-xs">
            <span className="shrink-0 font-medium text-muted-foreground">Hasta</span>
            <input
              type="range"
              min={0}
              max={maxProductPrice}
              step={10}
              value={filters.maxPrice ?? maxProductPrice}
              onChange={(e) => onFilter({ maxPrice: Number(e.target.value) })}
              className="flex-1 cursor-pointer accent-primary"
            />
            <span className={`shrink-0 tabular-nums font-semibold ${tokens.accent}`}>
              {formatPrice(filters.maxPrice ?? maxProductPrice)}
            </span>
          </CardContent>
        </Card>
      ) : null}

      {/* Ordenar por */}
      <Card className="rounded-2xl border-muted/60 bg-muted/30 py-0 shadow-none">
        <CardContent className="flex items-center gap-2 px-3 py-2">
          <span className="shrink-0 text-xs font-medium text-muted-foreground">Ordenar</span>
          <Select
            value={filters.sort}
            onValueChange={(v) => onFilter({ sort: v as CatalogSort })}
          >
            <SelectTrigger
              className="h-9 min-w-0 flex-1 border-0 bg-transparent text-sm font-medium shadow-none focus:ring-0"
              aria-label="Ordenar productos"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Destacado</SelectItem>
              <SelectItem value="name_asc">Nombre (A–Z)</SelectItem>
              <SelectItem value="price_asc">Precio: menor a mayor</SelectItem>
              <SelectItem value="price_desc">Precio: mayor a menor</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Chips de categoría con scroll horizontal */}
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
        <Button
          type="button"
          variant={filters.category === null ? "default" : "outline"}
          size="sm"
          className="shrink-0 rounded-full px-4 text-xs font-semibold"
          onClick={() => onFilter({ category: null })}
        >
          Todos
        </Button>
        {categories.map((cat) => {
          const id = cat.id ?? cat.name;
          return (
            <Button
              key={id}
              type="button"
              variant={filters.category === id ? "default" : "outline"}
              size="sm"
              className="shrink-0 rounded-full px-4 text-xs font-semibold"
              onClick={() => onFilter({ category: id })}
            >
              {cat.name}
            </Button>
          );
        })}
      </div>

      {/* Contador de resultados */}
      <p className="text-xs tabular-nums text-muted-foreground">
        <span className={`font-semibold ${tokens.accent}`}>{totalResults}</span>{" "}
        {view === "menu"
          ? totalResults === 1
            ? "platillo encontrado"
            : "platillos encontrados"
          : totalResults === 1
            ? "producto encontrado"
            : "productos encontrados"}
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
      <Card className="group relative flex gap-3 overflow-hidden rounded-2xl border-muted/80 p-0 shadow-[0_8px_20px_rgba(91,63,43,0.08)] transition-all duration-200 hover:shadow-md">
        <CardContent className="flex flex-1 flex-col gap-1.5 p-3.5 pb-3.5 min-w-0">
          <p className={`font-bold text-base leading-snug ${tokens.title}`}>{product.name}</p>
          {product.description ? (
            <p className={`text-sm line-clamp-2 leading-relaxed ${tokens.subtitle}`}>
              {product.description}
            </p>
          ) : null}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2.5">
            <span className={`text-2xl font-extrabold tabular-nums ${tokens.accent}`}>
              {formatPrice(product.price)}
            </span>
            {qtyInCart === 0 ? (
              <Button
                type="button"
                size="sm"
                className="rounded-full px-4 text-xs font-bold shadow-sm"
                onClick={onAdd}
              >
                <Plus className="!h-3.5 !w-3.5" />
                Agregar
              </Button>
            ) : (
              <div className="flex items-center gap-2 rounded-full bg-muted/80 px-2 py-1">
                <Button
                  type="button"
                  variant="default"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={() => onQtyChange(qtyInCart - 1)}
                  aria-label="Quitar uno"
                >
                  <Minus className="!h-3 !w-3" />
                </Button>
                <span className={`min-w-[20px] text-center text-sm font-bold tabular-nums ${tokens.title}`}>
                  {qtyInCart}
                </span>
                <Button
                  type="button"
                  variant="default"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                  onClick={onAdd}
                  aria-label="Agregar uno"
                >
                  <Plus className="!h-3 !w-3" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>

        <div className="relative m-3.5 ml-0 h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted/40">
          {urls[0] ? (
            <Image
              src={urls[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="96px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted/50">
              <UtensilsCrossed className="h-8 w-8 text-muted-foreground opacity-40" />
            </div>
          )}
        </div>
      </Card>
    );
  }

  // Vista CATÁLOGO — card vertical con imagen cuadrada
  return (
    <Card className="group flex flex-col overflow-hidden rounded-2xl border-muted/80 p-0 shadow-[0_10px_24px_rgba(88,52,109,0.1)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative aspect-square w-full overflow-hidden bg-muted/40">
        {urls.length > 0 ? (
          <>
            <Image
              src={urls[imgIdx] ?? urls[0]}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            {urls.length > 1 ? (
              <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5 px-2">
                {urls.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Imagen ${i + 1}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setImgIdx(i);
                    }}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === imgIdx ? "w-4 bg-white shadow" : "w-1.5 bg-white/45 hover:bg-white/70"
                    )}
                  />
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted/50">
            <Package className="h-10 w-10 text-muted-foreground opacity-30" />
          </div>
        )}
      </div>

      <CardContent className="flex flex-1 flex-col gap-1.5 p-3 pt-3">
        <p className={`line-clamp-2 text-sm font-bold leading-snug ${tokens.title}`}>{product.name}</p>
        {product.description ? (
          <p className={`line-clamp-2 text-xs leading-relaxed ${tokens.subtitle}`}>
            {product.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-1 pt-2">
          <div>
            <span className={`text-base font-extrabold tabular-nums ${tokens.accent}`}>
              {formatPrice(product.price)}
            </span>
            {product.unit && product.unit !== "pieza" ? (
              <span className={`ml-1 text-[10px] ${tokens.subtitle}`}>/{product.unit}</span>
            ) : null}
          </div>
        </div>

        {qtyInCart === 0 ? (
          <Button type="button" className="mt-1 w-full rounded-xl text-xs font-bold shadow-sm" onClick={onAdd}>
            + Agregar
          </Button>
        ) : (
          <div className="mt-1 flex items-center justify-between rounded-xl bg-muted/80 px-2 py-1">
            <Button
              type="button"
              variant="default"
              size="icon"
              className="h-7 w-7 rounded-lg"
              onClick={() => onQtyChange(qtyInCart - 1)}
              aria-label="Quitar uno"
            >
              <Minus className="!h-3.5 !w-3.5" />
            </Button>
            <span className={`text-sm font-bold tabular-nums ${tokens.title}`}>{qtyInCart}</span>
            <Button
              type="button"
              variant="default"
              size="icon"
              className="h-7 w-7 rounded-lg"
              onClick={onAdd}
              aria-label="Agregar uno"
            >
              <Plus className="!h-3.5 !w-3.5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
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
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");

  const orderText = useMemo(
    () => buildWhatsAppText(businessName, items, totalPrice, { fulfillmentType, deliveryAddress, paymentMethod, notes }),
    [businessName, items, totalPrice, fulfillmentType, deliveryAddress, paymentMethod, notes]
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
        overlayClassName="bg-background/70 backdrop-blur-sm"
        className={cn(
          "flex h-full min-h-0 w-full max-h-[100dvh] flex-col gap-0 border-l bg-background p-0 sm:max-w-md",
          tokens.cartBg
        )}
      >
        <SheetHeader className="shrink-0 space-y-0 px-5 py-4 text-left">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className={cn("flex items-center gap-2 text-base font-bold", tokens.title)}>
              <ShoppingCart className="h-5 w-5 shrink-0" />
              <span>Mi pedido</span>
              {totalItems > 0 ? (
                <Badge variant="secondary" className="ml-0.5 rounded-full px-2 py-0.5 text-xs font-semibold">
                  {totalItems}
                </Badge>
              ) : null}
            </SheetTitle>
            {items.length > 0 ? (
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-xs text-muted-foreground no-underline opacity-70 hover:opacity-100"
                onClick={onClear}
              >
                Vaciar
              </Button>
            ) : null}
          </div>
        </SheetHeader>

        <Separator className="shrink-0" />

        <div className="relative min-h-0 flex-1">
          <ScrollArea className="h-full max-h-[min(70dvh,calc(100dvh-220px))]">
            <div className="space-y-3 px-5 py-4 pr-3">
              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <div className="rounded-full bg-muted/80 p-5">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground opacity-40" />
                  </div>
                  <p className="text-sm font-semibold text-muted-foreground">Tu carrito está vacío</p>
                  <p className="text-xs text-muted-foreground opacity-80">
                    Agrega productos para continuar
                  </p>
                </div>
              ) : (
                <>
                  {items.map((item) => (
                    <Card
                      key={item.id}
                      className="flex items-center gap-3 rounded-2xl border-muted/80 p-3 shadow-none"
                    >
                      {item.image_url ? (
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        </div>
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className={cn("truncate text-sm font-bold", tokens.title)}>{item.name}</p>
                        <p className={cn("text-xs", tokens.subtitle)}>{formatPrice(item.price)} c/u</p>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-xl bg-muted/80 px-1.5 py-1">
                        <Button
                          type="button"
                          variant="default"
                          size="icon"
                          className="h-6 w-6 rounded-lg"
                          onClick={() => onQtyChange(item.id, item.quantity - 1)}
                          aria-label="Quitar uno"
                        >
                          <Minus className="!h-2.5 !w-2.5" />
                        </Button>
                        <span className={cn("min-w-[20px] text-center text-sm font-bold tabular-nums", tokens.title)}>
                          {item.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="default"
                          size="icon"
                          className="h-6 w-6 rounded-lg"
                          onClick={() => onQtyChange(item.id, item.quantity + 1)}
                          aria-label="Agregar uno"
                        >
                          <Plus className="!h-2.5 !w-2.5" />
                        </Button>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={cn("text-sm font-bold", tokens.accent)}>
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground opacity-60 hover:opacity-100"
                        onClick={() => onRemove(item.id)}
                        aria-label="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </Card>
                  ))}

                  {/* Detalles de entrega */}
                  <div className="pt-2 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Detalles de entrega
                    </p>

                    {/* Tipo de entrega */}
                    <div className="grid grid-cols-2 gap-2">
                      {(["delivery", "pickup"] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFulfillmentType(type)}
                          className={cn(
                            "rounded-xl border-2 py-2.5 text-xs font-bold transition-all",
                            fulfillmentType === type
                              ? "border-[var(--pub-accent)] bg-[var(--pub-accent)]/10 text-[var(--pub-accent)]"
                              : "border-muted/60 text-muted-foreground hover:border-[var(--pub-accent)]/40"
                          )}
                        >
                          {type === "delivery" ? "🛵 Domicilio" : "🏪 Recoger"}
                        </button>
                      ))}
                    </div>

                    {/* Dirección (solo domicilio) */}
                    {fulfillmentType === "delivery" && (
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Calle, número, colonia, ciudad…"
                        className="w-full rounded-xl border border-muted/80 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pub-accent)]/30"
                      />
                    )}

                    {/* Método de pago */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: "efectivo", label: "💵 Efectivo" },
                        { value: "transferencia", label: "🏦 SPEI" },
                        { value: "tarjeta", label: "💳 Tarjeta" },
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPaymentMethod(opt.value)}
                          className={cn(
                            "rounded-xl border-2 py-2.5 text-xs font-bold transition-all",
                            paymentMethod === opt.value
                              ? "border-[var(--pub-accent)] bg-[var(--pub-accent)]/10 text-[var(--pub-accent)]"
                              : "border-muted/60 text-muted-foreground hover:border-[var(--pub-accent)]/40"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Notas */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
                        Notas (opcional)
                      </label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ej: sin cebolla, extra salsa…"
                        rows={2}
                        className="resize-none rounded-xl border-muted/80 bg-muted/30 text-sm"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        </div>

        {items.length > 0 ? (
          <>
            <Separator className="shrink-0" />
            <div className="shrink-0 space-y-3 px-5 py-5">
              <div className={cn("flex items-center justify-between font-bold", tokens.title)}>
                <span className="text-sm">Total</span>
                <span className={cn("text-2xl tabular-nums", tokens.accent)}>{formatPrice(totalPrice)}</span>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl py-6 text-sm font-semibold"
                  onClick={handleCopy}
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
                </Button>
                {whatsappUrl ? (
                  <Button type="button" className="w-full rounded-full text-sm font-bold" asChild>
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4" />
                      Continuar por WhatsApp
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
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
    maxPrice: null,
    sort: "default",
  });

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
          const cap = filters.maxPrice ?? maxProductPrice;
          const matchPrice = p.price <= cap;
          return matchSearch && matchPrice;
        });

        if (products.length === 0) return null;
        const sorted = sortProductsList(products, filters.sort);
        return { ...section, products: sorted };
      })
      .filter((s): s is PublicCatalogSection => s !== null);
  }, [catalog.sections, filters, maxProductPrice]);

  const totalResults = useMemo(
    () => filteredSections.reduce((sum, s) => sum + s.products.length, 0),
    [filteredSections]
  );

  const atLimit =
    catalog.plan_limit !== null &&
    catalog.total_products >= (catalog.plan_limit ?? 0);

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.category !== null ||
    filters.sort !== "default" ||
    (maxProductPrice > 0 &&
      filters.maxPrice !== null &&
      filters.maxPrice < maxProductPrice);
  const flatProducts = useMemo(
    () => filteredSections.flatMap((section) => section.products),
    [filteredSections]
  );

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
              onClick={() =>
                setFilters({
                  category: null,
                  search: "",
                  maxPrice: null,
                  sort: "default",
                })
              }
              className={`text-sm font-semibold underline underline-offset-2 ${tokens.accent}`}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        <div className="mt-8 space-y-12">
          {view === "menu" ? (
            filteredSections.map((section) => (
              <section key={section.id ?? "__none__"} aria-label={section.name}>
                <div className={`flex flex-wrap items-end justify-between gap-2 border-b pb-3 mb-5 ${tokens.sectionBorder}`}>
                  <div>
                    <h2 className={`text-xl font-extrabold tracking-tight ${tokens.title}`}>
                      {section.name}
                    </h2>
                    <p className={`mt-0.5 text-xs ${tokens.subtitle}`}>
                      {section.products.length} opciones
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tokens.badge}`}>
                    {section.products.length} platillos
                  </span>
                </div>

                <div className="mx-auto max-w-2xl space-y-3">
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
            ))
          ) : (
            <section aria-label="Productos del catálogo" className="space-y-4">
              <div className={`flex items-center justify-between border-b pb-3 ${tokens.sectionBorder}`}>
                <h2 className={`text-xl font-extrabold tracking-tight ${tokens.title}`}>
                  Explorar catálogo
                </h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${tokens.badge}`}>
                  {flatProducts.length} productos
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {flatProducts.map((product) => {
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
          )}
        </div>
      )}

      {/* Barra inferior: solo "Ver carrito" en menú; catálogo mantiene inicio + carrito */}
      <div className="fixed bottom-4 left-1/2 z-50 w-[min(92vw,420px)] -translate-x-1/2">
        {view === "menu" ? (
          <Button
            type="button"
            onClick={() => setCartOpen(true)}
            className="h-auto w-full rounded-full border border-border/80 px-4 py-3.5 text-sm font-semibold shadow-2xl backdrop-blur-sm"
            aria-label={`Ver carrito, ${cart.totalItems} productos`}
          >
            <ShoppingCart className="h-5 w-5 shrink-0" />
            <span>Ver carrito</span>
            {cart.isReady && cart.totalItems > 0 ? (
              <Badge variant="secondary" className="ml-1 rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums">
                {cart.totalItems}
              </Badge>
            ) : null}
          </Button>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-full border border-border/80 bg-card/95 p-2 shadow-2xl backdrop-blur-sm">
            <Button
              type="button"
              variant="ghost"
              onClick={scrollToTop}
              className={cn(
                "h-auto flex-1 rounded-full py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted/80",
                tokens.subtitle
              )}
              aria-label="Ir al inicio"
            >
              <House className="h-4 w-4" />
              Inicio
            </Button>
            <Button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative h-auto flex-1 rounded-full py-2.5 text-sm font-semibold shadow-none"
              aria-label={`Abrir carrito con ${cart.totalItems} productos`}
            >
              <ShoppingCart className="h-4 w-4" />
              Carrito
              {cart.isReady && cart.totalItems > 0 ? (
                <span className="rounded-full bg-primary-foreground/15 px-2 text-xs font-bold tabular-nums">
                  {cart.totalItems}
                </span>
              ) : null}
            </Button>
          </div>
        )}
      </div>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        businessName={catalog.business_name}
        phone={catalog.whatsapp_display_number}
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
  const { toast } = useToast();
  const isMenu = view === "menu";
  const info = catalog.business_info;
  const bannerUrl = info?.catalog_banner_url ?? null;
  const hasBanner = Boolean(bannerUrl);
  const locationQuery = info?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(info.address)}`
    : null;

  type SocialLink = { href: string; label: string; icon: React.ReactNode };

  const socialOnly: SocialLink[] = [];
  if (info?.instagram) {
    const handle = info.instagram.replace("@", "");
    socialOnly.push({
      href: info.instagram.startsWith("http") ? info.instagram : `https://instagram.com/${handle}`,
      label: "Instagram",
      icon: <Instagram className="h-4 w-4" />,
    });
  }
  if (info?.facebook) {
    socialOnly.push({
      href: info.facebook.startsWith("http") ? info.facebook : `https://facebook.com/${info.facebook}`,
      label: "Facebook",
      icon: <Facebook className="h-4 w-4" />,
    });
  }
  if (info?.tiktok) {
    const handle = info.tiktok.replace("@", "");
    socialOnly.push({
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
    socialOnly.push({
      href: info.website.startsWith("http") ? info.website : `https://${info.website}`,
      label: "Sitio web",
      icon: <Globe className="h-4 w-4" />,
    });
  }

  const actionBtnClass = hasBanner
    ? "bg-white/90 text-zinc-900 ring-1 ring-black/10 hover:bg-white"
    : "bg-white/95 text-zinc-800 ring-1 ring-black/10 shadow-sm hover:bg-white";

  const showHours = () => {
    const { title, body } = formatScheduleForToast(info?.schedule);
    toast({ title, description: body });
  };

  return (
    <div className={`relative overflow-hidden rounded-3xl shadow-xl border ${tokens.border}`}>
      {bannerUrl ? (
        <div className="relative h-40 w-full sm:h-48">
          <Image
            src={bannerUrl}
            alt={`Banner de ${catalog.business_name}`}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 1024px"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent" />
        </div>
      ) : (
        <div className={`h-40 sm:h-48 ${tokens.headerBg} relative overflow-hidden`}>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: "radial-gradient(circle, currentColor 1.5px, transparent 1.5px)",
              backgroundSize: "24px 24px",
            }}
            aria-hidden
          />
        </div>
      )}

      <div className="absolute right-2 top-2 z-10 flex max-w-[calc(100%-1rem)] flex-wrap items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={showHours}
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${actionBtnClass}`}
          aria-label="Ver horario de atención"
        >
          <Clock3 className="h-4 w-4" />
        </button>
        {locationQuery && (
          <a
            href={locationQuery}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${actionBtnClass}`}
            aria-label="Ver ubicación en mapa"
          >
            <MapPin className="h-4 w-4" />
          </a>
        )}
        {socialOnly.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={link.label}
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${actionBtnClass}`}
          >
            {link.icon}
          </a>
        ))}
      </div>

      <div className="absolute inset-x-0 bottom-0 px-4 pb-4 sm:px-5 sm:pb-5">
        <div className="flex items-end gap-3">
          <div className="relative h-16 w-16 shrink-0 sm:h-20 sm:w-20">
            <div
              className={`h-full w-full overflow-hidden rounded-2xl border-2 shadow-lg ${
                hasBanner
                  ? "border-white/35 bg-white/20 backdrop-blur-md"
                  : "border-white/90 bg-white"
              }`}
            >
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
                    <UtensilsCrossed
                      className={`h-9 w-9 ${hasBanner ? "text-white" : tokens.title}`}
                    />
                  ) : (
                    <Package className={`h-9 w-9 ${hasBanner ? "text-white" : tokens.title}`} />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1 pr-1">
            <div className="mb-0.5 flex flex-wrap items-center gap-2">
              <h1
                className={`truncate text-2xl font-extrabold tracking-tight sm:text-3xl ${
                  hasBanner ? "text-white drop-shadow-md" : tokens.title
                }`}
              >
                {catalog.business_name}
              </h1>
              <span
                className={
                  hasBanner
                    ? "shrink-0 rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-white ring-1 ring-white/30 backdrop-blur-sm"
                    : `shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tokens.badge}`
                }
              >
                {isMenu ? "Menú digital" : "Catálogo digital"}
              </span>
            </div>
            <p
              className={`line-clamp-2 text-sm ${
                hasBanner ? "text-white/80" : `${tokens.subtitle} capitalize`
              }`}
            >
              {cleanLabel(catalog.business_type)}
            </p>

            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {(info?.phone ?? catalog.whatsapp_display_number) && (
                <a
                  href={`tel:${cleanPhone(
                    (info?.phone ?? catalog.whatsapp_display_number) as string
                  )}`}
                  className={
                    hasBanner
                      ? "inline-flex max-w-full items-center gap-1.5 rounded-full bg-black/35 px-3 py-1 text-xs text-white/95 backdrop-blur-sm"
                      : `inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-xs ${tokens.badge}`
                  }
                >
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{info?.phone ?? catalog.whatsapp_display_number}</span>
                </a>
              )}
              {info?.payment_methods && info.payment_methods.length > 0 && (
                <span
                  className={
                    hasBanner
                      ? "inline-flex max-w-full items-center gap-1.5 rounded-full bg-black/35 px-3 py-1 text-xs text-white/95 backdrop-blur-sm"
                      : `inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-xs ${tokens.badge}`
                  }
                >
                  <CreditCard className="h-3.5 w-3.5 shrink-0" />
                  <span className="line-clamp-1">{info.payment_methods.join(" · ")}</span>
                </span>
              )}
            </div>
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
    <Card className="rounded-2xl border-muted/80 shadow-sm">
      <CardContent className="px-5 py-4">
        <p className={`text-sm leading-relaxed ${tokens.subtitle}`}>{info.description}</p>
      </CardContent>
    </Card>
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
    <div
      data-pub-catalog
      className={`relative min-h-screen ${tokens.pageBackground}`}
    >
      <ThemeVarsInjector tokens={tokens} />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.5),transparent_45%),radial-gradient(circle_at_80%_100%,rgba(255,255,255,0.35),transparent_40%)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-[470px] px-3 py-4 pb-24 sm:px-4 sm:py-6 sm:pb-24 space-y-3">
        {/* Header con banner */}
        <CatalogHeader catalog={catalog} view={view} tokens={tokens} />

        {/* Descripción */}
        <BusinessDescription info={catalog.business_info} tokens={tokens} />

        {/* Filtros + grid interactivo */}
        <CatalogInteractiveShell catalog={catalog} view={view} tokens={tokens} />

        {/* Footer */}
        <footer className="pt-8 pb-2 text-center">
          <p className={`text-xs ${tokens.subtitle} opacity-40`}>
            Powered by MercaConnect · Catálogos digitales para negocios
          </p>
        </footer>
      </div>
    </div>
  );
}
