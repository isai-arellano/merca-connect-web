"use client";

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { endpoints } from "@/lib/api";
import { apiClient, fetcher } from "@/lib/api-client";
import { getSessionBusinessPhoneId } from "@/lib/business";
import { type ApiList, type BusinessSettings } from "@/types/api";
import { getIndustryConfig, pluralProductLabel } from "@/config/industries";
import { useIndustries } from "@/hooks/useIndustries";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  Package,
  Truck,
  AlertCircle,
  XCircle,
  LayoutGrid,
  List,
  RefreshCw,
  MapPin,
  ShoppingCart,
  ArrowUpDown,
  Eye,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface Customer {
  id: string;
  name?: string;
  phone_number?: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  delivery_address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  customer?: Customer;
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

type StatusId =
  | "pendiente"
  | "confirmado"
  | "en_preparacion"
  | "listo"
  | "entregado"
  | "cancelado";

interface StatusConfig {
  id: StatusId;
  label: string;
  icon: typeof AlertCircle;
  color: string;
  bg: string;
  headerBg: string;
  badgeClass: string;
}

const STATUS_CONFIG: StatusConfig[] = [
  {
    id: "pendiente",
    label: "Pendiente",
    icon: AlertCircle,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    headerBg: "border-b-2 border-b-amber-400",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  {
    id: "confirmado",
    label: "Confirmado",
    icon: CheckCircle2,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    headerBg: "border-b-2 border-b-blue-400",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
  },
  {
    id: "en_preparacion",
    label: "En Preparación",
    icon: Package,
    color: "text-orange-500",
    bg: "bg-orange-500/10",
    headerBg: "border-b-2 border-b-orange-400",
    badgeClass: "bg-orange-100 text-orange-800 border-orange-200",
  },
  {
    id: "listo",
    label: "Listo para Entrega",
    icon: Truck,
    color: "text-[#74E79C]",
    bg: "bg-[#74E79C]/15",
    headerBg: "border-b-2 border-b-[#74E79C]",
    badgeClass: "bg-[#74E79C]/20 text-[#1A3E35] border-[#74E79C]/40",
  },
  {
    id: "entregado",
    label: "Entregado",
    icon: CheckCircle2,
    color: "text-[#1A3E35]",
    bg: "bg-[#1A3E35]/10",
    headerBg: "border-b-2 border-b-[#1A3E35]",
    badgeClass: "bg-[#1A3E35]/10 text-[#1A3E35] border-[#1A3E35]/20",
  },
  {
    id: "cancelado",
    label: "Cancelado",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    headerBg: "border-b-2 border-b-red-400",
    badgeClass: "bg-red-100 text-red-800 border-red-200",
  },
];

const STATUS_MAP = Object.fromEntries(STATUS_CONFIG.map((s) => [s.id, s]));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shortId(id: string) {
  return id.split("-")[0].toUpperCase();
}

function customerDisplay(order: Order) {
  return order.customer?.name || order.customer?.phone_number || "Cliente";
}

function timeAgo(dateStr: string) {
  try {
    return formatDistanceToNow(new Date(dateStr), {
      addSuffix: true,
      locale: es,
    });
  } catch {
    return "";
  }
}

function formatMXN(amount: number) {
  return `$${Number(amount).toFixed(2)} MXN`;
}

function truncate(str: string | undefined, len: number) {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "..." : str;
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function KanbanSkeleton() {
  return (
    <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col w-72 md:w-80 shrink-0 bg-muted/30 rounded-2xl border border-border/60 overflow-hidden"
        >
          <div className="p-4 border-b border-border bg-background">
            <Skeleton className="h-5 w-28" />
          </div>
          <div className="p-3 space-y-3">
            {Array.from({ length: 2 }).map((_, j) => (
              <Skeleton key={j} className="h-36 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Order Card (Kanban)
// ---------------------------------------------------------------------------

function OrderCard({
  order,
  onStatusChange,
  onClick,
  productLabel,
  itemsPluralLower,
}: {
  order: Order;
  onStatusChange: (id: string, status: string) => void;
  onClick: (order: Order) => void;
  productLabel: string;
  itemsPluralLower: string;
}) {
  const itemCount = order.items?.length || 0;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className="shadow-sm border-border hover:shadow-md hover:border-[#74E79C]/50 transition-all cursor-pointer group"
        onClick={() => onClick(order)}
      >
        <CardHeader className="p-3 pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm font-bold tracking-wide text-[#1A3E35]">
              #{shortId(order.id)}
            </CardTitle>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo(order.created_at)}
            </span>
          </div>
          <CardDescription className="text-foreground font-medium text-sm mt-0.5">
            {customerDisplay(order)}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-3 pt-0 space-y-2">
          {/* Summary row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShoppingCart className="h-3 w-3" />
              {itemCount}{" "}
              {itemCount === 1 ? productLabel.toLowerCase() : itemsPluralLower}
            </span>
            <span className="font-bold text-sm text-foreground">
              {formatMXN(order.total)}
            </span>
          </div>

          {/* Address */}
          {order.delivery_address && (
            <div className="flex items-start gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
              <span>{truncate(order.delivery_address, 50)}</span>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <p className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-500/10 p-1.5 rounded border border-amber-500/20 line-clamp-2">
              {order.notes}
            </p>
          )}

          {/* Status change dropdown */}
          <div onClick={(e) => e.stopPropagation()}>
            <Select
              defaultValue={order.status}
              onValueChange={(val) => onStatusChange(order.id, val)}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Mover a..." />
              </SelectTrigger>
              <SelectContent>
                {STATUS_CONFIG.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Order Detail Dialog
// ---------------------------------------------------------------------------

function OrderDetailDialog({
  order,
  open,
  onOpenChange,
  onStatusChange,
  itemsPlural,
  productLabel,
}: {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (id: string, status: string) => void;
  itemsPlural: string;
  productLabel: string;
}) {
  if (!order) return null;

  const status = STATUS_MAP[order.status as StatusId];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A3E35]">
            Pedido #{shortId(order.id)}
            {status && (
              <Badge className={status.badgeClass}>{status.label}</Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs font-mono text-muted-foreground">
            {order.id}
          </DialogDescription>
        </DialogHeader>

        {/* Customer info */}
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-foreground">Cliente</h4>
          <p className="text-sm">{order.customer?.name || "Sin nombre"}</p>
          {order.customer?.phone_number && (
            <p className="text-xs text-muted-foreground">
              {order.customer.phone_number}
            </p>
          )}
        </div>

        {/* Delivery address */}
        {order.delivery_address && (
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">
              Dirección de entrega
            </h4>
            <p className="text-sm text-muted-foreground flex items-start gap-1">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
              {order.delivery_address}
            </p>
          </div>
        )}

        <Separator />

        {/* Items */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">{itemsPlural}</h4>
          <div className="bg-muted/40 rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{productLabel}</TableHead>
                  <TableHead className="text-xs text-center">Cant.</TableHead>
                  <TableHead className="text-xs text-right">
                    P. Unit.
                  </TableHead>
                  <TableHead className="text-xs text-right">
                    Subtotal
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm font-medium">
                      {item.product_name}
                    </TableCell>
                    <TableCell className="text-sm text-center">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-sm text-right">
                      ${Number(item.unit_price).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm text-right font-medium">
                      ${Number(item.subtotal).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="border-t px-3 py-2 flex justify-between items-center">
              <span className="text-sm font-bold">Total</span>
              <span className="text-base font-bold text-[#1A3E35]">
                {formatMXN(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">Notas</h4>
            <p className="text-sm text-muted-foreground bg-amber-500/10 border border-amber-500/20 rounded p-2">
              {order.notes}
            </p>
          </div>
        )}

        {/* Dates */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Creado:{" "}
            {format(new Date(order.created_at), "dd MMM yyyy HH:mm", {
              locale: es,
            })}
          </span>
          <span>
            Actualizado:{" "}
            {format(new Date(order.updated_at), "dd MMM yyyy HH:mm", {
              locale: es,
            })}
          </span>
        </div>

        <Separator />

        {/* Status change */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-foreground">
            Cambiar estado
          </h4>
          <Select
            defaultValue={order.status}
            onValueChange={(val) => {
              onStatusChange(order.id, val);
              onOpenChange(false);
            }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Seleccionar estado..." />
            </SelectTrigger>
            <SelectContent>
              {STATUS_CONFIG.map((s) => {
                const Icon = s.icon;
                return (
                  <SelectItem key={s.id} value={s.id}>
                    <span className="flex items-center gap-2">
                      <Icon className={`h-3.5 w-3.5 ${s.color}`} />
                      {s.label}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Table View
// ---------------------------------------------------------------------------

function SortButton({
  field,
  activeField,
  onSort,
  children,
}: {
  field: string;
  activeField: string;
  onSort: (key: string) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={() => onSort(field)}
    >
      {children}
      <ArrowUpDown
        className={`h-3 w-3 ${activeField === field ? "text-[#1A3E35]" : "opacity-40"}`}
      />
    </button>
  );
}

function OrdersTableView({
  orders,
  onStatusChange,
  onOrderClick,
  sortKey,
  onSort,
  itemsPlural,
}: {
  orders: Order[];
  onStatusChange: (id: string, status: string) => void;
  onOrderClick: (order: Order) => void;
  sortKey: string;
  onSort: (key: string) => void;
  itemsPlural: string;
}) {
  return (
    <div className="flex-1 overflow-auto rounded-2xl border border-border/60 bg-background">
      <div className="min-w-[600px]">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30">
            <TableHead>ID</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>
              <SortButton field="total" activeField={sortKey} onSort={onSort}>
                Total
              </SortButton>
            </TableHead>
            <TableHead>{itemsPlural}</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>
              <SortButton field="date" activeField={sortKey} onSort={onSort}>
                Fecha
              </SortButton>
            </TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10">
                <div className="text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay pedidos</p>
                </div>
              </TableCell>
            </TableRow>
          )}
          {orders.map((order) => {
            const status = STATUS_MAP[order.status as StatusId];
            return (
              <TableRow
                key={order.id}
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => onOrderClick(order)}
              >
                <TableCell className="font-mono font-bold text-sm text-[#1A3E35]">
                  #{shortId(order.id)}
                </TableCell>
                <TableCell className="text-sm">
                  {customerDisplay(order)}
                </TableCell>
                <TableCell className="text-sm font-medium">
                  {formatMXN(order.total)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {order.items?.length || 0}
                </TableCell>
                <TableCell>
                  {status && (
                    <Badge className={`${status.badgeClass} text-xs`}>
                      {status.label}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {format(new Date(order.created_at), "dd MMM HH:mm", {
                    locale: es,
                  })}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => onOrderClick(order)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Select
                      defaultValue={order.status}
                      onValueChange={(val) => onStatusChange(order.id, val)}
                    >
                      <SelectTrigger className="h-7 w-[140px] text-xs">
                        <SelectValue placeholder="Estado..." />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_CONFIG.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function OrdersPage() {
  const { data: session } = useSession();
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const sessionBusinessPhoneId = getSessionBusinessPhoneId(session);
  const { industriesMap } = useIndustries();

  const { data: settingsRes } = useSWR<BusinessSettings | { data: BusinessSettings }>(
    session ? endpoints.business.settings : null,
    fetcher,
  );
  const settings: BusinessSettings =
    (settingsRes as { data: BusinessSettings } | null)?.data ??
    (settingsRes as BusinessSettings | null) ??
    {};
  const industryConfig = useMemo(
    () => getIndustryConfig(settings.type, industriesMap),
    [settings.type, industriesMap],
  );
  const productLabel = industryConfig.productLabel;
  const itemsPlural = pluralProductLabel(productLabel);
  const itemsPluralLower = itemsPlural.toLowerCase();

  const swrKey = session && sessionBusinessPhoneId
    ? endpoints.orders.list
    : null;

  const {
    data: response,
    isLoading,
    mutate,
  } = useSWR<ApiList<Order>>(swrKey, {
    refreshInterval: 30000,
  });

  const orders = useMemo(() => response?.data ?? [], [response]);

  // Sort orders for table view
  const sortedOrders = [...orders].sort((a, b) => {
    if (sortKey === "date") {
      const diff =
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortDir === "asc" ? diff : -diff;
    }
    if (sortKey === "total") {
      const diff = Number(a.total) - Number(b.total);
      return sortDir === "asc" ? diff : -diff;
    }
    return 0;
  });

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await mutate();
    setIsRefreshing(false);
  }, [mutate]);

  const handleStatusChange = useCallback(
    async (orderId: string, newStatus: string) => {
      try {
        const optimisticOrders = orders.map((o) =>
          o.id === orderId ? { ...o, status: newStatus } : o
        );
        mutate(
          { ...(response ?? { data: [] }), data: optimisticOrders },
          { revalidate: false }
        );

        await apiClient.patch(
          endpoints.orders.updateStatus(orderId),
          { status: newStatus }
        );

        mutate();
      } catch (error) {
        console.error("Error al actualizar estado del pedido:", error);
        mutate();
      }
    },
    [orders, response, mutate]
  );

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
    setDialogOpen(true);
  };

  const totalOrders = orders.length;

  return (
    <div className="flex flex-col min-h-[calc(100dvh-8rem)]">
      {/* Header */}
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
              Pedidos
            </h1>
            <Badge
              variant="secondary"
              className="bg-accent/20 text-brand-forest border-accent/40"
            >
              {totalOrders}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            Sincronizando con WhatsApp
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-muted rounded-lg p-0.5">
            <Button
              variant={view === "kanban" ? "default" : "ghost"}
              size="sm"
              className={`h-7 px-2.5 ${
                view === "kanban"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : ""
              }`}
              onClick={() => setView("kanban")}
            >
              <LayoutGrid className="h-3.5 w-3.5 mr-1" />
              Kanban
            </Button>
            <Button
              variant={view === "table" ? "default" : "ghost"}
              size="sm"
              className={`h-7 px-2.5 ${
                view === "table"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : ""
              }`}
              onClick={() => setView("table")}
            >
              <List className="h-3.5 w-3.5 mr-1" />
              Tabla
            </Button>
          </div>

          {/* Refresh */}
          <Button
            variant="outline"
            size="sm"
            className="h-7"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <KanbanSkeleton />
      ) : view === "kanban" ? (
        /* --------- KANBAN VIEW --------- */
        <div className="flex-1 flex gap-4 overflow-x-auto pb-4">
          {STATUS_CONFIG.map((column) => {
            const columnOrders = orders.filter(
              (o) => o.status === column.id
            );
            const Icon = column.icon;

            return (
              <div
                key={column.id}
                className="flex flex-col w-72 md:w-80 shrink-0 bg-muted/30 rounded-2xl border border-border/60 overflow-hidden"
              >
                {/* Column header */}
                <div
                  className={`p-3 border-b border-border ${column.headerBg} bg-background flex justify-between items-center`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-md ${column.bg}`}>
                      <Icon className={`h-4 w-4 ${column.color}`} />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground">
                      {column.label}
                    </h3>
                  </div>
                  <span className="bg-muted text-muted-foreground text-xs font-medium px-2 py-0.5 rounded-full">
                    {columnOrders.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                  <AnimatePresence mode="popLayout">
                    {columnOrders.map((order) => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        onStatusChange={handleStatusChange}
                        onClick={handleOrderClick}
                        productLabel={productLabel}
                        itemsPluralLower={itemsPluralLower}
                      />
                    ))}
                  </AnimatePresence>

                  {columnOrders.length === 0 && (
                    <div className="h-full min-h-[120px] flex flex-col items-center justify-center text-center text-muted-foreground/40 py-8">
                      <Icon className="h-8 w-8 mb-2 opacity-20" />
                      <p className="text-xs">No hay pedidos</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* --------- TABLE VIEW --------- */
          <OrdersTableView
            orders={sortedOrders}
            onStatusChange={handleStatusChange}
            onOrderClick={handleOrderClick}
            sortKey={sortKey}
            onSort={handleSort}
            itemsPlural={itemsPlural}
          />
      )}

      {/* Detail dialog */}
      <OrderDetailDialog
        order={selectedOrder}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onStatusChange={handleStatusChange}
        itemsPlural={itemsPlural}
        productLabel={productLabel}
      />
    </div>
  );
}
