"use client";

import React, { useState, useMemo } from "react";
import useSWR, { mutate as globalMutate } from "swr";
import { endpoints } from "@/lib/api";
import { apiClient, fetcher } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  CheckCircle2,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean;
}

interface CartLine {
  product: Product;
  quantity: number;
}

interface ConversationCustomer {
  id?: string;
  name?: string;
  phone_number?: string;
  phone?: string;
}

interface CreateOrderPanelProps {
  open: boolean;
  onClose: () => void;
  customer: ConversationCustomer | null | undefined;
  conversationId: string;
  onCreated?: () => void;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatMXN(n: number) {
  return `$${Number(n).toFixed(2)}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export function CreateOrderPanel({
  open,
  onClose,
  customer,
  conversationId,
  onCreated,
}: CreateOrderPanelProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [notes, setNotes] = useState("");
  const [fulfillmentType, setFulfillmentType] = useState("delivery");
  const [paymentMethod, setPaymentMethod] = useState("pendiente");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load product catalog
  const { data: productsData, isLoading: productsLoading } = useSWR<{
    data: Product[];
  }>(open ? endpoints.products.list() : null, fetcher);

  // Load customer detail to get UUID id
  const phoneKey = customer?.phone_number || customer?.phone || null;
  const { data: customerDetail } = useSWR<{ id: string; name?: string; phone_number?: string }>(
    open && phoneKey ? endpoints.customers.detail(phoneKey) : null,
    fetcher
  );

  const products = useMemo(() => {
    const all = productsData?.data ?? [];
    return all.filter(
      (p) =>
        p.is_active !== false &&
        (search.trim() === "" ||
          p.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [productsData, search]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, l) => sum + l.product.price * l.quantity, 0),
    [cart]
  );

  // ── Cart helpers ────────────────────────────────────────────────────────────

  function addProduct(product: Product) {
    setCart((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + 1 } : l
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  }

  function updateQty(productId: string, delta: number) {
    setCart((prev) =>
      prev
        .map((l) =>
          l.product.id === productId
            ? { ...l, quantity: l.quantity + delta }
            : l
        )
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  }

  function handleClose() {
    setCart([]);
    setNotes("");
    setSearch("");
    setFulfillmentType("delivery");
    setPaymentMethod("pendiente");
    setDeliveryAddress("");
    onClose();
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (cart.length === 0) return;

    const customerId = customerDetail?.id || customer?.id;
    if (!customerId) {
      toast({
        title: "Sin cliente",
        description: "No se pudo identificar el ID del cliente.",
        variant: "destructive",
      });
      return;
    }

    if (fulfillmentType === "delivery" && !deliveryAddress.trim()) {
      toast({
        title: "Dirección requerida",
        description: "El tipo de entrega es domicilio — indica la dirección del cliente.",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      customer_id: customerId,
      status: "pendiente",
      total: cartTotal,
      notes: notes.trim() || null,
      meta: {
        fulfillment_type: fulfillmentType,
        payment_method: paymentMethod,
        checkout_source: "whatsapp_human",
        delivery_address: fulfillmentType === "delivery" ? deliveryAddress || null : null,
        conversation_id: conversationId,
      },
      items: cart.map((l) => ({
        product_id: l.product.id,
        product_name: l.product.name,
        quantity: l.quantity,
        unit_price: l.product.price,
        subtotal: l.product.price * l.quantity,
      })),
    };

    setIsSubmitting(true);
    try {
      await apiClient.post(endpoints.orders.create, payload);
      // Invalidar el cache de la lista de pedidos para que el Kanban se actualice
      await globalMutate(endpoints.orders.list);
      toast({
        title: "Pedido creado ✓",
        description: `${cart.length} producto${cart.length > 1 ? "s" : ""} — ${formatMXN(cartTotal)}`,
      });
      onCreated?.();
      handleClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al crear el pedido";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  const customerName =
    customerDetail?.name || customer?.name || customer?.phone_number || "Cliente";

  return (
    <Sheet open={open} onOpenChange={(v) => !v && handleClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col p-0 border-l border-border/60"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[#1A3E35]/10 flex items-center justify-center">
              <ShoppingBag className="h-4 w-4 text-[#1A3E35]" />
            </div>
            <div>
              <SheetTitle className="text-base text-[#1A3E35]">
                Crear Pedido Manual
              </SheetTitle>
              <SheetDescription className="text-xs">
                Para: <span className="font-medium text-foreground">{customerName}</span>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Product search */}
          <div className="px-4 pt-4 pb-2 shrink-0 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Catálogo
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
          </div>

          {/* Products list */}
          <ScrollArea className="flex-1 px-4">
            {productsLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : products.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {search ? "Sin resultados" : "Sin productos"}
              </p>
            ) : (
              <div className="space-y-1.5 pb-4">
                {products.map((product) => {
                  const inCart = cart.find((l) => l.product.id === product.id);
                  return (
                    <div
                      key={product.id}
                      className="flex items-center gap-3 rounded-xl border border-border/50 bg-background p-2.5 hover:border-[#1A3E35]/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{formatMXN(product.price)}</p>
                      </div>
                      {inCart ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => updateQty(product.id, -1)}
                            className="h-6 w-6 rounded-lg border border-border/60 flex items-center justify-center hover:bg-muted/50 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-sm font-bold min-w-[1.25rem] text-center">
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(product.id, 1)}
                            className="h-6 w-6 rounded-lg bg-[#1A3E35] text-white flex items-center justify-center hover:bg-[#1A3E35]/90 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addProduct(product)}
                          className="h-7 w-7 rounded-lg bg-[#1A3E35]/10 text-[#1A3E35] flex items-center justify-center hover:bg-[#1A3E35]/20 transition-colors shrink-0"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Cart summary + delivery details */}
          {cart.length > 0 && (
            <>
              <Separator />
              <ScrollArea className="max-h-72 shrink-0">
                <div className="px-4 pt-3 pb-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Resumen
                  </p>
                  <div className="space-y-1.5">
                    {cart.map((line) => (
                      <div key={line.product.id} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 truncate">{line.product.name}</span>
                        <span className="text-muted-foreground shrink-0">×{line.quantity}</span>
                        <span className="font-medium shrink-0 min-w-[4rem] text-right">
                          {formatMXN(line.product.price * line.quantity)}
                        </span>
                        <button
                          onClick={() => removeLine(line.product.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Delivery details */}
                  <div className="mt-4 space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Detalles de entrega
                    </p>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Tipo de entrega</Label>
                        <Select value={fulfillmentType} onValueChange={setFulfillmentType}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="delivery">Domicilio</SelectItem>
                            <SelectItem value="pickup">Recoger en tienda</SelectItem>
                            <SelectItem value="in_store">En local</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Método de pago</Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pendiente">Por definir</SelectItem>
                            <SelectItem value="efectivo">Efectivo</SelectItem>
                            <SelectItem value="transferencia">Transferencia</SelectItem>
                            <SelectItem value="tarjeta">Tarjeta</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {fulfillmentType === "delivery" && (
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Dirección de entrega</Label>
                        <Input
                          placeholder="Calle, número, colonia, ciudad..."
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Notas (opcional)</Label>
                      <Input
                        placeholder="Instrucciones especiales..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </ScrollArea>

              {/* Footer */}
              <div className="px-4 pb-5 pt-3 shrink-0 border-t border-border/40 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Total</span>
                  <span className="text-lg font-black text-[#1A3E35]">{formatMXN(cartTotal)}</span>
                </div>
                <Button
                  className="w-full h-11 bg-[#1A3E35] hover:bg-[#1A3E35]/90 text-white font-bold rounded-xl gap-2 shadow-lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting || cart.length === 0}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {isSubmitting ? "Creando pedido..." : "Confirmar Pedido"}
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
