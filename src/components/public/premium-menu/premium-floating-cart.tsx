"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { ResolvedThemeTokens } from "@/config/catalog-themes";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, ArrowRight } from "lucide-react";

interface PremiumFloatingCartProps {
  totalItems: number;
  totalPrice: number;
  onClick: () => void;
  tokens: ResolvedThemeTokens;
}

export function PremiumFloatingCart({
  totalItems,
  totalPrice,
  onClick,
  tokens,
}: PremiumFloatingCartProps) {
  if (totalItems === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-6 inset-x-0 z-50 flex justify-center px-4"
      >
        <button
          onClick={onClick}
          className={cn(
            "group flex items-center gap-4 h-14 pl-2 pr-2 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.25)] bg-black text-white transition-all hover:scale-[1.02] active:scale-95 border border-white/10 w-full max-w-md",
          )}
        >
          <div className="flex items-center gap-3 bg-white/10 h-10 px-3 rounded-xl border border-white/5">
            <div className="relative">
              <ShoppingCart className="h-5 w-5 text-primary" />
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center shadow-md ring-2 ring-black">
                {totalItems}
              </span>
            </div>
            <span className="text-sm font-black tabular-nums">
              ${totalPrice.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex-1 text-center font-black uppercase text-[10px] tracking-[0.2em] opacity-80">
            Confirmar Pedido
          </div>

          <div className="h-10 w-10 flex items-center justify-center bg-primary rounded-xl text-primary-foreground shadow-lg shadow-primary/20">
            <ArrowRight className="h-5 w-5" />
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
