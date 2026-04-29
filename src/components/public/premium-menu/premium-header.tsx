"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ResolvedThemeTokens } from "@/config/catalog-themes";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Instagram, Facebook, Globe, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface PremiumHeaderProps {
  businessName: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  address?: string | null;
  businessInfo?: any;
  tokens: ResolvedThemeTokens;
}

export function PremiumHeader({
  businessName,
  logoUrl,
  bannerUrl,
  address,
  businessInfo,
  tokens,
}: PremiumHeaderProps) {
  const [showSchedule, setShowSchedule] = React.useState(false);

  const isOpenNow = React.useMemo(() => {
    if (!businessInfo?.schedule) return false;
    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[now.getDay()];
    const sched = businessInfo.schedule[today];
    if (!sched?.open) return false;

    const [hFrom, mFrom] = (sched.from || "09:00").split(':').map(Number);
    const [hTo, mTo] = (sched.to || "20:00").split(':').map(Number);
    
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const fromMin = hFrom * 60 + mFrom;
    const toMin = hTo * 60 + mTo;

    return currentMin >= fromMin && currentMin <= toMin;
  }, [businessInfo?.schedule]);

  const getSocialUrl = (platform: string, value: string) => {
    if (!value) return null;
    if (value.startsWith("http")) return value;
    
    switch (platform) {
      case "instagram": return `https://instagram.com/${value.replace("@", "")}`;
      case "facebook": return `https://facebook.com/${value}`;
      case "tiktok": return `https://tiktok.com/@${value.replace("@", "")}`;
      case "whatsapp": return `https://wa.me/${value.replace(/\D/g, "")}`;
      case "website": return value.startsWith("http") ? value : `https://${value}`;
      default: return value;
    }
  };

  const socialLinks = [
    { icon: Instagram, href: getSocialUrl("instagram", businessInfo?.instagram), label: "Instagram" },
    { icon: Facebook, href: getSocialUrl("facebook", businessInfo?.facebook), label: "Facebook" },
    { icon: MessageCircle, href: getSocialUrl("whatsapp", businessInfo?.whatsapp_social), label: "WhatsApp" },
    { icon: Globe, href: getSocialUrl("website", businessInfo?.website), label: "Website" },
  ].filter(link => link.href);

  return (
    <header className="relative w-full overflow-hidden">
      {/* Banner with Fade Effect */}
      <div className="relative h-64 sm:h-80 lg:h-96 w-full">
        {bannerUrl ? (
          <Image src={bannerUrl} alt={businessName} fill className="object-cover" priority />
        ) : (
          <div className={cn("w-full h-full", tokens.headerBg)} />
        )}
        
        {/* Gradient Overlay for Fade Effect */}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/20 to-transparent" />
        
        {/* Social Icons inside Banner */}
        <div className="absolute top-6 right-6 flex gap-2">
          {socialLinks.map((social, i) => (
            <a
              key={i}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 w-10 rounded-full bg-black/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/40 transition-all hover:scale-110"
              title={social.label}
            >
              <social.icon className="h-4 w-4" />
            </a>
          ))}
        </div>
      </div>

      {/* Centered Business Info - Floating over fade */}
      <div className="relative -mt-36 pb-12 px-6 flex flex-col items-center text-center z-20">
        {/* Logo Container */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative h-32 w-32 sm:h-40 sm:w-40 rounded-[2.5rem] overflow-hidden bg-white border-8 border-white shadow-2xl mb-8"
        >
          {logoUrl ? (
            <div className="relative w-full h-full rounded-2xl overflow-hidden">
              <Image src={logoUrl} alt={businessName} fill className="object-contain" />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-muted rounded-2xl">
              <span className="text-3xl font-black text-muted-foreground">{businessName.charAt(0)}</span>
            </div>
          )}
        </motion.div>

        <div className="max-w-2xl space-y-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-2"
          >
            <h1 className={cn("text-4xl sm:text-5xl lg:text-7xl font-black tracking-tighter leading-tight", tokens.title)}>
              {businessName}
            </h1>
            {businessInfo?.description && (
              <p className={cn("text-sm sm:text-base opacity-60 font-medium line-clamp-2", tokens.subtitle)}>
                {businessInfo.description}
              </p>
            )}
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-wrap justify-center gap-6 text-sm font-bold"
          >
            {address && (
              <div className={cn("flex items-center gap-2", tokens.subtitle)}>
                <MapPin className="h-4 w-4 text-primary" />
                <span>{address}</span>
              </div>
            )}
            
            <button 
              onClick={() => setShowSchedule(true)}
              className={cn("flex items-center gap-3 transition-colors hover:text-primary", tokens.subtitle)}
            >
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-muted/50 shadow-sm">
                <div className={cn("h-2 w-2 rounded-full", isOpenNow ? "bg-green-500 animate-pulse" : "bg-red-500")} />
                <span className={cn("text-[10px] font-black uppercase tracking-widest", isOpenNow ? "text-green-600" : "text-red-600")}>
                  {isOpenNow ? "Abierto" : "Cerrado"}
                </span>
                <span className="text-[10px] text-muted-foreground ml-1">Ver horarios</span>
              </div>
            </button>
          </motion.div>
        </div>
      </div>

      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <DialogContent className="max-w-md rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className={cn("text-2xl font-black mb-4", tokens.title)}>Horarios de Atención</DialogTitle>
            <DialogDescription>Consulta los días y horas en que estamos abiertos para servirte.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {businessInfo?.schedule ? (
              Object.entries(businessInfo.schedule).map(([day, sched]: [string, any]) => (
                <div key={day} className="flex justify-between items-center py-2 border-b border-muted/40 last:border-0">
                  <span className="font-bold capitalize">{day.replace("monday", "Lunes").replace("tuesday", "Martes").replace("wednesday", "Miércoles").replace("thursday", "Jueves").replace("friday", "Viernes").replace("saturday", "Sábado").replace("sunday", "Domingo")}</span>
                  <span className={cn("text-sm font-medium", sched?.open ? "text-primary" : "text-muted-foreground")}>
                    {sched?.open ? `${sched.from || "09:00"} - ${sched.to || "20:00"}` : "Cerrado"}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center py-4 opacity-60">No hay horarios configurados.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
