"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ResolvedThemeTokens } from "@/config/catalog-themes";
import { motion } from "framer-motion";
import { MapPin, Clock, Info } from "lucide-react";

interface PremiumHeaderProps {
  businessName: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  description?: string | null;
  address?: string | null;
  tokens: ResolvedThemeTokens;
}

export function PremiumHeader({
  businessName,
  logoUrl,
  bannerUrl,
  description,
  address,
  tokens,
}: PremiumHeaderProps) {
  return (
    <header className="relative w-full">
      {/* Banner */}
      <div className="relative h-48 sm:h-64 lg:h-80 w-full overflow-hidden">
        {bannerUrl ? (
          <Image
            src={bannerUrl}
            alt={businessName}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className={cn("w-full h-full", tokens.headerBg)} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Info Card Overlay */}
      <div className="container mx-auto px-4 -mt-16 sm:-mt-20 lg:-mt-24 relative z-10">
        <div className={cn(
          "rounded-3xl p-6 shadow-xl border border-muted/20 flex flex-col sm:flex-row gap-6 items-center sm:items-end",
          tokens.cardBackground
        )}>
          {/* Logo */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative h-24 w-24 sm:h-32 sm:w-32 shrink-0 rounded-2xl overflow-hidden border-4 border-background shadow-lg bg-white"
          >
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={businessName}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <span className="text-2xl font-bold text-muted-foreground">
                  {businessName.charAt(0)}
                </span>
              </div>
            )}
          </motion.div>

          {/* Text Content */}
          <div className="flex-1 text-center sm:text-left space-y-2 pb-2">
            <motion.h1 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={cn("text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight", tokens.title)}
            >
              {businessName}
            </motion.h1>
            
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm font-medium"
            >
              {address && (
                <div className={cn("flex items-center gap-1", tokens.subtitle)}>
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="line-clamp-1">{address}</span>
                </div>
              )}
              <div className={cn("flex items-center gap-1", tokens.subtitle)}>
                <Clock className="h-4 w-4 text-primary" />
                <span>Abierto ahora</span>
              </div>
              <button className={cn("flex items-center gap-1 hover:underline", tokens.accent)}>
                <Info className="h-4 w-4" />
                <span>Más info</span>
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </header>
  );
}
