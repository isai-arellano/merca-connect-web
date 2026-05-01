"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ResolvedThemeTokens } from "@/config/catalog-themes";
import { motion } from "framer-motion";
import { Plus, Minus, ShoppingBag } from "lucide-react";

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
          "group relative flex items-center gap-4 p-3 rounded-xl border-2 border-muted/30 bg-[var(--pub-surface)] transition-all duration-300 cursor-pointer overflow-hidden hover:border-[var(--pub-accent)]/30 hover:bg-[var(--pub-surface-muted)]/5",
          tokens.cardBackground
        )}
      >
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-muted/10">
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
              <ShoppingBag className="h-8 w-8 text-muted-foreground/20" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={cn("text-base font-black truncate transition-colors", tokens.title)}>
            {product.name}
          </h3>
          {product.description && (
            <p className={cn("text-xs line-clamp-1 opacity-50 font-bold uppercase tracking-wider", tokens.subtitle)}>
              {product.description}
            </p>
          )}
          <div className={cn("mt-1 text-lg font-black tabular-nums tracking-tighter", tokens.accent)}>
            ${product.price.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="shrink-0">
          {qtyInCart > 0 ? (
            <div className="flex items-center gap-2 bg-[var(--pub-surface-muted)]/30 rounded-full p-1 border-2 border-muted/30">
              <button
                className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-[var(--pub-surface)] transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className={cn("text-sm font-bold tabular-nums min-w-[1.2rem] text-center", tokens.title)}>
                {qtyInCart}
              </span>
              <button
                className={cn("h-10 w-10 rounded-full flex items-center justify-center transition-all", tokens.buttonBg, tokens.buttonText)}
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd();
                }}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              className="h-11 w-11 rounded-full border-2 border-muted/50 hover:bg-muted flex items-center justify-center transition-all"
            >
              <Plus className={cn("h-5 w-5", tokens.accent)} />
            </button>
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
        "group relative flex flex-col gap-0 rounded-[1.6rem] border-2 border-muted/30 bg-[var(--pub-surface)] transition-all duration-300 cursor-pointer overflow-hidden max-w-sm mx-auto w-full",
        "hover:border-[var(--pub-accent)]/30 hover:shadow-xl hover:shadow-black/5",
        tokens.cardBackground
      )}
    >
      {/* Tighter Image Container */}
      <div className="p-1.5 pb-0">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.2rem] bg-muted/5">
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
              <ShoppingBag className="h-10 w-10 text-muted-foreground/10" />
            </div>
          )}
        
          {/* Floating quantity indicator removed as it is redundant */}
        </div>
      </div>

      {/* Clear Content Area */}
      <div className="flex flex-1 flex-col p-2.5 gap-2">
        <div className="space-y-1">
          <h3 className={cn("text-sm font-black leading-tight transition-colors line-clamp-1", tokens.title)}>
            {product.name}
          </h3>
          {product.description && (
            <p className={cn("text-[10px] line-clamp-1 opacity-50 font-bold uppercase tracking-wider", tokens.subtitle)}>
              {product.description}
            </p>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className={cn("text-sm font-black tabular-nums tracking-tighter", tokens.accent)}>
            ${product.price.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </span>

          <div className="flex items-center">
            {qtyInCart > 0 ? (
              <div className="flex items-center gap-1.5 bg-[var(--pub-surface-muted)]/30 rounded-full p-1 border-2 border-muted/30">
                <button
                  className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-[var(--pub-surface)] transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className={cn("text-base font-black min-w-[1.5rem] text-center", "text-[var(--pub-accent)]")}>
                  {qtyInCart}
                </span>
                <button
                  className={cn("h-9 w-9 rounded-full flex items-center justify-center transition-all shadow-md", tokens.buttonBg, tokens.buttonText)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd();
                  }}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd();
                }}
                className="h-10 w-10 rounded-full border-2 border-muted/50 hover:bg-muted flex items-center justify-center transition-all"
              >
                <Plus className={cn("h-5 w-5", tokens.accent)} />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
