"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import useSWR from "swr";
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
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { endpoints } from "@/lib/api";
import { fetcher } from "@/lib/api-client";
import { getSessionBusinessPhoneId } from "@/lib/business";
import { getIndustryConfig } from "@/config/industries";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  locked,
  lockReason,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  locked?: boolean;
  lockReason?: string;
}) {
  if (locked) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex items-center gap-3 px-3 py-2 rounded-md font-medium text-sm text-white/30 cursor-not-allowed select-none"
            >
              <Icon className="h-5 w-5" />
              <span className="flex-1">{label}</span>
              <Lock className="h-3.5 w-3.5 opacity-50" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[180px] text-xs">
            {lockReason}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

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
  const sessionBusinessPhoneId = getSessionBusinessPhoneId(session);
  const isAdmin = (session as any)?.role === "admin";

  const { data: settingsData } = useSWR(
    session && sessionBusinessPhoneId ? endpoints.business.settings : null,
    fetcher
  );

  const settings = settingsData || {};
  const businessType: string = settings.type || "abarrotera";
  const industryConfig = getIndustryConfig(businessType);
  const catalogLabel = industryConfig.view === "menu" ? "Menú" : "Catálogo";

  // Estado de onboarding — qué tiene configurado el negocio
  const hasSlug = Boolean(settings.slug);
  const hasName = Boolean(settings.name);
  const hasWhatsApp = Boolean(sessionBusinessPhoneId);
  const hasBasicSetup = hasName && hasSlug;

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
              <NavLink
                href="/dashboard"
                label="Tablero General"
                icon={LayoutDashboard}
                isActive={isActive("/dashboard")}
              />
              <NavLink
                href="/dashboard/inbox"
                label="Inbox"
                icon={MessageSquare}
                isActive={isActive("/dashboard/inbox")}
                locked={!hasWhatsApp}
                lockReason="Conecta tu WhatsApp Business en Configuración → Conectar"
              />
              <NavLink
                href="/dashboard/products"
                label={catalogLabel}
                icon={Package}
                isActive={isActive("/dashboard/products")}
              />
              <NavLink
                href="/dashboard/orders"
                label="Pedidos"
                icon={ShoppingBag}
                isActive={isActive("/dashboard/orders")}
                locked={!hasWhatsApp}
                lockReason="Disponible cuando conectes tu WhatsApp Business"
              />
              <NavLink
                href="/dashboard/customers"
                label="Clientes"
                icon={Users}
                isActive={isActive("/dashboard/customers")}
                locked={!hasWhatsApp}
                lockReason="Disponible cuando conectes tu WhatsApp Business"
              />
            </div>
          </div>

          {/* Administracion */}
          <div>
            <p className="px-3 mb-2 text-xs font-semibold text-white/40 uppercase tracking-wider">
              Administración
            </p>
            <div className="space-y-1">
              <NavLink
                href="/dashboard/templates"
                label="Templates"
                icon={FileText}
                isActive={isActive("/dashboard/templates")}
                locked={!hasWhatsApp}
                lockReason="Disponible cuando conectes tu WhatsApp Business"
              />
              <NavLink
                href="/dashboard/analytics"
                label="Analytics"
                icon={BarChart3}
                isActive={isActive("/dashboard/analytics")}
                locked={!hasBasicSetup}
                lockReason="Completa la configuración básica del negocio primero"
              />
              <NavLink
                href="/dashboard/knowledge"
                label="Conocimiento IA"
                icon={BookOpen}
                isActive={isActive("/dashboard/knowledge")}
                locked={!hasBasicSetup}
                lockReason="Completa la configuración básica del negocio primero"
              />
              <NavLink
                href="/dashboard/settings"
                label="Configuración"
                icon={Settings}
                isActive={isActive("/dashboard/settings")}
              />
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
