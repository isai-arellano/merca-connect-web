"use client";

import Link from "next/link";
import Image from "next/image";
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
  ShieldAlert,
  Lock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { catalogModuleTitle, getIndustryConfig } from "@/config/industries";
import { useIndustries } from "@/hooks/useIndustries";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { createContext, useContext, useState } from "react";
import { useOnboardingState } from "@/hooks/useOnboardingState";

// ─── Context ─────────────────────────────────────────────────────────────────
const SidebarContext = createContext<{ collapsed: boolean; toggle: () => void }>({
  collapsed: false,
  toggle: () => {},
});
export function useSidebar() { return useContext(SidebarContext); }

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed((p) => !p) }}>
      {children}
    </SidebarContext.Provider>
  );
}

// ─── NavLink ─────────────────────────────────────────────────────────────────
function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  locked,
  lockReason,
  collapsed,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  locked?: boolean;
  lockReason?: string;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const content = (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm font-medium select-none w-full",
        collapsed && "justify-center px-2",
        locked
          ? "text-foreground/30 cursor-not-allowed"
          : isActive
          ? "bg-[#1A3E35] text-white shadow-sm"
          : "text-foreground/65 hover:text-foreground hover:bg-primary cursor-pointer"
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          locked && "opacity-40",
          !locked && isActive && "text-white",
          !locked && !isActive && "text-brand-forest/85"
        )}
      />
      {!collapsed && <span className="flex-1 truncate">{label}</span>}
      {!collapsed && locked && <Lock className="h-3 w-3 opacity-40 shrink-0" />}
    </div>
  );

  if (locked) {
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild><div className="w-full">{content}</div></TooltipTrigger>
          <TooltipContent side="right" className="max-w-[200px] text-xs">{lockReason}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (collapsed) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={href} onClick={onClick} className="w-full">{content}</Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return <Link href={href} onClick={onClick} className="w-full">{content}</Link>;
}

// ─── SidebarNav — contenido de navegación (shared) ───────────────────────────
export function SidebarContent({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.role === "admin";

  const { settings, state: onboardingState } = useOnboardingState();
  const { industriesMap } = useIndustries();
  const businessType: string = settings.type || "abarrotera";
  const industryConfig = getIndustryConfig(businessType, industriesMap);
  const catalogLabel = catalogModuleTitle(industryConfig);

  const hasIndustry = Boolean(settings.type);
  const hasWhatsApp = onboardingState.hasWhatsApp;
  const canAccessSettings =
    onboardingState.hasIndustry && onboardingState.hasBusinessProfile;

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const lp = { collapsed, onClick: onNavigate };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <nav className="flex-1 px-3 py-5 space-y-6 overflow-y-auto">
        <div>
          {!collapsed && (
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              Operaciones
            </p>
          )}
          <div className="space-y-0.5">
            <NavLink href="/dashboard" label="Tablero" icon={LayoutDashboard} isActive={isActive("/dashboard")} {...lp} />
            <NavLink href="/dashboard/inbox" label="Inbox" icon={MessageSquare} isActive={isActive("/dashboard/inbox")} locked={!hasWhatsApp} lockReason="Conecta tu WhatsApp Business en Configuración" {...lp} />
            <NavLink
              href="/dashboard/products"
              label={catalogLabel}
              icon={Package}
              isActive={isActive("/dashboard/products")}
              locked={!hasIndustry}
              lockReason="Selecciona tu tipo de negocio en el Tablero para habilitar catálogo/menú"
              {...lp}
            />
            <NavLink href="/dashboard/orders" label="Pedidos" icon={ShoppingBag} isActive={isActive("/dashboard/orders")} locked={!hasWhatsApp} lockReason="Disponible cuando conectes tu WhatsApp Business" {...lp} />
            <NavLink href="/dashboard/customers" label="Clientes" icon={Users} isActive={isActive("/dashboard/customers")} locked={!hasWhatsApp} lockReason="Disponible cuando conectes tu WhatsApp Business" {...lp} />
          </div>
        </div>

        <div>
          {!collapsed && (
            <p className="px-3 mb-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              Administración
            </p>
          )}
          <div className="space-y-0.5">
            <NavLink
              href="/dashboard/analytics"
              label="Analytics"
              icon={BarChart3}
              isActive={isActive("/dashboard/analytics")}
              locked={!hasWhatsApp}
              lockReason="Conecta WhatsApp Business para ver analíticas"
              {...lp}
            />
            <NavLink
              href="/dashboard/settings"
              label="Configuración"
              icon={Settings}
              isActive={isActive("/dashboard/settings")}
              locked={!canAccessSettings}
              lockReason="Completa tipo de negocio, nombre y horario en el Tablero"
              {...lp}
            />
          </div>
        </div>

        {isAdmin && (
          <div>
            {!collapsed && (
              <p className="px-3 mb-1.5 text-[10px] font-semibold text-amber-700/70 uppercase tracking-widest">
                Sistema
              </p>
            )}
            <div className="space-y-0.5">
              <NavLink
                href="/dashboard/templates"
                label="Templates (Meta)"
                icon={FileText}
                isActive={isActive("/dashboard/templates")}
                locked={!hasWhatsApp}
                lockReason="Conecta tu WhatsApp Business en Configuración"
                {...lp}
              />
              <NavLink href="/dashboard/admin" label="Admin" icon={ShieldAlert} isActive={isActive("/dashboard/admin")} {...lp} />
            </div>
          </div>
        )}
      </nav>

      <div className="px-4 py-3 border-t border-border/70 shrink-0">
        {collapsed ? (
          <div className="mx-auto relative h-8 w-8">
            <Image
              src="/images/isologo-principal.webp"
              alt="MercaConnect"
              fill
              sizes="32px"
              className="object-contain"
            />
          </div>
        ) : (
          <div className="space-y-0.5">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Merca Connect</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar desktop ──────────────────────────────────────────────────────────
export function Sidebar() {
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed top-4 bottom-4 left-4 z-30 hidden md:flex flex-col rounded-2xl",
        "bg-[#F7F7F7] border border-border/80 shadow-sm",
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-[76px]" : "w-64"
      )}
    >
      {/* Logo + toggle */}
      <div className={cn(
        "h-16 flex items-center shrink-0 border-b border-border/80 px-4",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <div className="relative h-8 w-36">
            <Image
              src="/images/isologo-principal.webp"
              alt="MercaConnect"
              fill
              sizes="144px"
              className="object-contain object-left"
              priority
            />
          </div>
        )}
        <button
          onClick={toggle}
          className={cn(
            "h-7 w-7 rounded-lg flex items-center justify-center",
            "text-muted-foreground hover:text-brand-forest hover:bg-brand-mint transition-colors shrink-0"
          )}
          aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-hidden">
        <SidebarContent collapsed={collapsed} />
      </div>
    </aside>
  );
}
