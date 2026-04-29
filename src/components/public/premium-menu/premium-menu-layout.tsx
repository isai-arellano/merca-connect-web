"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ResolvedThemeTokens } from "@/config/catalog-themes";
import { PublicCatalogData } from "@/components/public/public-catalog-view";
import { motion, AnimatePresence } from "framer-motion";

interface PremiumMenuLayoutProps {
  catalog: PublicCatalogData;
  tokens: ResolvedThemeTokens;
  children: React.ReactNode;
  categoriesNav: React.ReactNode;
  mobileCategoriesNav: React.ReactNode;
  cartSidebar: React.ReactNode;
  floatingCart: React.ReactNode;
  header: React.ReactNode;
}

export function PremiumMenuLayout({
  catalog,
  tokens,
  children,
  categoriesNav,
  mobileCategoriesNav,
  cartSidebar,
  floatingCart,
  header,
}: PremiumMenuLayoutProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div 
      className={cn(
        "min-h-screen font-sans transition-colors duration-300",
        tokens.pageBackground
      )}
      data-pub-catalog
    >
      {/* Dynamic Theme Injector is assumed to be handled by the parent or a global provider */}
      
      {/* Mobile & Desktop Header */}
      {header}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:gap-8 pt-6 pb-24 lg:pb-12">
          
          {/* Left Sidebar: Categories (Desktop only) */}
          <aside className="hidden lg:block lg:w-64 lg:shrink-0">
            <div className="sticky top-24 space-y-4">
              <h2 className={cn("text-lg font-bold px-2", tokens.title)}>
                Categorías
              </h2>
              {categoriesNav}
            </div>
          </aside>

          {/* Main Content: Products Grid */}
          <main className="flex-1 min-w-0">
            {/* Mobile Sticky Categories */}
            <div className={cn(
              "lg:hidden sticky top-0 z-30 -mx-4 px-4 py-3 bg-background/80 backdrop-blur-md transition-shadow duration-300",
              isScrolled ? "shadow-md" : ""
            )}>
              {mobileCategoriesNav}
            </div>

            <div className="mt-4 lg:mt-0">
              {children}
            </div>
          </main>

          {/* Right Sidebar: Cart (Desktop only) */}
          <aside className="hidden xl:block xl:w-80 xl:shrink-0">
            <div className="sticky top-24">
              <div className={cn(
                "rounded-3xl border border-muted/60 overflow-hidden shadow-sm",
                tokens.cardBackground
              )}>
                <div className="p-5">
                  <h2 className={cn("text-lg font-bold mb-4", tokens.title)}>
                    Tu Pedido
                  </h2>
                  {cartSidebar}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Floating Cart (Mobile & Small Desktop) */}
      <div className="xl:hidden">
        {floatingCart}
      </div>
    </div>
  );
}
