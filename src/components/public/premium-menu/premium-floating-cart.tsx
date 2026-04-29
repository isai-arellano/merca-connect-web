"use client";

import React from "react";
import Image from "next/image";
import { ResolvedThemeTokens } from "@/config/catalog-themes";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ArrowRight } from "lucide-react";

interface PremiumFloatingCartProps {
  totalItems: number;
  totalPrice: number;
  onClick: () => void;
  onOpenCart: () => void;
  tokens: ResolvedThemeTokens;
}

export function PremiumFloatingCart({
  totalItems,
  totalPrice,
  onClick,
  onOpenCart,
  tokens,
}: PremiumFloatingCartProps) {
  if (totalItems === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
      >
        <div className="w-full max-w-4xl pointer-events-auto flex">
          {/* BRANDING AREA — links to merca-connect.com */}
          <a
            href="https://merca-connect.com"
            target="_blank"
            rel="noopener noreferrer"
            className="w-[30%] sm:w-[25%] h-16 sm:h-20 flex items-center gap-2 pl-6 sm:pl-8 rounded-tl-[2.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.3)] bg-[var(--pub-button)] text-[var(--pub-on-button)] border-r border-[var(--pub-on-button)]/5 bg-[var(--pub-button)]/90 hover:brightness-95 transition-all"
          >
            <div className="relative h-5 w-5 sm:h-6 sm:w-6 shrink-0">
              <Image
                src="/images/isologo-mc-white.webp"
                alt="Merca-Connect"
                fill
                className="object-contain"
              />
            </div>
            <div className="flex flex-col items-start -space-y-0.5">
              <span className="text-[6px] sm:text-[7px] font-black uppercase tracking-tighter opacity-30">Powered by</span>
              <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-tighter opacity-60">Merca-Connect</span>
            </div>
          </a>

          {/* CART AREA — opens cart */}
          <button
            onClick={onOpenCart}
            className="flex-1 flex items-center justify-between px-4 sm:px-8 h-16 sm:h-20 rounded-tr-[2.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.3)] bg-[var(--pub-button)] text-[var(--pub-on-button)] hover:brightness-90 active:scale-[0.99] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
                <span className="absolute -top-2 -right-2 bg-[var(--pub-on-button)] text-[var(--pub-button)] text-[9px] font-black h-4 w-4 sm:h-5 sm:w-5 rounded-full flex items-center justify-center shadow-md">
                  {totalItems}
                </span>
              </div>
              <span className="text-sm sm:text-xl font-black tabular-nums tracking-tighter">
                ${totalPrice.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="hidden sm:block text-center font-black uppercase text-sm tracking-[0.3em]">
              Ver Carrito
            </div>
            <div className="sm:hidden text-center font-black uppercase text-[11px] tracking-[0.2em]">
              Ver Carrito
            </div>

            <div className="h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center bg-[var(--pub-on-button)] rounded-2xl text-[var(--pub-button)] shadow-lg">
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
