"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ConversationListItemMessage {
    content?: string;
}

interface ConversationListItemCustomer {
    name?: string | null;
    phone?: string | null;
}

interface ConversationListItem {
    id: string;
    customer?: ConversationListItemCustomer | null;
    last_message?: ConversationListItemMessage | null;
    messages?: ConversationListItemMessage[];
    agent_enabled?: boolean;
    status: string;
    updated_at?: string | null;
}

interface ConversationListProps {
    conversations: ConversationListItem[];
    selectedId: string | null;
    onSelect: (id: string) => void;
}

export function ConversationList({ conversations, selectedId, onSelect }: ConversationListProps) {
    if (!conversations || conversations.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                No hay conversaciones activas
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="flex flex-col gap-2 p-4">
                {conversations.map((conv) => {
                    const lastMessage = conv.last_message || conv.messages?.[conv.messages.length - 1];
                    return (
                        <button
                            key={conv.id}
                            onClick={() => onSelect(conv.id)}
                            className={`flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-[#74E79C]/5 ${
                                selectedId === conv.id
                                    ? "bg-[#74E79C]/10 border-[#74E79C] dark:bg-[#74E79C]/10 dark:border-[#74E79C]"
                                    : "border-transparent hover:border-border"
                            }`}
                        >
                            <div className="flex w-full flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="bg-[#1A3E35] text-white text-xs">
                                                {conv.customer?.name?.substring(0,2).toUpperCase() || "C"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="font-semibold">{conv.customer?.name || conv.customer?.phone}</div>
                                        {conv.agent_enabled === true && conv.status === "handoff" && (
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] px-1.5 py-0 h-4 border-orange-400 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10"
                                            >
                                                Humano
                                            </Badge>
                                        )}
                                        {conv.agent_enabled === true && conv.status !== "handoff" && (
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] px-1.5 py-0 h-4 border-blue-400 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 gap-0.5"
                                            >
                                                <Bot className="h-2.5 w-2.5" />
                                                IA
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        {conv.updated_at ? formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true, locale: es }) : ""}
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground line-clamp-1 ml-10">
                                    {lastMessage?.content || conv.status.toUpperCase()}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </ScrollArea>
    );
}
