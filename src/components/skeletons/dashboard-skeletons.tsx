import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Grid de 4 tarjetas de métricas (Tablero). */
export function DashboardMetricsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("grid gap-4 grid-cols-2 lg:grid-cols-4", className)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-3"
        >
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
      ))}
    </div>
  );
}

/** Lista compacta para “Últimos pedidos”. */
export function DashboardOrdersSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2.5 py-1">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0 gap-3">
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

type ProductsTableSkeletonProps = {
  rows?: number;
  /** Alineado con `config.productFields.showStock` en la tabla real. */
  showStockColumn?: boolean;
  className?: string;
};

function headerCell() {
  return <Skeleton className="h-4 w-full max-w-[72px]" />;
}

/**
 * Tabla de ítems del módulo catálogo/menú; columnas opcionales según industria.
 * Sin stock: imagen + 7 columnas; con stock: +1.
 */
export function ProductsTableSkeleton({
  rows = 6,
  showStockColumn = true,
  className,
}: ProductsTableSkeletonProps) {
  const dataColumns = 7 + (showStockColumn ? 1 : 0);

  return (
    <div className={cn("rounded-2xl border border-border/60 bg-background overflow-hidden shadow-sm", className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="border-border">
              <th className="p-3 w-[50px]" />
              {Array.from({ length: dataColumns }).map((_, i) => (
                <th key={i} className="p-3 text-left">
                  {headerCell()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-border border-b last:border-0">
                <td className="p-3">
                  <Skeleton className="h-9 w-9 rounded-md" />
                </td>
                {Array.from({ length: dataColumns }).map((_, c) => (
                  <td key={c} className="p-3">
                    <Skeleton className={cn("h-4", c === 0 ? "w-32" : "w-24")} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
