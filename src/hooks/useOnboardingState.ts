"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { endpoints } from "@/lib/api";
import { fetcher } from "@/lib/api-client";
import { getSessionBusinessPhoneId } from "@/lib/business";
import { type BusinessSettings, type DashboardStats } from "@/types/api";
import {
  computeOnboardingState,
  type OnboardingSettingsLike,
  type OnboardingState,
} from "@/lib/onboarding";

export function useOnboardingState(): {
  settings: OnboardingSettingsLike;
  stats: DashboardStats | undefined;
  state: OnboardingState;
  isLoading: boolean;
} {
  const { data: session } = useSession();
  const sessionBusinessPhoneId = getSessionBusinessPhoneId(session);

  const { data: settingsData, isLoading: settingsLoading } = useSWR<
    BusinessSettings | { data: BusinessSettings }
  >(session ? endpoints.business.settings : null, fetcher);

  const { data: statsRaw, isLoading: statsLoading } = useSWR<DashboardStats>(
    session && sessionBusinessPhoneId ? endpoints.dashboard.stats : null,
    fetcher
  );

  const settings = useMemo<OnboardingSettingsLike>(
    () =>
      (settingsData as { data: BusinessSettings } | null)?.data ??
      (settingsData as BusinessSettings | null) ??
      {},
    [settingsData]
  );

  const stats = statsRaw;

  const state = useMemo(
    () =>
      computeOnboardingState({
        settings,
        activeProducts: stats?.active_products ?? 0,
        hasWhatsAppSession: Boolean(sessionBusinessPhoneId),
      }),
    [settings, stats?.active_products, sessionBusinessPhoneId]
  );

  return {
    settings,
    stats,
    state,
    isLoading: settingsLoading || statsLoading,
  };
}
