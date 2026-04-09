"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { endpoints } from "@/lib/api";
import { apiClient, fetcher } from "@/lib/api-client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Loader2, Send, FileText, Check, Download, Image as ImageIcon } from "lucide-react";
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
                <div className="flex items-center gap-2 rounded-lg border border-border bg-white/60 dark:bg-card/60 px-3 py-2">
                    <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Imagen no disponible</span>
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
                    className={`rounded-lg object-cover ${
                        isSticker
                            ? "w-32 h-32"
                            : "max-w-full max-h-64 cursor-pointer hover:opacity-90 transition-opacity"
                    }`}
                    loading="lazy"
                />
                {expanded && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 cursor-pointer"
                        onClick={() => setExpanded(false)}
                    >
                        <img
                            src={url}
                            alt="full size"
                            className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-2xl"
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
                className="rounded-lg max-w-full max-h-64"
            />
        );
    }

    if (type === "audio") {
        return (
            <audio
                src={url}
                controls
                preload="metadata"
                className="w-full max-w-[260px]"
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
                className="flex items-center gap-3 rounded-lg border border-border bg-white/60 dark:bg-card/60 px-3 py-2 hover:bg-white dark:hover:bg-card transition-colors"
            >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#1A3E35]/10">
                    <FileText className="h-5 w-5 text-[#1A3E35]" />
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium truncate">{filename}</span>
                    <span className="text-xs text-muted-foreground">{mimeType}</span>
                </div>
                <Download className="h-4 w-4 ml-auto shrink-0 text-muted-foreground" />
            </a>
        );
    }

    // Fallback for unknown media types
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[#1A3E35] underline"
        >
            <ImageIcon className="h-4 w-4" />
            Ver adjunto
        </a>
    );
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
    const [inputValue, setInputValue] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [templatePopoverOpen, setTemplatePopoverOpen] = useState(false);
    const [sendingTemplate, setSendingTemplate] = useState<string | null>(null);
    const [sentTemplate, setSentTemplate] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);

    const handleSend = async () => {
        if (!inputValue.trim()) return;
        setIsSending(true);
        try {
            await apiClient.post(endpoints.conversations.reply(conversationId), { text: inputValue });
            setInputValue("");
            mutate();
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsSending(false);
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
            mutate();
        } catch (error) {
            console.error("Error sending template:", error);
        } finally {
            setSendingTemplate(null);
        }
    };

    if (isLoading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#1A3E35]" /></div>;
    }

    if (error || !detailData) {
        return <div className="flex h-full items-center justify-center text-red-500">Error cargando chat</div>;
    }

    return (
        <div className="flex flex-col h-full w-full bg-white dark:bg-card overflow-hidden">
            {/* Header */}
            <div className="border-b border-border p-4 flex items-center justify-between">
                <div>
                    <h3 className="font-semibold">{detailData.customer?.name || detailData.customer?.phone_number}</h3>
                    <p className="text-xs text-muted-foreground">{detailData.customer?.phone_number}</p>
                </div>
                <div className="text-xs bg-[#74E79C]/20 text-[#1A3E35] dark:text-[#74E79C] px-2 py-1 rounded font-medium">
                    Estado: {detailData.status}
                </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-3">
                    {messages.map((msg: any) => {
                        const isInbound = msg.direction === 'inbound';
                        const hasMedia = !!msg.media_id && msg.message_type !== "text";
                        const hasCaption = !!msg.content;

                        return (
                            <div key={msg.id} className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[75%] flex flex-col gap-1.5 rounded-lg px-3 py-2 text-sm ${
                                    isInbound
                                    ? 'bg-[#EEFAEE] text-[#1A3E35] border border-border dark:bg-secondary dark:text-foreground'
                                    : 'bg-[#1A3E35] text-white'
                                }`}>
                                    {/* Media content */}
                                    {hasMedia && <MessageMedia msg={msg} />}

                                    {/* Text / caption */}
                                    {hasCaption && (
                                        <span className="whitespace-pre-wrap">{msg.content}</span>
                                    )}

                                    {/* Fallback if neither media nor text */}
                                    {!hasMedia && !hasCaption && (
                                        <span className="italic opacity-60">Mensaje sin contenido</span>
                                    )}

                                    <span className="text-[10px] opacity-70 text-right">
                                        {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={messagesEndRef} />
                </div>
            </ScrollArea>

            {/* Input area */}
            <div className="p-4 border-t border-border bg-[#EEFAEE] dark:bg-secondary flex gap-2">
                {/* Template selector */}
                <Popover open={templatePopoverOpen} onOpenChange={setTemplatePopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            size="icon"
                            variant="outline"
                            className="shrink-0 border-border bg-white dark:bg-card hover:bg-[#74E79C]/20 hover:border-[#1A3E35]/30"
                            title="Enviar plantilla"
                        >
                            <FileText className="h-4 w-4 text-[#1A3E35] dark:text-foreground" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        align="start"
                        side="top"
                        className="w-80 p-0"
                    >
                        <div className="px-4 py-3 border-b border-border">
                            <h4 className="font-semibold text-sm text-[#1A3E35] dark:text-foreground">
                                Plantillas de mensaje
                            </h4>
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
                                                        ? "hover:bg-[#EEFAEE] dark:hover:bg-secondary cursor-pointer"
                                                        : "opacity-50 cursor-not-allowed"
                                                }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium truncate text-foreground">
                                                            {template.name}
                                                        </span>
                                                        <Badge
                                                            variant={status.variant}
                                                            className="text-[10px] px-1.5 py-0 shrink-0"
                                                        >
                                                            {status.label}
                                                        </Badge>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {category} &middot; {template.language || "es_MX"}
                                                    </span>
                                                </div>
                                                <div className="shrink-0">
                                                    {isSendingThis ? (
                                                        <Loader2 className="h-4 w-4 animate-spin text-[#1A3E35]" />
                                                    ) : isSentThis ? (
                                                        <Check className="h-4 w-4 text-[#74E79C]" />
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
                                    <p className="text-sm text-muted-foreground text-center">
                                        No hay plantillas disponibles.
                                    </p>
                                </div>
                            )}
                        </ScrollArea>
                    </PopoverContent>
                </Popover>

                <input
                    type="text"
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-white dark:bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#74E79C]"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSend();
                    }}
                    disabled={isSending}
                />
                <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={isSending || !inputValue.trim()}
                    className="bg-[#1A3E35] hover:bg-[#1A3E35]/90 text-white"
                >
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
}
