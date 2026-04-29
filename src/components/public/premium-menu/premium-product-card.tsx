"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ResolvedThemeTokens } from "@/config/catalog-themes";
import { motion } from "framer-motion";
import { Plus, Minus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PremiumProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  image_url?: string | null;
}

interface PremiumProductCardProps {
  product: PremiumProduct;
  qtyInCart: number;
  onAdd: () => void;
  onRemove: () => void;
  tokens: ResolvedThemeTokens;
}

export function PremiumProductCard({
  product,
  qtyInCart,
  onAdd,
  onRemove,
  tokens,
}: PremiumProductCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group relative flex flex-col sm:flex-row gap-4 p-4 rounded-3xl border border-muted/40 transition-all duration-300",
        "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/20",
        tokens.cardBackground
      )}
    >
      {/* Image Container */}
      <div className="relative h-40 w-full sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-2xl bg-muted/30">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, 128px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="h-10 w-10 text-muted-foreground/20" />
          </div>
        )}
        
        {/* Mobile Badges/Actions can go here */}
        {qtyInCart > 0 && (
          <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-[10px] font-bold shadow-lg">
            {qtyInCart} en carrito
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between py-1">
        <div className="space-y-1">
          <h3 className={cn("text-lg font-bold leading-tight group-hover:text-primary transition-colors", tokens.title)}>
            {product.name}
          </h3>
          {product.description && (
            <p className={cn("text-sm line-clamp-2 leading-relaxed opacity-70", tokens.subtitle)}>
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-4 sm:mt-auto flex items-center justify-between">
          <span className={cn("text-xl font-black tracking-tight", tokens.accent)}>
            ${product.price.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </span>

          <div className="flex items-center">
            {qtyInCart > 0 ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 bg-muted/50 rounded-full px-1.5 py-1"
              >
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full hover:bg-background shadow-sm"
                  onClick={onRemove}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className={cn("text-sm font-bold tabular-nums w-4 text-center", tokens.title)}>
                  {qtyInCart}
                </span>
                <Button
                  size="icon"
                  className="h-8 w-8 rounded-full shadow-md"
                  onClick={onAdd}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </motion.div>
            ) : (
              <Button
                onClick={onAdd}
                className="rounded-full px-6 font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105 active:scale-95"
              >
                Agregar
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
