"use client";

import React, { useState, useMemo, useEffect } from "react";
import { PublicCatalog } from "@/types/catalog";
import { ResolvedThemeTokens } from "@/config/catalog-themes";
import { PremiumMenuLayout } from "./premium-menu-layout";
import { PremiumHeader } from "./premium-header";
import { PremiumCategoryNav } from "./premium-category-nav";
import { PremiumProductCard } from "./premium-product-card";
import { PremiumCartSidebar } from "./premium-cart-sidebar";
import { PremiumFloatingCart } from "./premium-floating-cart";
import { useCatalogCart as useCart } from "@/hooks/useCatalogCart";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LayoutGrid, List as ListIcon, ShoppingBag, Search, ArrowRight, Minus, Plus, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Image from "next/image";

interface PremiumMenuViewProps {
  catalog: PublicCatalog;
  tokens: ResolvedThemeTokens;
}

export function PremiumMenuView({ catalog, tokens }: PremiumMenuViewProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [notes, setNotes] = useState("");

  const cart = useCart(catalog.slug || "default");
  const { toast } = useToast();

  const filteredSections = catalog.sections
    .map((section) => ({
      ...section,
      products: section.products.filter((product) => {
        const matchesCategory = !activeCategoryId || section.id === activeCategoryId || section.name === activeCategoryId;
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      }),
    }))
    .filter((section) => section.products.length > 0);

  const getOrderText = () => {
    const businessName = catalog.business_name;
    const lines = cart.items
      .map((item) => `• ${item.name} x${item.quantity} — $${(item.price * item.quantity).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`)
      .join("\n");
    const fulfillmentLabel = fulfillmentType === "delivery" ? "Domicilio" : "Recoger en tienda";
    const addressLine = fulfillmentType === "delivery" && deliveryAddress.trim()
      ? `\n🏠 *Dirección:* ${deliveryAddress.trim()}`
      : "";
    const paymentLabel =
      paymentMethod === "efectivo" ? "Efectivo" :
      paymentMethod === "transferencia" ? "Transferencia SPEI" :
      paymentMethod === "tarjeta" ? "Tarjeta" : paymentMethod;
    const notesLine = notes.trim() ? `\n📝 *Notas:* ${notes.trim()}` : "";
    return (
      `🛒 *Pedido en ${businessName}*\n\n` +
      `Quiero pedir estos artículos:\n\n${lines}\n\n` +
      `📦 *Entrega:* ${fulfillmentLabel}${addressLine}\n` +
      `💳 *Pago:* ${paymentLabel}` +
      `${notesLine}\n\n` +
      `*Total: $${cart.totalPrice.toLocaleString("es-MX", { minimumFractionDigits: 2 })}*`
    );
  };

  const handleCheckout = () => {
    if (cart.isEmpty) return;
    const phone = catalog.whatsapp_display_number || catalog.business_info?.phone;
    if (!phone) {
      toast({ title: "Error", description: "El negocio no tiene un número de WhatsApp configurado.", variant: "destructive" });
      return;
    }
    const text = getOrderText();
    const cleanPhone = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleCopy = () => {
    if (cart.isEmpty) return;
    const text = getOrderText();
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado",
      description: "El pedido se ha copiado al portapapeles.",
    });
  };

  return (
    <PremiumMenuLayout
      catalog={catalog}
      tokens={tokens}
      cartOpen={cartOpen}
      onCartClose={() => setCartOpen(false)}
      header={
        <PremiumHeader
          businessName={catalog.business_name}
          logoUrl={catalog.catalog_logo_url}
          bannerUrl={catalog.business_info?.catalog_banner_url}
          address={catalog.business_info?.address}
          businessInfo={catalog.business_info}
          tokens={tokens}
        />
      }
      categoriesNav={
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40" />
            <input
              type="text"
              placeholder="¿Qué se te antoja hoy?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-muted/30 rounded-2xl border-none focus:ring-2 focus:ring-[var(--pub-accent)]/20 transition-all font-medium text-sm"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <PremiumCategoryNav
              categories={catalog.sections.map(s => ({ id: s.id || s.name, name: s.name, icon_name: s.icon_name }))}
              activeCategoryId={activeCategoryId}
              onSelectCategory={setActiveCategoryId}
              tokens={tokens}
              variant="horizontal"
            />

            <div className="flex items-center bg-[var(--pub-surface-muted)]/30 p-1.5 rounded-2xl border-2 border-muted/20 self-end shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-10 px-4 rounded-[1rem] font-black gap-2 uppercase text-[10px] tracking-widest transition-all duration-300",
                  viewMode === "grid"
                    ? "bg-[var(--pub-accent)] text-white shadow-lg shadow-[var(--pub-accent)]/20"
                    : "text-muted-foreground hover:bg-transparent hover:text-[var(--pub-accent)]"
                )}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "h-10 px-4 rounded-[1rem] font-black gap-2 uppercase text-[10px] tracking-widest transition-all duration-300",
                  viewMode === "list"
                    ? "bg-[var(--pub-accent)] text-white shadow-lg shadow-[var(--pub-accent)]/20"
                    : "text-muted-foreground hover:bg-transparent hover:text-[var(--pub-accent)]"
                )}
                onClick={() => setViewMode("list")}
              >
                <ListIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      }
      cartSidebar={
        <PremiumCartSidebar
          items={cart.items}
          totalPrice={cart.totalPrice}
          onRemove={cart.removeItem}
          onCheckout={handleCheckout}
          onCopy={handleCopy}
          tokens={tokens}
          fulfillmentType={fulfillmentType}
          onFulfillmentChange={setFulfillmentType}
          deliveryAddress={deliveryAddress}
          onDeliveryAddressChange={setDeliveryAddress}
          paymentMethod={paymentMethod}
          onPaymentMethodChange={setPaymentMethod}
          notes={notes}
          onNotesChange={setNotes}
        />
      }
      floatingCart={
        <PremiumFloatingCart
          totalItems={cart.totalItems}
          totalPrice={cart.totalPrice}
          onClick={handleCheckout}
          onOpenCart={() => setCartOpen(true)}
          tokens={tokens}
        />
      }
    >
      <div className="py-8">
        <AnimatePresence mode="popLayout">
          {filteredSections.map((section) => (
            <motion.section
              key={section.id || section.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 25
              }}
              className="space-y-8 mb-16 last:mb-0"
            >
              <div className="flex items-center gap-4 px-6 sm:px-0">
                <div className={cn("w-1.5 h-6 rounded-full", tokens.buttonBg)} />
                <h2 className={cn("text-2xl sm:text-3xl font-black leading-none tracking-tight", tokens.title)}>
                  {section.name}
                </h2>
              </div>

              <div className={cn(
                "grid gap-3 sm:gap-4 px-6 sm:px-0",
                viewMode === "grid" ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"
              )}>
                {section.products.map((product) => {
                  const inCart = cart.items.find(i => i.id === product.id)?.quantity || 0;
                  return (
                    <PremiumProductCard
                      key={product.id}
                      product={product}
                      tokens={tokens}
                      qtyInCart={inCart}
                      variant={viewMode}
                      onAdd={() => cart.addItem({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image_url: product.image_url,
                        unit: product.unit,
                      })}
                      onRemove={() => cart.updateQty(product.id, inCart - 1)}
                      onClick={() => setSelectedProduct(product)}
                    />
                  );
                })}
              </div>
            </motion.section>
          ))}
        </AnimatePresence>

        {filteredSections.length === 0 && (
          <div className="text-center py-20 px-6">
            <p className={cn("text-lg font-medium opacity-40", tokens.subtitle)}>
              No se encontraron productos.
            </p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[6rem] border-none shadow-2xl bg-[var(--pub-surface)] group/modal [&>button]:hidden" style={tokens.cssVars as React.CSSProperties}>
          <button
            onClick={() => setSelectedProduct(null)}
            className={cn(
              "absolute top-8 right-8 z-[100] h-12 w-12 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xl",
              "bg-[var(--pub-accent)] text-white"
            )}
          >
            <X className="h-6 w-6" />
          </button>
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
            <DialogDescription>Detalles</DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="flex flex-col">
              <div className="relative aspect-video w-full bg-muted overflow-hidden">
                <ProductImageCarousel
                  mainImage={selectedProduct.image_url}
                  images={selectedProduct.images || []}
                  name={selectedProduct.name}
                  tokens={tokens}
                />
              </div>

              <div className="p-8 pb-10 space-y-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-2">
                    <h2 className={cn("text-4xl font-black tracking-tighter leading-tight", tokens.title)}>
                      {selectedProduct.name}
                    </h2>
                    <span className={cn("inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", tokens.badge)}>
                      Más vendido
                    </span>
                  </div>
                  <div className={cn("text-3xl font-black tabular-nums tracking-tighter", tokens.accent)}>
                    ${selectedProduct.price.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                  </div>
                </div>

                {selectedProduct.description && (
                  <p className={cn("text-base opacity-70 font-medium leading-relaxed", tokens.subtitle)}>
                    {selectedProduct.description}
                  </p>
                )}

                <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4 bg-[var(--pub-surface-muted)]/40 p-2 rounded-[2rem] border-2 border-muted/20 w-full sm:w-auto justify-between sm:justify-start">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-12 w-12 rounded-[1.2rem] border-2 border-[var(--pub-accent)] text-[var(--pub-accent)] hover:bg-[var(--pub-accent)] hover:text-white transition-all bg-white"
                      onClick={() => {
                        const inCart = cart.items.find(i => i.id === selectedProduct.id)?.quantity || 0;
                        cart.updateQty(selectedProduct.id, inCart - 1);
                      }}
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <span className={cn("text-xl font-black min-w-[2rem] text-center", tokens.title)}>
                      {cart.items.find(i => i.id === selectedProduct.id)?.quantity || 0}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-12 w-12 rounded-[1.2rem] border-2 border-[var(--pub-accent)] text-[var(--pub-accent)] hover:bg-[var(--pub-accent)] hover:text-white transition-all bg-white shadow-lg active:scale-95"
                      onClick={() => {
                        const inCart = cart.items.find(i => i.id === selectedProduct.id)?.quantity || 0;
                        if (inCart === 0) {
                          cart.addItem({ 
                            id: selectedProduct.id, 
                            name: selectedProduct.name, 
                            price: selectedProduct.price, 
                            image_url: selectedProduct.image_url,
                            unit: selectedProduct.unit 
                          });
                        } else {
                          cart.updateQty(selectedProduct.id, inCart + 1);
                        }
                      }}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>

                  <Button
                    variant="outline"
                    className={cn("w-full sm:flex-1 h-16 rounded-2xl font-black uppercase tracking-widest gap-3 text-sm shadow-xl transition-all active:scale-[0.98] border-2 border-[var(--pub-accent)] text-[var(--pub-accent)] bg-white hover:bg-[var(--pub-accent)] hover:text-white")}
                    onClick={() => setSelectedProduct(null)}
                  >
                    Aceptar
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PremiumMenuLayout>
  );
}

function ProductImageCarousel({
  mainImage,
  images,
  name,
  tokens
}: {
  mainImage: string | null;
  images: string[];
  name: string;
  tokens: ResolvedThemeTokens;
}) {
  const allImages = useMemo(() => {
    const list = images.length > 0 ? images : (mainImage ? [mainImage] : []);
    return list;
  }, [mainImage, images]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (allImages.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % allImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [allImages]);

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % allImages.length);
  };

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + allImages.length) % allImages.length);
  };

  if (allImages.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <ShoppingBag className="h-16 w-16 text-muted-foreground/20" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full group/carousel">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="h-full w-full"
        >
          <Image src={allImages[currentIndex]} alt={name} fill className="object-cover" />
        </motion.div>
      </AnimatePresence>

      {allImages.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-black/40"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-black/40"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 z-10">
            {allImages.map((_, i) => (
              <div
                key={i}
                className={cn(
                  "transition-all duration-300 rounded-full shadow-lg",
                  i === currentIndex ? "w-8 h-1.5 bg-[var(--pub-accent)]" : "w-1.5 h-1.5 bg-white/50"
                )}
              />
            ))}
          </div>
        </>
      )}

      {/* Subtle overlay to soften the bottom edge of image */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--pub-surface)] to-transparent pointer-events-none" />
    </div>
  );
}
