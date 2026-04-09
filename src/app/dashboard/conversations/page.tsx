"use client";

import { useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useSWRConfig } from "swr";
import { Search, Send, User, Loader2, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { endpoints } from "@/lib/api";
import { apiClient } from "@/lib/api-client";
import { useSession } from "next-auth/react";
import { getBusinessPhoneId, withBusinessPhoneId } from "@/lib/business";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ConversationMessage {
    id: string;
    content: string;
    created_at: string;
    direction: "inbound" | "outbound";
}

interface ConversationCustomer {
    name?: string | null;
    phone_number?: string | null;
}

interface ConversationSummary {
    id: string;
    customer?: ConversationCustomer | null;
    messages: ConversationMessage[];
}

interface ConversationListResponse {
    data: ConversationSummary[];
}

interface ConversationDetailResponse {
    customer?: ConversationCustomer | null;
    messages: ConversationMessage[];
}

export default function InboxPage() {
    const { data: session } = useSession();
    const businessPhoneId = getBusinessPhoneId(session);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [isSending, setIsSending] = useState(false);

    const { mutate } = useSWRConfig();
    const conversationsUrl = businessPhoneId ? withBusinessPhoneId(endpoints.conversations.list, businessPhoneId) : null;

    const { data: conversationsResponse, isLoading: isLoadingList } = useSWR<ConversationListResponse>(
        session && conversationsUrl ? conversationsUrl : null,
        { refreshInterval: 15000 } // Polling cada 15 segundos para nuevos mensajes
    );
    const conversations = conversationsResponse?.data ?? [];

    const { data: activeConversation, isLoading: isLoadingChat } = useSWR<ConversationDetailResponse>(
        selectedId && session && businessPhoneId
            ? withBusinessPhoneId(endpoints.conversations.detail(selectedId), businessPhoneId)
            : null,
        { refreshInterval: 8000 } // Polling cuando estamos leyendo un chat
    );

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyText.trim() || !selectedId) return;

        setIsSending(true);
        try {
            if (!businessPhoneId) {
                throw new Error("No se pudo identificar el negocio autenticado.");
            }

            await apiClient.post(
                withBusinessPhoneId(endpoints.conversations.reply(selectedId), businessPhoneId),
                { text: replyText }
            );
            setReplyText("");
            mutate(withBusinessPhoneId(endpoints.conversations.detail(selectedId), businessPhoneId));
            if (conversationsUrl) {
                mutate(conversationsUrl);
            }
        } catch (error) {
            console.error("Error al enviar el mensaje:", error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] rounded-xl border border-border bg-background shadow-sm overflow-hidden">
            {/* LEFT SIDEBAR (Inbox List) */}
            <div className="w-80 border-r border-border flex flex-col bg-muted/20">
                <div className="p-4 border-b border-border bg-background">
                    <h2 className="text-xl font-semibold mb-4 text-foreground">Inbox WhatsApp</h2>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar chat..." className="pl-9 bg-background focus-visible:ring-primary" />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    {isLoadingList ? (
                        <div className="flex justify-center p-8 text-muted-foreground"><Loader2 className="animate-spin h-6 w-6" /></div>
                    ) : conversations.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                            <MessageSquare className="mx-auto h-8 w-8 mb-2 opacity-20" />
                            No hay conversaciones activas
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {conversations.map((conv) => {
                                const isActive = selectedId === conv.id;
                                const lastMessage = conv.messages && conv.messages.length > 0
                                    ? conv.messages[conv.messages.length - 1]
                                    : null;

                                return (
                                    <button
                                        key={conv.id}
                                        onClick={() => setSelectedId(conv.id)}
                                        className={`flex items-start gap-4 p-4 text-left transition-colors border-b border-border hover:bg-muted/50 ${isActive ? "bg-primary/5 border-l-4 border-l-primary" : "border-l-4 border-l-transparent"
                                            }`}
                                    >
                                        <Avatar className="h-10 w-10 border border-border">
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {conv.customer?.name ? conv.customer.name.charAt(0).toUpperCase() : <User size={16} />}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h3 className="font-medium text-sm truncate text-foreground pr-2">
                                                    {conv.customer?.name || conv.customer?.phone_number}
                                                </h3>
                                                {lastMessage && (
                                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                        {format(new Date(lastMessage.created_at), 'HH:mm', { locale: es })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {lastMessage ? lastMessage.content : "Inició conversación"}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* RIGHT SIDE (Active Chat) */}
            <div className="flex-1 flex flex-col bg-background relative">
                {!selectedId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
                        <MessageSquare className="h-16 w-16 mb-4 opacity-10" />
                        <p>Selecciona una conversación para comenzar a chatear</p>
                    </div>
                ) : isLoadingChat ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <Loader2 className="animate-spin h-8 w-8" />
                    </div>
                ) : activeConversation ? (
                    <>
                        <div className="h-16 border-b border-border flex items-center px-6 bg-background shrink-0">
                            <Avatar className="h-9 w-9 border border-border mr-3">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    {activeConversation.customer?.name ? activeConversation.customer.name.charAt(0).toUpperCase() : <User size={16} />}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <h2 className="font-semibold text-foreground text-sm">
                                    {activeConversation.customer?.name || "Cliente"}
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    +{activeConversation.customer?.phone_number}
                                </p>
                            </div>
                        </div>

                        {/* Watsapp Background Pattern or just simple color */}
                        <ScrollArea className="flex-1 p-6 bg-zinc-50/50 dark:bg-zinc-950/20">
                            <div className="flex flex-col gap-4">
                                <AnimatePresence initial={false}>
                                    {activeConversation.messages.map((msg) => {
                                        const isInbound = msg.direction === "inbound";
                                        return (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex ${isInbound ? "justify-start" : "justify-end"}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${isInbound
                                                        ? "bg-white dark:bg-zinc-900 border border-border text-foreground rounded-tl-none"
                                                        : "bg-primary text-primary-foreground rounded-tr-none"
                                                        }`}
                                                >
                                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                                    <div className={`text-[10px] mt-1 text-right ${isInbound ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
                                                        {format(new Date(msg.created_at), 'HH:mm')}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </ScrollArea>

                        <div className="p-4 bg-background border-t border-border shrink-0">
                            <form onSubmit={handleSend} className="flex gap-2 relative">
                                <Input
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Escribe un mensaje..."
                                    className="flex-1 bg-muted/50 focus-visible:ring-primary pr-12 rounded-full"
                                    disabled={isSending}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    disabled={isSending || !replyText.trim()}
                                    className="rounded-full absolute right-1 top-1 h-8 w-8 bg-primary text-primary-foreground hover:bg-primary/90"
                                >
                                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-red-500">
                        Error al cargar la conversación
                    </div>
                )}
            </div>
        </div>
    );
}
