"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { endpoints } from "@/lib/api";
import { apiClient, fetcher } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  User,
  Store,
  Phone,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  name: string;
  price: number;
  is_active?: boolean;
}

interface Customer {
  id: string;
  name?: string;
  phone_number?: string;
}

interface CartLine {
  product: Product;
  quantity: number;
}

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

type OrderSource = "in_store" | "phone";

const SOURCE_CONFIG: Record<OrderSource, { label: string; icon: typeof Store; color: string }> = {
  in_store: { label: "En local / mostrador", icon: Store, color: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30" },
  phone: { label: "Por teléfono", icon: Phone, color: "bg-blue-500/10 text-blue-700 border-blue-500/30" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatMXN(n: number) {
  return `$${Number(n).toFixed(2)}`;
}

function customerLabel(c: Customer) {
  return c.name || c.phone_number || "Cliente";
}

// ── Component ────────────────────────────────────────────────────────────────

export function CreateOrderDialog({ open, onOpenChange, onCreated }: CreateOrderDialogProps) {
  const { toast } = useToast();

  // Order source
  const [source, setSource] = useState<OrderSource>("in_store");

  // Customer
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [walkInName, setWalkInName] = useState("");
  const [isWalkIn, setIsWalkIn] = useState(false);

  // Products / cart
  const [productSearch, setProductSearch] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);

  // Delivery details
  const [fulfillmentType, setFulfillmentType] = useState("in_store");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────────

  const { data: customersData, isLoading: customersLoading } = useSWR<{ data: Customer[] }>(
    open && customerSearch.length >= 2 ? endpoints.customers.list : null,
    fetcher
  );

  const { data: productsData, isLoading: productsLoading } = useSWR<{ data: Product[] }>(
    open ? endpoints.products.list() : null,
    fetcher
  );

  const filteredCustomers = useMemo(() => {
    const all = customersData?.data ?? [];
    if (!customerSearch) return [];
    return all.filter(
      (c) =>
        c.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone_number?.includes(customerSearch)
    ).slice(0, 6);
  }, [customersData, customerSearch]);

  const filteredProducts = useMemo(() => {
    const all = productsData?.data ?? [];
    return all.filter(
      (p) =>
        p.is_active !== false &&
        (productSearch.trim() === "" ||
          p.name.toLowerCase().includes(productSearch.toLowerCase()))
    );
  }, [productsData, productSearch]);

  const cartTotal = useMemo(
    () => cart.reduce((sum, l) => sum + l.product.price * l.quantity, 0),
    [cart]
  );

  // ── Cart helpers ─────────────────────────────────────────────────────────

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
        .map((l) => l.product.id === productId ? { ...l, quantity: l.quantity + delta } : l)
        .filter((l) => l.quantity > 0)
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((l) => l.product.id !== productId));
  }

  function handleReset() {
    setSource("in_store");
    setCustomerSearch("");
    setSelectedCustomer(null);
    setWalkInName("");
    setIsWalkIn(false);
    setProductSearch("");
    setCart([]);
    setFulfillmentType("in_store");
    setPaymentMethod("efectivo");
    setDeliveryAddress("");
    setNotes("");
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (cart.length === 0) return;
    if (!selectedCustomer && !isWalkIn) {
      toast({ title: "Selecciona un cliente", description: "Busca un cliente o usa cliente sin registro.", variant: "destructive" });
      return;
    }

    // walk-in requiere selección de cliente porque el backend necesita customer_id UUID
    if (isWalkIn && !selectedCustomer) {
      toast({ title: "Cliente requerido", description: "El sistema requiere un cliente registrado. Búscalo por teléfono o nombre.", variant: "destructive" });
      return;
    }

    if (fulfillmentType === "delivery" && !deliveryAddress.trim()) {
      toast({ title: "Dirección requerida", description: "El tipo de entrega es domicilio — indica la dirección del cliente.", variant: "destructive" });
      return;
    }

    const payload = {
      customer_id: selectedCustomer!.id,
      status: "pendiente",
      total: cartTotal,
      notes: notes.trim() || null,
      meta: {
        fulfillment_type: fulfillmentType,
        payment_method: paymentMethod,
        checkout_source: source,
        delivery_address: fulfillmentType === "delivery" ? deliveryAddress || null : null,
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
      toast({
        title: "Pedido creado ✓",
        description: `${cart.length} producto${cart.length > 1 ? "s" : ""} — ${formatMXN(cartTotal)}`,
      });
      handleReset();
      onOpenChange(false);
      onCreated();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al crear el pedido";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleReset(); onOpenChange(v); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50 shrink-0">
          <DialogTitle className="text-[#1A3E35]">Nuevo Pedido</DialogTitle>
          <DialogDescription className="text-xs">
            Registra un pedido en mostrador o por teléfono.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1">
            <div className="px-6 py-5 space-y-6">

              {/* ── Source selector ── */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Origen del pedido
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(SOURCE_CONFIG) as [OrderSource, typeof SOURCE_CONFIG[OrderSource]][]).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setSource(key);
                          setFulfillmentType(key === "in_store" ? "in_store" : "delivery");
                        }}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all text-left ${
                          source === key
                            ? "border-[#1A3E35] bg-[#1A3E35]/5"
                            : "border-border/50 hover:border-border bg-background"
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${cfg.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              {/* ── Customer search ── */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Cliente
                </Label>

                {selectedCustomer ? (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-[#1A3E35]/30 bg-[#1A3E35]/5">
                    <div className="h-8 w-8 rounded-full bg-[#1A3E35] text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {customerLabel(selectedCustomer).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{customerLabel(selectedCustomer)}</p>
                      {selectedCustomer.phone_number && (
                        <p className="text-xs text-muted-foreground">{selectedCustomer.phone_number}</p>
                      )}
                    </div>
                    <button
                      onClick={() => { setSelectedCustomer(null); setCustomerSearch(""); }}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por nombre o teléfono..."
                        value={customerSearch}
                        onChange={(e) => setCustomerSearch(e.target.value)}
                        className="pl-8 h-9 text-sm"
                      />
                    </div>

                    {customersLoading && customerSearch.length >= 2 && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Buscando...
                      </div>
                    )}

                    {filteredCustomers.length > 0 && (
                      <div className="border border-border/50 rounded-xl overflow-hidden divide-y divide-border/40">
                        {filteredCustomers.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => { setSelectedCustomer(c); setCustomerSearch(""); setIsWalkIn(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors text-left"
                          >
                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                              {customerLabel(c).charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{customerLabel(c)}</p>
                              {c.phone_number && (
                                <p className="text-xs text-muted-foreground">{c.phone_number}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {customerSearch.length >= 2 && filteredCustomers.length === 0 && !customersLoading && (
                      <p className="text-xs text-muted-foreground px-1">
                        Sin coincidencias.{" "}
                        <button
                          onClick={() => setIsWalkIn(true)}
                          className="underline text-[#1A3E35] hover:opacity-80"
                        >
                          Continuar sin cliente registrado
                        </button>
                      </p>
                    )}

                    {isWalkIn && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl border border-amber-400/40 bg-amber-50/60 text-xs text-amber-700">
                        <User className="h-4 w-4 shrink-0" />
                        <span>Pedido sin cliente registrado. Agrega el nombre si lo tienes.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* ── Products ── */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Productos
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar producto..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-8 h-9 text-sm"
                  />
                </div>

                {productsLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {filteredProducts.map((product) => {
                      const inCart = cart.find((l) => l.product.id === product.id);
                      return (
                        <div
                          key={product.id}
                          className="flex items-center gap-2 rounded-lg border border-border/50 bg-background px-3 py-2 hover:border-[#1A3E35]/30 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{product.name}</p>
                            <p className="text-xs text-muted-foreground">{formatMXN(product.price)}</p>
                          </div>
                          {inCart ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => updateQty(product.id, -1)}
                                className="h-5 w-5 rounded border border-border/60 flex items-center justify-center hover:bg-muted/50"
                              >
                                <Minus className="h-2.5 w-2.5" />
                              </button>
                              <span className="text-xs font-bold w-4 text-center">{inCart.quantity}</span>
                              <button
                                onClick={() => updateQty(product.id, 1)}
                                className="h-5 w-5 rounded bg-[#1A3E35] text-white flex items-center justify-center hover:bg-[#1A3E35]/90"
                              >
                                <Plus className="h-2.5 w-2.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => addProduct(product)}
                              className="h-6 w-6 rounded-lg bg-[#1A3E35]/10 text-[#1A3E35] flex items-center justify-center hover:bg-[#1A3E35]/20 transition-colors shrink-0"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Cart summary ── */}
              {cart.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Resumen
                    </Label>
                    <div className="space-y-1.5">
                      {cart.map((line) => (
                        <div key={line.product.id} className="flex items-center gap-2 text-sm">
                          <span className="flex-1 truncate">{line.product.name}</span>
                          <span className="text-muted-foreground shrink-0">×{line.quantity}</span>
                          <span className="font-medium shrink-0 min-w-[4.5rem] text-right">
                            {formatMXN(line.product.price * line.quantity)}
                          </span>
                          <button onClick={() => removeLine(line.product.id)}
                            className="text-muted-foreground hover:text-destructive shrink-0">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* ── Delivery details ── */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Detalles de entrega
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Tipo de entrega</Label>
                    <Select value={fulfillmentType} onValueChange={setFulfillmentType}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_store">En local</SelectItem>
                        <SelectItem value="pickup">Recoger en tienda</SelectItem>
                        <SelectItem value="delivery">Domicilio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Método de pago</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="efectivo">Efectivo</SelectItem>
                        <SelectItem value="transferencia">Transferencia</SelectItem>
                        <SelectItem value="tarjeta">Tarjeta</SelectItem>
                        <SelectItem value="pendiente">Por definir</SelectItem>
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
                      className="h-9 text-sm"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Notas (opcional)</Label>
                  <Input
                    placeholder="Instrucciones especiales, referencias..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* ── Footer ── */}
          <div className="px-6 py-4 border-t border-border/50 shrink-0 flex items-center justify-between gap-4">
            <div>
              {cart.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    {cart.reduce((s, l) => s + l.quantity, 0)} productos
                  </p>
                  <p className="text-lg font-black text-[#1A3E35]">{formatMXN(cartTotal)}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => { handleReset(); onOpenChange(false); }}
                className="h-10"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || cart.length === 0 || (!selectedCustomer && !isWalkIn)}
                className="h-10 bg-[#1A3E35] hover:bg-[#1A3E35]/90 text-white font-bold gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                {isSubmitting ? "Creando..." : "Crear Pedido"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
