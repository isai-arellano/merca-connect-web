/** Instancia única: formato estable entre servidor y cliente para mismos números (evita mismatch de hidratación). */
export const formatStatIntegerEsMx = new Intl.NumberFormat("es-MX", {
  maximumFractionDigits: 0,
});
