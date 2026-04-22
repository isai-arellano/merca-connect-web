"use client";

import { useMemo } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { endpoints } from "@/lib/api";
import { fetcher } from "@/lib/api-client";
import { type BusinessSettings, type DashboardStats, type SignupStatus } from "@/types/api";
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

  const { data: settingsData, isLoading: settingsLoading } = useSWR<
    BusinessSettings | { data: BusinessSettings }
  >(session ? endpoints.business.settings : null, fetcher);

  const { data: signupStatusRaw, isLoading: signupStatusLoading } = useSWR<
    SignupStatus | { data: SignupStatus }
  >(session ? endpoints.business.whatsappSignupStatus : null, fetcher);

  const { data: statsRaw, isLoading: statsLoading } = useSWR<DashboardStats>(
    session ? endpoints.dashboard.stats : null,
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
  const signupStatus: SignupStatus =
    (signupStatusRaw as { data: SignupStatus } | null)?.data ??
    (signupStatusRaw as SignupStatus | null) ??
    { connected: false };

  const state = useMemo(
    () =>
      computeOnboardingState({
        settings,
        activeProducts: stats?.active_products ?? 0,
        hasWhatsAppConnected: signupStatus.connected === true,
      }),
    [settings, stats?.active_products, signupStatus.connected]
  );

  return {
    settings,
    stats,
    state,
    isLoading: settingsLoading || statsLoading || signupStatusLoading,
  };
}
