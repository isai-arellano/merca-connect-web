"use client";

import useSWR from "swr";
import { useSession } from "next-auth/react";
import { endpoints } from "@/lib/api";
import { apiClient, fetcher } from "@/lib/api-client";

export interface HandoffNotification {
    id: string;
    customer_name: string | null;
    customer_phone: string | null;
    updated_at: string | null;
}

export function useHandoffNotifications() {
    const { data: session } = useSession();
    const { data, mutate, isLoading } = useSWR<HandoffNotification[] | { data: HandoffNotification[] }>(
        session ? endpoints.conversations.handoffNotifications : null,
        fetcher,
        { refreshInterval: 15000 }
    );

    const notifications: HandoffNotification[] = Array.isArray(data)
        ? data
        : ((data as { data: HandoffNotification[] } | null)?.data ?? []);

    const markAsAttended = async (conversationId: string) => {
        await apiClient.patch(endpoints.conversations.handoff(conversationId), { status: "ai_active" });
        await mutate();
    };

    return {
        notifications,
        count: notifications.length,
        isLoading,
        markAsAttended,
        mutate,
    };
}
