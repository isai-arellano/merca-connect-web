"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ResolvedThemeTokens } from "@/config/catalog-themes";
import { PublicCatalogData } from "@/components/public/public-catalog-view";
import { motion, AnimatePresence } from "framer-motion";

interface PremiumMenuLayoutProps {
  catalog: PublicCatalogData;
  tokens: ResolvedThemeTokens;
  children: React.ReactNode;
  categoriesNav: React.ReactNode;
  cartSidebar: React.ReactNode;
  floatingCart: React.ReactNode;
  header: React.ReactNode;
}

export function PremiumMenuLayout({
  catalog,
  tokens,
  children,
  categoriesNav,
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
        "min-h-screen font-sans transition-colors duration-300 py-4 sm:py-8 lg:py-12 px-4 pb-32 sm:pb-40",
        tokens.pageBackground
      )}
      data-pub-catalog
      style={tokens.cssVars as React.CSSProperties}
    >
      <div className="container mx-auto max-w-4xl relative">
        <div 
          className={cn(
            "bg-[var(--pub-surface)] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)]",
            tokens.cardBackground
          )}
        >
          {/* Mobile & Desktop Header */}
          {header}
          
          <div className="px-4 sm:px-8 lg:px-12 py-4">
            {/* Horizontal Draggable Categories Nav */}
            <div className="sticky top-0 z-30 bg-[var(--pub-surface)]/80 backdrop-blur-md -mx-4 px-4 py-4 border-b border-[var(--pub-border)] mb-6">
              {categoriesNav}
            </div>

            {/* Main Content: Products Grid */}
            <main className="min-w-0 pb-10">
              <div className="mt-0">
                {children}
              </div>
            </main>
          </div>
        </div>

        {/* The Cart handles its own fixed positioning */}
        {floatingCart}
      </div>
    </div>
  );
}
