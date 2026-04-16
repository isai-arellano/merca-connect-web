"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { type ConversationSummary } from "@/types/api";

interface ConversationListProps {
    conversations: ConversationSummary[];
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
            <div className="flex flex-col gap-2 p-3">
                {conversations.map((conv) => {
                    const lastMessage = conv.last_message || conv.messages?.[conv.messages.length - 1];
                    return (
                        <button
                            key={conv.id}
                            onClick={() => onSelect(conv.id)}
                            className={`group flex flex-col items-start gap-2 rounded-xl border p-3 text-left text-sm transition-colors hover:bg-muted/40 ${
                                selectedId === conv.id
                                    ? "bg-muted/50 border-border/70"
                                    : "border-transparent hover:border-border/60"
                            }`}
                        >
                            <div className="flex w-full flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <Avatar className="h-9 w-9 ring-1 ring-border/70">
                                            <AvatarImage src={conv.customer?.avatar_url} alt={conv.customer?.name || "Cliente"} />
                                            <AvatarFallback className="bg-primary text-primary-foreground text-[11px]">
                                                {conv.customer?.name?.substring(0,2).toUpperCase() || "C"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <div className="font-medium truncate">{conv.customer?.name || conv.customer?.phone}</div>
                                            <div className="text-[11px] text-muted-foreground truncate">{conv.customer?.phone || ""}</div>
                                        </div>
                                        {conv.agent_enabled === true && conv.status === "handoff" && (
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] px-1.5 py-0 h-4 border-orange-400/40 text-orange-700 bg-orange-500/10"
                                            >
                                                Humano
                                            </Badge>
                                        )}
                                        {conv.agent_enabled === true && conv.status !== "handoff" && (
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] px-1.5 py-0 h-4 border-blue-400/40 text-blue-700 bg-blue-500/10 gap-0.5"
                                            >
                                                <Bot className="h-2.5 w-2.5" />
                                                IA
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground shrink-0">
                                        {conv.updated_at ? formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true, locale: es }) : ""}
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground line-clamp-1 ml-11 group-hover:text-foreground/70 transition-colors">
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
