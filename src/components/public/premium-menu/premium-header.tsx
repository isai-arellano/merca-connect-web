"use client";

import React, { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ResolvedThemeTokens } from "@/config/catalog-themes";
import { MapPin, Clock, ShoppingBag, Share2, Instagram, Facebook, Globe } from "lucide-react";
import { BusinessInfo } from "@/types/catalog";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PremiumHeaderProps {
  businessName: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  address?: string | null;
  businessInfo?: BusinessInfo | null;
  tokens: ResolvedThemeTokens;
}

const WEEK_DAYS = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

const formatSocialUrl = (type: "instagram" | "facebook" | "tiktok" | "website", value: string) => {
  if (!value) return "";
  let cleanValue = value.trim();
  
  if (type === "website") {
    if (cleanValue.startsWith("http")) return cleanValue;
    return `https://${cleanValue}`;
  }
  
  // If it's already a full URL, return it
  if (cleanValue.startsWith("http")) return cleanValue;
  
  // Otherwise, build the URL from username
  const user = cleanValue.replace(/^@/, "");
  if (type === "instagram") return `https://instagram.com/${user}`;
  if (type === "facebook") return `https://facebook.com/${user}`;
  if (type === "tiktok") return `https://tiktok.com/@${user}`;
  
  return cleanValue;
};

export function PremiumHeader({
  businessName,
  logoUrl,
  bannerUrl,
  address,
  businessInfo,
  tokens,
}: PremiumHeaderProps) {
  const { toast } = useToast();
  const [showSchedule, setShowSchedule] = useState(false);

  const getTodaySchedule = () => {
    if (!businessInfo?.schedule) return null;
    const dayKeys = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
    const todayKey = dayKeys[new Date().getDay()];
    const sched = (businessInfo.schedule as any)[todayKey];
    
    if (!sched || !sched.open) return { open: false, hours: "" };
    
    const from = sched.from || sched.from_ || "";
    const to = sched.to || "";
    return {
      open: true,
      hours: from && to ? `${from} - ${to}` : from || to || "—"
    };
  };

  const handleShare = async () => {
    const shareData = {
      title: businessName,
      text: `¡Echa un vistazo al menú de ${businessName}!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Enlace copiado", description: "Copiado al portapapeles." });
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const sched = getTodaySchedule();

  return (
    <div className="relative">
      {/* Top Banner Area - Taller and more rounded at bottom */}
      <div className="relative h-72 sm:h-[26rem] w-full overflow-hidden bg-muted rounded-b-[3rem] shadow-xl z-10">
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt={businessName}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className={cn("w-full h-full", tokens.pageBackground)} />
        )}
        
        {/* Floating Actions in Banner Area */}
        <div className="absolute top-6 right-6 flex items-center gap-3 z-30">
          {businessInfo?.instagram && (
            <a 
              href={formatSocialUrl("instagram", businessInfo.instagram)} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-all shadow-lg border border-white/10"
            >
              <Instagram className="h-4 w-4" />
            </a>
          )}
          {businessInfo?.facebook && (
            <a 
              href={formatSocialUrl("facebook", businessInfo.facebook)} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-all shadow-lg border border-white/10"
            >
              <Facebook className="h-4 w-4" />
            </a>
          )}
          {businessInfo?.website && (
            <a 
              href={formatSocialUrl("website", businessInfo.website)} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-all shadow-lg border border-white/10"
            >
              <Globe className="h-4 w-4" />
            </a>
          )}
          <button 
            onClick={handleShare}
            className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-all shadow-lg border border-white/10"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Business card area — flat top, sits slightly lower to show the banner curve */}
      <div className="relative -mt-10 w-full z-20">
        <div className="bg-[var(--pub-surface)] px-8 pb-6 pt-0">
          <div className="flex flex-col items-center text-center space-y-6">
            {/* Centered Logo */}
            <div className="relative -mt-20 group">
              <div className="h-32 w-32 rounded-[2.5rem] bg-[var(--pub-surface)] p-2 shadow-2xl transition-transform duration-500 group-hover:scale-105 border border-[var(--pub-border)]">
                <div className="relative h-full w-full overflow-hidden rounded-[1.8rem] border-4 border-[var(--pub-surface)] bg-[var(--pub-surface)]">
                  {logoUrl ? (
                    <Image
                      src={logoUrl}
                      alt={businessName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted/20">
                      <ShoppingBag className="h-10 w-10 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
              </div>
              <div className={cn(
                "absolute -bottom-2 -right-2 h-10 w-10 rounded-full flex items-center justify-center border-4 border-[var(--pub-surface)] shadow-lg",
                sched?.open ? "bg-[var(--pub-accent)]" : "bg-red-500"
              )}>
                <div className="h-3 w-3 rounded-full bg-white/80 animate-ping opacity-75" />
              </div>
            </div>

            <div className="space-y-4 max-w-xl w-full">
              <h1 className={cn("text-3xl sm:text-4xl font-black tracking-tighter leading-tight", tokens.title)}>
                {businessName}
              </h1>
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                {address && (
                  <div className="flex items-center gap-2 opacity-60">
                    <MapPin className="h-3 w-3" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{address}</span>
                  </div>
                )}
                
                <button 
                  onClick={() => setShowSchedule(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--pub-surface-muted)]/40 hover:bg-[var(--pub-surface-muted)] transition-colors group"
                >
                  <Clock className="h-3 w-3 opacity-60" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {sched?.open ? `Hoy: ${sched.hours}` : "Cerrado"}
                  </span>
                  <span className="text-[9px] font-bold opacity-40 ml-2 group-hover:opacity-100 transition-opacity">Ver todos</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <DialogContent className="max-w-xs rounded-[2rem] p-6 border-none shadow-2xl bg-[var(--pub-surface)]" style={tokens.cssVars as React.CSSProperties}>
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase tracking-tighter text-center">Horarios de Atención</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-6">
            {WEEK_DAYS.map((day) => {
              const dayData = (businessInfo?.schedule as any)?.[day.key];
              const from = dayData?.from || dayData?.from_ || "";
              const to = dayData?.to || "";
              const hours = dayData?.open ? `${from} - ${to}` : "Cerrado";
              
              return (
                <div key={day.key} className="flex justify-between items-center py-2 border-b border-muted/50 last:border-0">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{day.label}</span>
                  <span className={cn(
                    "text-xs font-black tabular-nums",
                    dayData?.open ? "text-foreground" : "text-destructive"
                  )}>
                    {hours}
                  </span>
                </div>
              );
            })}
          </div>
          <button 
            onClick={() => setShowSchedule(false)}
            className="mt-6 w-full h-12 rounded-xl bg-[var(--pub-surface-muted)] font-black uppercase text-[10px] tracking-widest hover:bg-[var(--pub-surface-muted)]/80 transition-all"
          >
            Cerrar
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
