"use client";

import { useState } from "react";
import useSWR from "swr";
import { endpoints } from "@/lib/api";
import { ConversationList } from "@/components/inbox/ConversationList";
import { ChatWindow } from "@/components/inbox/ChatWindow";
import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { fetcher } from "@/lib/api-client";
import { getSessionBusinessPhoneId } from "@/lib/business";

export default function InboxPage() {
    const { data: session } = useSession();
    const sessionBusinessPhoneId = getSessionBusinessPhoneId(session);
    const [selectedConv, setSelectedConv] = useState<string | null>(null);

    const { data: convData, error, isLoading } = useSWR(
        session && sessionBusinessPhoneId ? endpoints.conversations.list : null,
        fetcher,
        { refreshInterval: 10000 }
    );

    return (
        <div className="h-[calc(100vh-8rem)] border border-border rounded-xl overflow-hidden shadow-sm flex bg-white dark:bg-card">
            {/* List Sidebar */}
            <div className="w-1/3 min-w-[300px] border-r border-border flex flex-col h-full bg-[#EEFAEE]/50 dark:bg-secondary/50">
                <div className="p-4 border-b border-border bg-[#EEFAEE] dark:bg-secondary">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        Inbox
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </h2>
                </div>
                <div className="flex-1 overflow-hidden">
                    {error ? (
                        <div className="p-4 text-sm text-red-500 text-center">Error al cargar conversaciones</div>
                    ) : (
                        <ConversationList
                            conversations={convData?.data || []}
                            selectedId={selectedConv}
                            onSelect={setSelectedConv}
                        />
                    )}
                </div>
            </div>

            <div className="flex-1 h-full flex flex-col bg-[#EEFAEE] dark:bg-secondary">
                {selectedConv ? (
                    <ChatWindow conversationId={selectedConv} />
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        Selecciona una conversación para empezar
                    </div>
                )}
            </div>
        </div>
    );
}
