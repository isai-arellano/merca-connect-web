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
        <div className="min-h-[calc(100dvh-8rem)] md:min-h-[calc(100dvh-9rem)] border border-border rounded-xl overflow-hidden shadow-sm flex bg-card">
            {/* List Sidebar — oculto en móvil cuando hay conv seleccionada */}
            <div className={`
                flex flex-col h-full border-r border-border bg-muted/20
                w-full md:w-1/3 md:min-w-[280px] md:max-w-[340px]
                ${selectedConv ? "hidden md:flex" : "flex"}
            `}>
                <div className="p-4 border-b border-border bg-background">
                    <h2 className="font-semibold text-base flex items-center gap-2">
                        Inbox
                        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                    </h2>
                </div>
                <div className="flex-1 overflow-hidden">
                    {error ? (
                        <div className="p-4 text-sm text-destructive text-center">Error al cargar conversaciones</div>
                    ) : (
                        <ConversationList
                            conversations={convData?.data || []}
                            selectedId={selectedConv}
                            onSelect={setSelectedConv}
                        />
                    )}
                </div>
            </div>

            {/* Chat area — pantalla completa en móvil cuando hay conv seleccionada */}
            <div className={`
                flex-1 h-full flex flex-col bg-background
                ${selectedConv ? "flex" : "hidden md:flex"}
            `}>
                {selectedConv ? (
                    <div className="flex flex-col h-full">
                        {/* Back button — solo visible en móvil */}
                        <div className="md:hidden flex items-center gap-2 px-4 py-2 border-b border-border bg-background">
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
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                        Selecciona una conversación para empezar
                    </div>
                )}
            </div>
        </div>
    );
}
