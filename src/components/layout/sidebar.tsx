"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  BookOpen,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

const operacionesLinks = [
  { href: "/dashboard", label: "Tablero General", icon: LayoutDashboard },
  { href: "/dashboard/inbox", label: "Inbox", icon: MessageSquare },
  { href: "/dashboard/orders", label: "Pedidos", icon: ShoppingBag },
  { href: "/dashboard/products", label: "Catálogo", icon: Package },
  { href: "/dashboard/customers", label: "Clientes", icon: Users },
];

const adminLinks = [
  { href: "/dashboard/templates", label: "Templates", icon: FileText },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/knowledge", label: "Conocimiento IA", icon: BookOpen },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md transition-colors font-medium text-sm",
        isActive
          ? "bg-[#74E79C]/20 text-[#74E79C]"
          : "text-white/70 hover:text-white hover:bg-white/10"
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = (session as any)?.role === "admin";

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-[#1A3E35] h-screen fixed top-0 left-0 pt-16 hidden md:block z-10">
      <div className="flex flex-col h-full py-6 px-4">
        <nav className="flex-1 space-y-6">
          {/* Operaciones */}
          <div>
            <p className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
              Operaciones
            </p>
            <div className="space-y-1">
              {operacionesLinks.map((link) => (
                <NavLink
                  key={link.href}
                  {...link}
                  isActive={isActive(link.href)}
                />
              ))}
            </div>
          </div>

          {/* Administracion */}
          <div>
            <p className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
              Administración
            </p>
            <div className="space-y-1">
              {adminLinks.map((link) => (
                <NavLink
                  key={link.href}
                  {...link}
                  isActive={isActive(link.href)}
                />
              ))}
            </div>
          </div>
          {/* Sistema — solo admin */}
          {isAdmin && (
            <div>
              <p className="px-3 mb-2 text-xs font-semibold text-amber-400/60 uppercase tracking-wider">
                Sistema
              </p>
              <div className="space-y-1">
                <NavLink
                  href="/dashboard/admin"
                  label="Clientes"
                  icon={ShieldAlert}
                  isActive={isActive("/dashboard/admin")}
                />
              </div>
            </div>
          )}
        </nav>

        <div className="pt-6 border-t border-white/10">
          <div className="px-3 py-2">
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider">
              Merca Connect
            </p>
            <p className="text-xs text-white/30 mt-1">v0.1.0-alpha</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
