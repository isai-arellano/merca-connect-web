"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ResolvedThemeTokens } from "@/config/catalog-themes";
import { motion } from "framer-motion";

interface Category {
  id: string;
  name: string;
}

interface PremiumCategoryNavProps {
  categories: Category[];
  activeCategoryId: string | null;
  onSelectCategory: (id: string | null) => void;
  tokens: ResolvedThemeTokens;
  variant?: "horizontal" | "vertical";
}

export function PremiumCategoryNav({
  categories,
  activeCategoryId,
  onSelectCategory,
  tokens,
  variant = "horizontal",
}: PremiumCategoryNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (variant === "horizontal" && activeCategoryId && scrollRef.current) {
      const activeEl = scrollRef.current.querySelector(`[data-id="${activeCategoryId}"]`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [activeCategoryId, variant]);

  if (variant === "vertical") {
    return (
      <nav className="space-y-1">
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            "w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
            activeCategoryId === null 
              ? cn("bg-primary text-primary-foreground shadow-sm") 
              : cn("hover:bg-muted text-muted-foreground")
          )}
        >
          Todos los productos
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={cn(
              "w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200",
              activeCategoryId === cat.id 
                ? cn("bg-primary text-primary-foreground shadow-sm") 
                : cn("hover:bg-muted text-muted-foreground")
            )}
          >
            {cat.name}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth"
    >
      <button
        data-id="all"
        onClick={() => onSelectCategory(null)}
        className={cn(
          "shrink-0 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 border whitespace-nowrap",
          activeCategoryId === null
            ? cn("bg-primary text-primary-foreground border-primary shadow-md scale-105")
            : cn("bg-background border-muted text-muted-foreground hover:border-primary/50")
        )}
      >
        Todos
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          data-id={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className={cn(
            "shrink-0 px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 border whitespace-nowrap",
            activeCategoryId === cat.id
              ? cn("bg-primary text-primary-foreground border-primary shadow-md scale-105")
              : cn("bg-background border-muted text-muted-foreground hover:border-primary/50")
          )}
        >
          {cat.name}
        </button>
      ))}
    </div>
  );
}
