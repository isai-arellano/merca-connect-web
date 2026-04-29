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
        "min-h-screen font-sans transition-colors duration-300 py-4 sm:py-8 lg:py-12 px-4",
        tokens.pageBackground
      )}
      data-pub-catalog
    >
      <div className="container mx-auto max-w-4xl">
        <div 
          className={cn(
            "bg-white rounded-[2.5rem] overflow-hidden border border-muted/20 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)]",
            tokens.cardBackground
          )}
          style={{ backgroundColor: '#FFFFFF' }}
        >
          {/* Mobile & Desktop Header */}
          {header}
          
          <div className="px-4 sm:px-8 lg:px-12 py-4">
            {/* Horizontal Draggable Categories Nav */}
            <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md -mx-4 px-4 py-4 border-b border-muted/10 mb-6">
              {categoriesNav}
            </div>

            {/* Main Content: Products Grid */}
            <main className="min-w-0">
              <div className="mt-0">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Floating Cart (All Viewports) */}
      {floatingCart}

      {/* Watermark */}
      <div className="mt-12 pb-16 flex flex-col items-center justify-center space-y-3 opacity-60 hover:opacity-100 transition-opacity">
        <span className={cn("text-[10px] uppercase tracking-widest font-black", tokens.subtitle)}>
          Creado con
        </span>
        <a 
          href="https://merca-connect.com" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex flex-col items-center gap-1 group"
        >
          <div className="relative h-8 w-8 mb-1 transition-transform group-hover:scale-110">
            <Image
              src="/images/isologo-principal.webp"
              alt="Merca-Connect Logo"
              fill
              className="object-contain"
            />
          </div>
          <span className={cn("font-black text-sm tracking-tighter uppercase", tokens.title)}>
            Merca-Connect
          </span>
        </a>
      </div>
    </div>
  );
}
