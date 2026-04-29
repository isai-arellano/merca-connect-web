"use client";

import React, { useMemo, useState, useLayoutEffect } from "react";
import { 
  PublicCatalogData, 
  PublicCatalogProductItem 
} from "@/components/public/public-catalog-view";
import { 
  resolveThemeTokens, 
  buildGlobalUiThemeCssFromPubVars,
  ResolvedThemeTokens
} from "@/config/catalog-themes";
import { useCatalogCart } from "@/hooks/useCatalogCart";
import { PremiumMenuLayout } from "./premium-menu-layout";
import { PremiumHeader } from "./premium-header";
import { PremiumCategoryNav } from "./premium-category-nav";
import { PremiumProductCard } from "./premium-product-card";
import { PremiumFloatingCart } from "./premium-floating-cart";
import { PremiumCartSidebar } from "./premium-cart-sidebar";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface PremiumMenuViewProps {
  catalog: PublicCatalogData;
}

const MERCA_PUB_CATALOG_ROOT_CLASS = "merca-pub-catalog-active";
const MERCA_PUB_CATALOG_STYLE_ID = "merca-pub-catalog-theme";

export function PremiumMenuView({ catalog }: PremiumMenuViewProps) {
  const { toast } = useToast();
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const cart = useCatalogCart(catalog.slug || "unknown");

  const tokens = useMemo(
    () => resolveThemeTokens(catalog.catalog_theme, "menu"),
    [catalog.catalog_theme]
  );

  // Theme Injector (same as PublicCatalogView)
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

  const filteredSections = useMemo(() => {
    let sections = catalog.sections;
    
    if (activeCategoryId) {
      sections = sections.filter(s => (s.id || s.name) === activeCategoryId);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      sections = sections.map(s => ({
        ...s,
        products: s.products.filter(p => 
          p.name.toLowerCase().includes(q) || 
          p.description?.toLowerCase().includes(q)
        )
      })).filter(s => s.products.length > 0);
    }

    return sections;
  }, [catalog.sections, activeCategoryId, searchQuery]);

  const handleCheckout = () => {
    if (cart.isEmpty) return;
    
    // Aquí se construiría el link de WhatsApp (usando la lógica de buildWhatsAppText de PublicCatalogView)
    const businessName = catalog.business_name;
    const phone = catalog.business_info?.phone;
    
    if (!phone) {
      toast({
        title: "Error",
        description: "El negocio no tiene un teléfono configurado para recibir pedidos.",
        variant: "destructive",
      });
      return;
    }

    const itemsText = cart.items
      .map((i) => `• ${i.name} x${i.quantity} — $${(i.price * i.quantity).toLocaleString()}`)
      .join("\n");
    
    const text = `🛒 *Pedido en ${businessName}*\n\nQuiero pedir estos artículos, por favor:\n\n${itemsText}\n\n*Total: $${cart.totalPrice.toLocaleString()}*\n¿Me apoyas validando disponibilidad y siguiente paso?`;
    
    const cleanPhone = phone.replace(/\D/g, "");
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
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
          description={catalog.business_info?.description}
          address={catalog.business_info?.address}
          tokens={tokens}
        />
      }
      categoriesNav={
        <PremiumCategoryNav
          categories={catalog.sections.map(s => ({ id: s.id || s.name, name: s.name }))}
          activeCategoryId={activeCategoryId}
          onSelectCategory={setActiveCategoryId}
          tokens={tokens}
          variant="vertical"
        />
      }
      mobileCategoriesNav={
        <PremiumCategoryNav
          categories={catalog.sections.map(s => ({ id: s.id || s.name, name: s.name }))}
          activeCategoryId={activeCategoryId}
          onSelectCategory={setActiveCategoryId}
          tokens={tokens}
          variant="horizontal"
        />
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
      <div className="space-y-12">
        <AnimatePresence mode="popLayout">
          {filteredSections.map((section) => (
            <motion.section 
              key={section.id || section.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <h2 className={cn("text-2xl font-black border-l-4 border-primary pl-4", tokens.title)}>
                {section.name}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {section.products.map((product) => {
                  const inCart = cart.items.find(i => i.id === product.id)?.quantity || 0;
                  return (
                    <PremiumProductCard
                      key={product.id}
                      product={product}
                      tokens={tokens}
                      qtyInCart={inCart}
                      onAdd={() => cart.addItem({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image_url: product.image_url,
                        unit: product.unit
                      })}
                      onRemove={() => cart.updateQty(product.id, inCart - 1)}
                    />
                  );
                })}
              </div>
            </motion.section>
          ))}
        </AnimatePresence>

        {filteredSections.length === 0 && (
          <div className="text-center py-20">
            <p className={cn("text-lg font-medium", tokens.subtitle)}>
              No se encontraron productos en esta categoría.
            </p>
          </div>
        )}
      </div>
    </PremiumMenuLayout>
  );
}
