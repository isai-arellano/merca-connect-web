"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ResolvedThemeTokens } from "@/config/catalog-themes";
import { Trash2, ShoppingBag, Copy } from "lucide-react";
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
  onCopy: () => void;
  tokens: ResolvedThemeTokens;
  fulfillmentType: "delivery" | "pickup";
  onFulfillmentChange: (v: "delivery" | "pickup") => void;
  deliveryAddress: string;
  onDeliveryAddressChange: (v: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
}

export function PremiumCartSidebar({
  items,
  totalPrice,
  onRemove,
  onCheckout,
  onCopy,
  tokens,
  fulfillmentType,
  onFulfillmentChange,
  deliveryAddress,
  onDeliveryAddressChange,
  paymentMethod,
  onPaymentMethodChange,
  notes,
  onNotesChange,
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
            Agrega platillos para comenzar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Lista de ítems */}
      <div className="flex-1 space-y-4 max-h-[35vh] overflow-y-auto pr-2 no-scrollbar">
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

      {/* Formulario de entrega */}
      <div className="mt-5 space-y-3 border-t border-muted/40 pt-4">
        <p className={cn("text-xs font-semibold uppercase tracking-wider opacity-50", tokens.subtitle)}>
          Detalles de entrega
        </p>

        {/* Tipo de entrega */}
        <div className="grid grid-cols-2 gap-2">
          {(["delivery", "pickup"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onFulfillmentChange(type)}
              className={cn(
                "rounded-xl border-2 py-2.5 text-xs font-bold transition-all",
                fulfillmentType === type
                  ? "border-[var(--pub-accent)] bg-[var(--pub-accent)]/10 text-[var(--pub-accent)]"
                  : "border-muted/60 text-muted-foreground hover:border-[var(--pub-accent)]/40"
              )}
            >
              {type === "delivery" ? "🛵 Domicilio" : "🏪 Recoger"}
            </button>
          ))}
        </div>

        {/* Dirección (solo domicilio) */}
        {fulfillmentType === "delivery" && (
          <input
            type="text"
            value={deliveryAddress}
            onChange={(e) => onDeliveryAddressChange(e.target.value)}
            placeholder="Calle, número, colonia, ciudad…"
            className="w-full rounded-xl border border-muted/60 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pub-accent)]/30"
          />
        )}

        {/* Método de pago */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: "efectivo", label: "💵 Efectivo" },
            { value: "transferencia", label: "🏦 SPEI" },
            { value: "tarjeta", label: "💳 Tarjeta" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onPaymentMethodChange(opt.value)}
              className={cn(
                "rounded-xl border-2 py-2.5 text-xs font-bold transition-all",
                paymentMethod === opt.value
                  ? "border-[var(--pub-accent)] bg-[var(--pub-accent)]/10 text-[var(--pub-accent)]"
                  : "border-muted/60 text-muted-foreground hover:border-[var(--pub-accent)]/40"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Notas opcionales */}
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Notas (opcional) — ej: sin cebolla…"
          rows={2}
          className="w-full resize-none rounded-xl border border-muted/60 bg-muted/30 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--pub-accent)]/30"
        />
      </div>

      {/* Total y acciones */}
      <div className="mt-5 pt-4 border-t border-muted/60 space-y-4">
        <div className="flex justify-between items-end">
          <span className={cn("text-sm font-bold opacity-60", tokens.subtitle)}>Total</span>
          <span className={cn("text-2xl font-black tabular-nums", tokens.accent)}>
            ${totalPrice.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="ghost"
            onClick={onCopy}
            className="h-12 rounded-2xl font-bold gap-2 text-muted-foreground hover:bg-[var(--pub-accent)]/10 hover:text-[var(--pub-accent)] transition-all"
          >
            <Copy className="h-4 w-4" />
            Copiar pedido
          </Button>
          <Button
            variant="outline"
            onClick={onCheckout}
            className={cn(
              "h-12 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all active:scale-[0.98]",
              "border-2 border-[var(--pub-accent)] text-[var(--pub-accent)] bg-white hover:bg-[var(--pub-accent)] hover:text-white"
            )}
          >
            Enviar por WhatsApp
          </Button>
        </div>
      </div>
    </div>
  );
}
