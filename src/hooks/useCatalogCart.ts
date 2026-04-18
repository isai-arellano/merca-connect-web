"use client";

import { useCallback, useEffect, useState } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
  unit: string | null;
}

interface CartState {
  slug: string;
  items: CartItem[];
  updatedAt: number;
}

const CART_TTL_MS = 48 * 60 * 60 * 1000; // 48 horas

function storageKey(slug: string) {
  return `mc_cart_${slug}`;
}

function loadCart(slug: string): CartItem[] {
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return [];
    const parsed: CartState = JSON.parse(raw);
    if (parsed.slug !== slug) return [];
    if (Date.now() - parsed.updatedAt > CART_TTL_MS) {
      localStorage.removeItem(storageKey(slug));
      return [];
    }
    return parsed.items ?? [];
  } catch {
    return [];
  }
}

function saveCart(slug: string, items: CartItem[]) {
  try {
    const state: CartState = { slug, items, updatedAt: Date.now() };
    localStorage.setItem(storageKey(slug), JSON.stringify(state));
  } catch {
    // Storage lleno o no disponible
  }
}

export function useCatalogCart(slug: string) {
  // Inicia en null para evitar hydration mismatch (SSR vs CSR)
  const [items, setItems] = useState<CartItem[] | null>(null);

  // Cargar desde localStorage solo en el cliente
  useEffect(() => {
    setItems(loadCart(slug));
  }, [slug]);

  // Persistir cada cambio
  useEffect(() => {
    if (items === null) return;
    saveCart(slug, items);
  }, [slug, items]);

  const addItem = useCallback((product: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const current = prev ?? [];
      const existing = current.find((i) => i.id === product.id);
      if (existing) {
        return current.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...current, { ...product, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => (prev ?? []).filter((i) => i.id !== id));
  }, []);

  const updateQty = useCallback((id: string, qty: number) => {
    if (qty <= 0) {
      setItems((prev) => (prev ?? []).filter((i) => i.id !== id));
      return;
    }
    setItems((prev) =>
      (prev ?? []).map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const safeItems = items ?? [];
  const totalItems = safeItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = safeItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const isEmpty = safeItems.length === 0;
  const isReady = items !== null; // false durante SSR / primera hidratación

  return {
    items: safeItems,
    isReady,
    totalItems,
    totalPrice,
    isEmpty,
    addItem,
    removeItem,
    updateQty,
    clearCart,
  };
}
