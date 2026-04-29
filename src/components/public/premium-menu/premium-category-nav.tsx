"use client";

import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ResolvedThemeTokens } from "@/config/catalog-themes";
import { motion } from "framer-motion";
import { 
  LayoutGrid, 
  Utensils, Pizza, Coffee, IceCream, Soup, Cookie, Croissant, 
  Beef, Cake, Fish, Apple, Cherry, Grape, Sandwich, Beer, 
  Drumstick, Flame, Candy, Wine, GlassWater, Microwave, ChefHat 
} from "lucide-react";

const FOOD_ICONS: Record<string, any> = {
  "utensils": Utensils,
  "pizza": Pizza,
  "coffee": Coffee,
  "ice-cream": IceCream,
  "soup": Soup,
  "cookie": Cookie,
  "croissant": Croissant,
  "beef": Beef,
  "cake": Cake,
  "fish": Fish,
  "apple": Apple,
  "cherry": Cherry,
  "grape": Grape,
  "sandwich": Sandwich,
  "beer": Beer,
  "drumstick": Drumstick,
  "flame": Flame,
  "candy": Candy,
  "wine": Wine,
  "glass-water": GlassWater,
  "microwave": Microwave,
  "chef-hat": ChefHat,
};

interface Category {
  id: string;
  name: string;
  icon_name?: string | null;
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

  const renderIcon = (iconName: string | null | undefined, isActive: boolean) => {
    const Icon = (iconName && FOOD_ICONS[iconName]) ? FOOD_ICONS[iconName] : Utensils;
    return <Icon className={cn("h-4 w-4 sm:h-5 sm:w-5", isActive ? "" : "opacity-60")} />;
  };

  if (variant === "vertical") {
    return (
      <div className="flex flex-col gap-2">
        <button
          onClick={() => onSelectCategory(null)}
          className={cn(
            "flex items-center gap-3 p-3 rounded-xl transition-all duration-300 text-left group",
            activeCategoryId === null
              ? cn(tokens.buttonBg, tokens.buttonText, "shadow-md scale-[1.02]")
              : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
          )}
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="font-black uppercase text-[9px] tracking-widest">Todos</span>
        </button>

        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={cn(
              "flex items-center gap-3 p-3 rounded-xl transition-all duration-300 text-left group",
              activeCategoryId === cat.id
                ? cn(tokens.buttonBg, tokens.buttonText, "shadow-md scale-[1.02]")
                : "hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            )}
          >
            {renderIcon(cat.icon_name, activeCategoryId === cat.id)}
            <span className="font-black uppercase text-[9px] tracking-widest">{cat.name}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className="flex flex-wrap justify-center sm:justify-start gap-4 sm:gap-6 pb-6 overflow-visible"
    >
      <button
        data-id="all"
        onClick={() => onSelectCategory(null)}
        className="flex flex-col items-center gap-2 shrink-0 group"
      >
        <div className={cn(
          "h-12 w-12 sm:h-14 sm:w-14 rounded-xl flex items-center justify-center transition-all duration-300 border",
          activeCategoryId === null
            ? cn(tokens.buttonBg, tokens.buttonText, "border-transparent shadow-lg scale-105")
            : cn("bg-white border-muted text-muted-foreground hover:border-[var(--pub-accent)] hover:bg-[var(--pub-accent)]/5")
        )}>
          <LayoutGrid className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
        <span className={cn(
          "text-[8px] font-black uppercase tracking-widest transition-colors",
          activeCategoryId === null ? tokens.accent : "text-muted-foreground group-hover:text-foreground"
        )}>
          Todos
        </span>
      </button>

      {categories.map((cat) => (
        <button
          key={cat.id}
          data-id={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className="flex flex-col items-center gap-2 shrink-0 group"
        >
          <div className={cn(
            "h-12 w-12 sm:h-14 sm:w-14 rounded-xl flex items-center justify-center transition-all duration-300 border",
            activeCategoryId === cat.id
              ? cn(tokens.buttonBg, tokens.buttonText, "border-transparent shadow-lg scale-105")
              : cn("bg-white border-muted text-muted-foreground hover:border-[var(--pub-accent)] hover:bg-[var(--pub-accent)]/5")
          )}>
            {renderIcon(cat.icon_name, activeCategoryId === cat.id)}
          </div>
          <span className={cn(
            "text-[8px] font-black uppercase tracking-widest transition-colors",
            activeCategoryId === cat.id ? tokens.accent : "text-muted-foreground group-hover:text-foreground"
          )}>
            {cat.name}
          </span>
        </button>
      ))}
    </div>
  );
}
