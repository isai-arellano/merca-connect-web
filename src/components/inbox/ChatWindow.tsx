"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { endpoints } from "@/lib/api";
import { apiClient, fetcher } from "@/lib/api-client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Send, FileText, Check, Download, Image as ImageIcon, Bot, UserCheck, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface ChatWindowProps {
    conversationId: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    APPROVED: { label: "Aprobado", variant: "default" },
    approved: { label: "Aprobado", variant: "default" },
    PENDING: { label: "Pendiente", variant: "secondary" },
    pending: { label: "Pendiente", variant: "secondary" },
    REJECTED: { label: "Rechazado", variant: "destructive" },
    rejected: { label: "Rechazado", variant: "destructive" },
};

const categoryLabels: Record<string, string> = {
    MARKETING: "Marketing",
    UTILITY: "Utilidad",
    AUTHENTICATION: "Autenticación",
    marketing: "Marketing",
    utility: "Utilidad",
    authentication: "Autenticación",
};

/** Renders the media attachment for a message based on its type */
function MessageMedia({ msg }: { msg: any }) {
    const [expanded, setExpanded] = useState(false);
    const [imgError, setImgError] = useState(false);

    if (!msg.media_id) return null;

    const url = endpoints.media.get(msg.media_id);
    const mimeType = msg.media_mime_type || "";
    const type = msg.message_type;

    if (type === "image" || type === "sticker") {
        const isSticker = type === "sticker";

        if (imgError) {
            return (
                <div className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2">
                    <ImageIcon className="h-5 w-5 opacity-60" />
                    <span className="text-xs opacity-70">Imagen no disponible</span>
                </div>
            );
        }

        return (
            <>
                <img
                    src={url}
                    alt={type}
                    onError={() => setImgError(true)}
                    onClick={() => !isSticker && setExpanded(true)}
                    className={`rounded-xl object-cover ${
                        isSticker
                            ? "w-32 h-32"
                            : "max-w-full max-h-56 cursor-pointer hover:opacity-95 transition-opacity"
                    }`}
                    loading="lazy"
                />
                {expanded && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 cursor-pointer backdrop-blur-sm"
                        onClick={() => setExpanded(false)}
                    >
                        <img
                            src={url}
                            alt="full size"
                            className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl"
                        />
                    </div>
                )}
            </>
        );
    }

    if (type === "video") {
        return (
            <video
                src={url}
                controls
                preload="metadata"
                className="rounded-xl max-w-full max-h-56"
            />
        );
    }

    if (type === "audio") {
        return (
            <audio
                src={url}
                controls
                preload="metadata"
                className="w-full max-w-[240px]"
            />
        );
    }

    if (type === "document") {
        const ext = mimeType.split("/")[1] || "file";
        const filename = `document.${ext}`;
        return (
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-3 py-2 hover:bg-white/20 transition-colors"
            >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20">
                    <FileText className="h-4 w-4" />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{filename}</span>
                    <span className="text-xs opacity-70">{mimeType}</span>
                </div>
                <Download className="h-4 w-4 ml-auto shrink-0 opacity-60" />
            </a>
        );
    }

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm underline opacity-80"
        >
            <ImageIcon className="h-4 w-4" />
            Ver adjunto
        </a>
    );
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
    const [inputValue, setInputValue] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [isTogglingHandoff, setIsTogglingHandoff] = useState(false);
    const [templatePopoverOpen, setTemplatePopoverOpen] = useState(false);
    const [sendingTemplate, setSendingTemplate] = useState<string | null>(null);
    const [sentTemplate, setSentTemplate] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const { data: detailData, error, isLoading, mutate } = useSWR(
        endpoints.conversations.detail(conversationId),
        fetcher,
        { refreshInterval: 8000 }
    );

    const { data: templatesResponse, isLoading: templatesLoading } = useSWR(
        templatePopoverOpen ? endpoints.templates.list : null,
        fetcher
    );

    const templates = templatesResponse?.data || templatesResponse || [];
    const messages = detailData?.messages || [];
    const customerPhone = detailData?.customer?.phone_number;
    const customerName = detailData?.customer?.name || detailData?.customer?.phone_number || "Cliente";
    const initials = customerName.substring(0, 2).toUpperCase();
    const isHandoff = detailData?.status === "handoff";

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);

    // Auto-resize textarea
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
        e.target.style.height = "auto";
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
    };

    const handleSend = async () => {
        if (!inputValue.trim()) return;
        const textToSend = inputValue.trim();
        setInputValue("");
        if (inputRef.current) inputRef.current.style.height = "auto";
        setIsSending(true);
        try {
            const optimisticMsg = {
                id: crypto.randomUUID(),
                direction: "outbound",
                content: textToSend,
                message_type: "text",
                media_id: null,
                created_at: new Date().toISOString(),
            };
            await mutate(
                async (current: any) => {
                    await apiClient.post(endpoints.conversations.reply(conversationId), { text: textToSend });
                    return undefined;
                },
                {
                    optimisticData: (current: any) => ({
                        ...current,
                        messages: [...(current?.messages ?? []), optimisticMsg],
                    }),
                    revalidate: true,
                    populateCache: false,
                    rollbackOnError: true,
                }
            );
        } catch {
            // noop
        } finally {
            setIsSending(false);
        }
    };

    const handleToggleHandoff = async () => {
        const newStatus = isHandoff ? "ai_active" : "handoff";
        setIsTogglingHandoff(true);
        try {
            await apiClient.patch(endpoints.conversations.handoff(conversationId), { status: newStatus });
            mutate();
        } catch {
            // noop
        } finally {
            setIsTogglingHandoff(false);
        }
    };

    const handleSendTemplate = async (templateName: string, language: string) => {
        if (!customerPhone) return;
        setSendingTemplate(templateName);
        try {
            await apiClient.post(endpoints.templates.send, {
                template_name: templateName,
                phone_number: customerPhone,
                language: language || "es_MX",
            });
            setSentTemplate(templateName);
            setTimeout(() => {
                setSentTemplate(null);
                setTemplatePopoverOpen(false);
            }, 1200);
            await mutate();
        } catch {
            // noop
        } finally {
            setSendingTemplate(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-[#F0F2F5]">
                <Loader2 className="h-6 w-6 animate-spin text-[#1A3E35]" />
            </div>
        );
    }

    if (error || !detailData) {
        return (
            <div className="flex h-full items-center justify-center bg-[#F0F2F5] text-red-500 text-sm">
                Error cargando el chat
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-[#F0F2F5]">

            {/* ── Header ── */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white border-b border-border/50 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className="bg-[#1A3E35] text-white text-xs font-semibold">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="font-semibold text-sm truncate leading-tight">{customerName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground truncate">{detailData.customer?.phone_number}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {detailData.agent_enabled && (
                        <Button
                            size="sm"
                            variant={isHandoff ? "default" : "outline"}
                            onClick={handleToggleHandoff}
                            disabled={isTogglingHandoff}
                            className={`h-8 text-xs gap-1.5 ${isHandoff
                                ? "bg-[#1A3E35] hover:bg-[#1A3E35]/90 text-white"
                                : "text-amber-700 border-amber-300 hover:bg-amber-50"
                            }`}
                        >
                            {isTogglingHandoff ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : isHandoff ? (
                                <Bot className="h-3.5 w-3.5" />
                            ) : (
                                <UserCheck className="h-3.5 w-3.5" />
                            )}
                            {isHandoff ? "Devolver al agente" : "Tomar conversación"}
                        </Button>
                    )}
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-medium ${
                        isHandoff
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                    }`}>
                        {isHandoff ? "Atención humana" : detailData.status === "ai_active" ? "Agente IA" : detailData.status}
                    </span>
                </div>
            </div>

            {/* ── Messages ── */}
            <ScrollArea className="flex-1 overflow-hidden">
                <div className="flex flex-col gap-1 px-4 py-4">
                    {messages.map((msg: any, idx: number) => {
                        const isInbound = msg.direction === "inbound";
                        const hasMedia = !!msg.media_id && msg.message_type !== "text";
                        const hasCaption = !!msg.content;
                        const prevMsg = messages[idx - 1];
                        const isFirst = !prevMsg || prevMsg.direction !== msg.direction;

                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isInbound ? "justify-start" : "justify-end"} ${isFirst ? "mt-2" : "mt-0.5"} animate-in fade-in-0 slide-in-from-bottom-1 duration-150`}
                            >
                                <div
                                    className={`max-w-[72%] sm:max-w-[60%] flex flex-col gap-1 text-sm relative ${
                                        isInbound
                                            ? "items-start"
                                            : "items-end"
                                    }`}
                                >
                                    <div className={`flex flex-col gap-1.5 px-3 py-2 shadow-sm ${
                                        isInbound
                                            ? "bg-white text-gray-900 rounded-2xl rounded-tl-sm"
                                            : "bg-[#1A3E35] text-white rounded-2xl rounded-tr-sm"
                                    }`}>
                                        {hasMedia && <MessageMedia msg={msg} />}
                                        {hasCaption && (
                                            <span className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed">
                                                {msg.content}
                                            </span>
                                        )}
                                        {!hasMedia && !hasCaption && (
                                            <span className="italic opacity-50 text-xs">Mensaje sin contenido</span>
                                        )}
                                        <span className={`text-[10px] self-end leading-none ${isInbound ? "text-gray-400" : "text-white/50"}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* ── Input ── */}
            <div className="px-3 py-3 bg-white border-t border-border/50 shrink-0">
                <div className="flex items-end gap-2">
                    {/* Template button */}
                    <Popover open={templatePopoverOpen} onOpenChange={setTemplatePopoverOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="shrink-0 h-9 w-9 rounded-full text-muted-foreground hover:text-[#1A3E35] hover:bg-[#EEFAEE] transition-colors"
                                title="Enviar plantilla"
                            >
                                <FileText className="h-4 w-4" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent align="start" side="top" className="w-80 p-0">
                            <div className="px-4 py-3 border-b border-border">
                                <h4 className="font-semibold text-sm text-[#1A3E35]">Plantillas de mensaje</h4>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Solo las plantillas aprobadas pueden enviarse.
                                </p>
                            </div>
                            <ScrollArea className="max-h-64">
                                {templatesLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="h-5 w-5 animate-spin text-[#1A3E35]" />
                                    </div>
                                ) : Array.isArray(templates) && templates.length > 0 ? (
                                    <div className="py-1">
                                        {templates.map((template: any) => {
                                            const isApproved = template.status?.toUpperCase() === "APPROVED";
                                            const status = statusConfig[template.status] || statusConfig["PENDING"];
                                            const category = categoryLabels[template.category] || template.category;
                                            const isSendingThis = sendingTemplate === template.name;
                                            const isSentThis = sentTemplate === template.name;
                                            return (
                                                <button
                                                    key={template.id || template.name}
                                                    disabled={!isApproved || isSendingThis}
                                                    onClick={() => handleSendTemplate(template.name, template.language)}
                                                    className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                                                        isApproved
                                                            ? "hover:bg-[#EEFAEE] cursor-pointer"
                                                            : "opacity-50 cursor-not-allowed"
                                                    }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-sm font-medium truncate text-foreground">
                                                                {template.name}
                                                            </span>
                                                            <Badge variant={status.variant} className="text-[10px] px-1.5 py-0 shrink-0">
                                                                {status.label}
                                                            </Badge>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">
                                                            {category} · {template.language || "es_MX"}
                                                        </span>
                                                    </div>
                                                    <div className="shrink-0">
                                                        {isSendingThis ? (
                                                            <Loader2 className="h-4 w-4 animate-spin text-[#1A3E35]" />
                                                        ) : isSentThis ? (
                                                            <Check className="h-4 w-4 text-emerald-500" />
                                                        ) : isApproved ? (
                                                            <Send className="h-3.5 w-3.5 text-muted-foreground" />
                                                        ) : null}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 px-4">
                                        <FileText className="h-6 w-6 text-muted-foreground mb-2" />
                                        <p className="text-sm text-muted-foreground text-center">No hay plantillas disponibles.</p>
                                    </div>
                                )}
                            </ScrollArea>
                        </PopoverContent>
                    </Popover>

                    {/* Text input */}
                    <div className="flex-1 flex items-end bg-[#F0F2F5] rounded-2xl px-4 py-2 min-h-[40px]">
                        <textarea
                            ref={inputRef}
                            rows={1}
                            placeholder="Escribe un mensaje..."
                            className="flex-1 bg-transparent text-sm resize-none focus:outline-none leading-relaxed max-h-[120px] overflow-y-auto placeholder:text-muted-foreground"
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            disabled={isSending}
                        />
                    </div>

                    {/* Send button */}
                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={isSending || !inputValue.trim()}
                        className="shrink-0 h-9 w-9 rounded-full bg-[#1A3E35] hover:bg-[#1A3E35]/90 text-white disabled:opacity-40 transition-all"
                    >
                        {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
