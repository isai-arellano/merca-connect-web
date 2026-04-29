"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ResolvedThemeTokens } from "@/config/catalog-themes";
import { Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
}

interface PremiumCartSidebarProps {
  items: CartItem[];
  totalPrice: number;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  tokens: ResolvedThemeTokens;
}

export function PremiumCartSidebar({
  items,
  totalPrice,
  onRemove,
  onCheckout,
  tokens,
}: PremiumCartSidebarProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <div className="bg-muted/30 p-6 rounded-full">
          <ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
        </div>
        <div className="space-y-1">
          <p className={cn("font-bold", tokens.title)}>Carrito vacío</p>
          <p className={cn("text-xs opacity-60", tokens.subtitle)}>
            Agrega deliciosos platillos para comenzar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 space-y-4 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3 items-center group">
            <div className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-muted/50 border border-muted/20">
              {item.image_url ? (
                <Image src={item.image_url} alt={item.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground/40" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-bold truncate", tokens.title)}>{item.name}</p>
              <p className={cn("text-xs opacity-60", tokens.subtitle)}>
                {item.quantity} x ${item.price.toLocaleString()}
              </p>
            </div>

            <div className="text-right">
              <p className={cn("text-sm font-black", tokens.accent)}>
                ${(item.price * item.quantity).toLocaleString()}
              </p>
              <button 
                onClick={() => onRemove(item.id)}
                className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-1"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-6 border-t border-muted/60 space-y-4">
        <div className="flex justify-between items-end">
          <span className={cn("text-sm font-bold opacity-60", tokens.subtitle)}>Total</span>
          <span className={cn("text-2xl font-black tabular-nums", tokens.accent)}>
            ${totalPrice.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <Button 
          onClick={onCheckout}
          className={cn("w-full h-12 rounded-2xl font-bold text-lg shadow-lg shadow-[var(--pub-button)]/20 transition-all hover:scale-[1.02] active:scale-95", tokens.buttonBg, tokens.buttonText)}
        >
          Confirmar Pedido
        </Button>
      </div>
    </div>
  );
}
