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
  onClick?: () => void;
  tokens: ResolvedThemeTokens;
  variant?: "grid" | "list";
}

export function PremiumProductCard({
  product,
  qtyInCart,
  onAdd,
  onRemove,
  onClick,
  tokens,
  variant = "grid",
}: PremiumProductCardProps) {
  if (variant === "list") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={onClick}
        className={cn(
          "group relative flex items-center gap-4 p-3 rounded-2xl border border-muted/40 bg-white transition-all duration-300 cursor-pointer overflow-hidden hover:border-primary/30 hover:bg-muted/5",
          tokens.cardBackground
        )}
      >
        <div className="relative h-16 w-16 sm:h-20 sm:w-20 shrink-0 overflow-hidden rounded-xl bg-muted/10">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover transition-transform group-hover:scale-110"
              sizes="100px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-muted-foreground/20" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={cn("text-sm font-black truncate group-hover:text-primary transition-colors", tokens.title)}>
            {product.name}
          </h3>
          {product.description && (
            <p className={cn("text-[10px] line-clamp-1 opacity-50 font-bold uppercase tracking-wider", tokens.subtitle)}>
              {product.description}
            </p>
          )}
          <div className={cn("mt-1 text-base font-black tabular-nums tracking-tighter", tokens.accent)}>
            ${product.price.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="shrink-0">
          {qtyInCart > 0 ? (
            <div className="flex items-center gap-2 bg-muted/30 rounded-full p-1 border border-muted/50">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 rounded-full hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className={cn("text-xs font-bold tabular-nums min-w-[1rem] text-center", tokens.title)}>
                {qtyInCart}
              </span>
              <Button
                size="icon"
                className={cn("h-8 w-8 rounded-full", tokens.buttonBg, tokens.buttonText)}
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd();
                }}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              className="h-9 w-9 rounded-full border border-muted/50 hover:bg-muted transition-all"
            >
              <Plus className={cn("h-4 w-4", tokens.accent)} />
            </Button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-0 rounded-[2rem] border border-muted/50 bg-white transition-all duration-300 cursor-pointer overflow-hidden",
        "hover:border-primary/30 hover:shadow-xl hover:shadow-black/5",
        tokens.cardBackground
      )}
    >
      {/* Image Container with 'Aire' */}
      <div className="p-3 pb-0">
        <div className="relative aspect-square w-full overflow-hidden rounded-[1.5rem] bg-muted/10">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 640px) 50vw, 300px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/10" />
            </div>
          )}
        
          {qtyInCart > 0 && (
            <div className={cn("absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black shadow-xl ring-2 ring-white", tokens.buttonBg, tokens.buttonText)}>
              {qtyInCart} en carrito
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5 gap-3">
        <div className="space-y-1">
          <h3 className={cn("text-base font-black leading-tight transition-colors line-clamp-2", tokens.title)}>
            {product.name}
          </h3>
          {product.description && (
            <p className={cn("text-[10px] line-clamp-1 opacity-50 font-bold uppercase tracking-wider", tokens.subtitle)}>
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between">
          <span className={cn("text-xl font-black tabular-nums tracking-tighter", tokens.accent)}>
            ${product.price.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </span>

          <div className="flex items-center">
            {qtyInCart > 0 ? (
              <div className="flex items-center gap-2 bg-muted/30 rounded-full p-1 border border-muted/50">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-full hover:bg-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className={cn("text-sm font-bold tabular-nums min-w-[1.2rem] text-center", tokens.title)}>
                  {qtyInCart}
                </span>
                <Button
                  size="icon"
                  className={cn("h-8 w-8 rounded-full shadow-lg", tokens.buttonBg, tokens.buttonText)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd();
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd();
                }}
                className="h-9 w-9 rounded-full border border-muted/50 hover:bg-muted transition-all"
              >
                <Plus className={cn("h-4 w-4", tokens.accent)} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
