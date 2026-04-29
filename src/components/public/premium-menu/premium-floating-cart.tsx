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
        className="fixed bottom-6 inset-x-4 z-50 flex justify-center"
      >
        <button
          onClick={onClick}
          className={cn(
            "flex items-center justify-between w-full max-w-md h-16 px-6 rounded-2xl shadow-2xl bg-primary text-primary-foreground transition-transform active:scale-95",
          )}
        >
          <div className="flex items-center gap-4">
            <div className="relative">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute -top-2 -right-2 bg-white text-primary text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center shadow-sm">
                {totalItems}
              </span>
            </div>
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Tu Pedido</span>
              <span className="text-lg font-black leading-none">
                ${totalPrice.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 font-bold">
            <span>Ver Carrito</span>
            <ArrowRight className="h-5 w-5" />
          </div>
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
