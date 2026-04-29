"use client";

import React, { useState } from "react";
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
import { LayoutGrid, List as ListIcon, ShoppingBag, Search, ArrowRight, Minus, Plus } from "lucide-react";
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
  
  const cart = useCart();
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

  const handleCheckout = () => {
    if (cart.isEmpty) return;
    const businessName = catalog.business_name;
    const phone = catalog.business_info?.phone;
    if (!phone) {
      toast({ title: "Error", description: "El negocio no tiene un teléfono configurado.", variant: "destructive" });
      return;
    }
    const itemsText = cart.items.map((item) => `- ${item.quantity}x ${item.name} ($${(item.price * item.quantity).toLocaleString()})`).join("\n");
    const text = `🛒 *Pedido en ${businessName}*\n\nQuiero pedir estos artículos:\n\n${itemsText}\n\n*Total: $${cart.totalPrice.toLocaleString()}*`;
    const cleanPhone = phone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <PremiumMenuLayout
      catalog={catalog}
      tokens={tokens}
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

            <div className="flex items-center bg-muted/30 p-1 rounded-xl border border-muted/50 self-end">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "h-10 px-4 rounded-lg font-black gap-2 uppercase text-[10px] tracking-widest", 
                  viewMode === "grid" ? cn("bg-white shadow-sm", tokens.accent) : "text-muted-foreground"
                )}
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "h-10 px-4 rounded-lg font-black gap-2 uppercase text-[10px] tracking-widest", 
                  viewMode === "list" ? cn("bg-white shadow-sm", tokens.accent) : "text-muted-foreground"
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
          tokens={tokens}
        />
      }
      floatingCart={
        <PremiumFloatingCart
          totalItems={cart.totalItems}
          totalPrice={cart.totalPrice}
          onClick={handleCheckout}
          tokens={tokens}
        />
      }
    >
      <div className="py-8">
        <AnimatePresence mode="popLayout">
          {filteredSections.map((section) => (
            <motion.section 
              key={section.id || section.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8 mb-16 last:mb-0"
            >
              <div className="flex items-center gap-4 px-6 sm:px-0">
                <div className={cn("w-1.5 h-6 rounded-full", tokens.buttonBg)} />
                <h2 className={cn("text-2xl sm:text-3xl font-black leading-none tracking-tight", tokens.title)}>
                  {section.name}
                </h2>
              </div>
              
              <div className={cn(
                "grid gap-4 sm:gap-6 px-6 sm:px-0",
                viewMode === "grid" ? "grid-cols-2 lg:grid-cols-2" : "grid-cols-1"
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
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl bg-white">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedProduct?.name}</DialogTitle>
            <DialogDescription>Detalles</DialogDescription>
          </DialogHeader>

          {selectedProduct && (
            <div className="flex flex-col">
              <div className="relative aspect-video w-full bg-muted overflow-hidden">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full w-full">
                  {selectedProduct.image_url ? (
                    <Image src={selectedProduct.image_url} alt={selectedProduct.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <ShoppingBag className="h-16 w-16 text-muted-foreground/20" />
                    </div>
                  )}
                </motion.div>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
                  <div className={cn("h-1.5 w-6 rounded-full", tokens.buttonBg)} />
                  <div className="h-1.5 w-1.5 rounded-full bg-white/50" />
                  <div className="h-1.5 w-1.5 rounded-full bg-white/50" />
                </div>
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
                  <div className="flex items-center gap-4 bg-muted/40 p-1.5 rounded-2xl border border-muted/50 w-full sm:w-auto justify-between sm:justify-start">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-12 w-12 rounded-xl hover:bg-white"
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
                      className={cn("h-12 w-12 rounded-xl", tokens.buttonBg, tokens.buttonText)}
                      onClick={() => {
                        const inCart = cart.items.find(i => i.id === selectedProduct.id)?.quantity || 0;
                        if (inCart === 0) {
                          cart.addItem({ id: selectedProduct.id, name: selectedProduct.name, price: selectedProduct.price, image_url: selectedProduct.image_url });
                        } else {
                          cart.updateQty(selectedProduct.id, inCart + 1);
                        }
                      }}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>

                  <Button 
                    className={cn("w-full sm:flex-1 h-16 rounded-2xl font-black uppercase tracking-widest gap-3 text-sm shadow-xl", tokens.buttonBg, tokens.buttonText)}
                    onClick={() => setSelectedProduct(null)}
                  >
                    Confirmar
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
