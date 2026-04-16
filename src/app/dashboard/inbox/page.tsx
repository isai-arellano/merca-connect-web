"use client";

import { useState } from "react";
import useSWR from "swr";
import { endpoints } from "@/lib/api";
import { ConversationList } from "@/components/inbox/ConversationList";
import { ChatWindow } from "@/components/inbox/ChatWindow";
import { Loader2, ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { fetcher } from "@/lib/api-client";
import { getSessionBusinessPhoneId } from "@/lib/business";
import { Button } from "@/components/ui/button";
import { type ApiList, type ConversationSummary } from "@/types/api";

export default function InboxPage() {
    const { data: session } = useSession();
    const sessionBusinessPhoneId = getSessionBusinessPhoneId(session);
    const [selectedConv, setSelectedConv] = useState<string | null>(null);

    const { data: convData, error, isLoading } = useSWR<ApiList<ConversationSummary>>(
        session && sessionBusinessPhoneId ? endpoints.conversations.list : null,
        fetcher,
        { refreshInterval: 10000 }
    );

    return (
        <div className="inbox-fullbleed h-full flex overflow-hidden rounded-2xl">
            {/* List Sidebar — oculto en móvil cuando hay conv seleccionada */}
            <div
                className={`
                    flex flex-col h-full border-r border-border/60 bg-white
                    w-full md:w-[300px] md:min-w-[260px] md:max-w-[320px] shrink-0
                    ${selectedConv ? "hidden md:flex" : "flex"}
                `}
            >
                <div className="px-4 py-4 border-b border-border/60">
                    <h2 className="font-semibold text-base flex items-center gap-2 tracking-tight">
                        Inbox
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Conversaciones por WhatsApp
                    </p>
                </div>
                <div className="flex-1 overflow-hidden">
                    {error ? (
                        <div className="p-4 text-sm text-destructive text-center">Error al cargar conversaciones</div>
                    ) : (
                        <ConversationList
                            conversations={convData?.data ?? []}
                            selectedId={selectedConv}
                            onSelect={setSelectedConv}
                        />
                    )}
                </div>
            </div>

            {/* Chat area */}
            <div
                className={`
                    flex-1 h-full w-full flex flex-col overflow-hidden
                    ${selectedConv ? "flex" : "hidden md:flex"}
                `}
            >
                {selectedConv ? (
                    <div className="flex flex-col h-full">
                        {/* Back button — solo visible en móvil */}
                        <div className="md:hidden flex items-center gap-2 px-4 py-2 border-b border-border/60 bg-white">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-1.5 text-sm"
                                onClick={() => setSelectedConv(null)}
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Conversaciones
                            </Button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <ChatWindow conversationId={selectedConv} />
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm bg-[#F0F2F5]">
                        <div className="text-center">
                            <div className="w-16 h-16 rounded-full bg-border/30 flex items-center justify-center mx-auto mb-3">
                                <svg className="w-8 h-8 text-muted-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-muted-foreground/70">Selecciona una conversación</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
