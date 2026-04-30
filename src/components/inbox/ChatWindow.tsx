"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { endpoints } from "@/lib/api";
import { apiClient, fetcher } from "@/lib/api-client";
import { type ConversationDetail, type ConversationMessage, type PaymentTemplate } from "@/types/api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Send, Check, Download, Image as ImageIcon, Bot, User, Phone, CreditCard, FileText, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { formatPhoneDisplay } from "@/lib/phoneUtils";
import { CreateOrderPanel } from "@/components/inbox/CreateOrderPanel";

interface ChatWindowProps {
    conversationId: string;
}

/** Renders the media attachment for a message based on its type */
function MessageMedia({ msg }: { msg: ConversationMessage }) {
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
    const [paymentPopoverOpen, setPaymentPopoverOpen] = useState(false);
    const [sendingPaymentId, setSendingPaymentId] = useState<string | null>(null);
    const [sentPaymentId, setSentPaymentId] = useState<string | null>(null);
    const [orderPanelOpen, setOrderPanelOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const { data: detailData, error, isLoading, mutate } = useSWR<ConversationDetail>(
        endpoints.conversations.detail(conversationId),
        fetcher,
        { refreshInterval: 8000 }
    );

    const { data: paymentTemplates, isLoading: paymentTemplatesLoading } = useSWR<PaymentTemplate[]>(
        paymentPopoverOpen ? endpoints.paymentTemplates.list : null,
        fetcher
    );

    const messages: ConversationMessage[] = detailData?.messages ?? [];
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
            const optimisticMsg: ConversationMessage = {
                id: crypto.randomUUID(),
                direction: "outbound",
                content: textToSend,
                message_type: "text",
                media_id: null,
                created_at: new Date().toISOString(),
            };
            await mutate(
                async () => {
                    await apiClient.post(endpoints.conversations.reply(conversationId), { text: textToSend });
                    return undefined;
                },
                {
                    optimisticData: (current: ConversationDetail | undefined) => ({
                        ...(current ?? { id: conversationId, status: "ai_active", messages: [] }),
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

    const handleSendPaymentTemplate = async (template: PaymentTemplate) => {
        setSendingPaymentId(template.id);
        try {
            await apiClient.post(endpoints.conversations.reply(conversationId), { text: template.content });
            await mutate();
            setSentPaymentId(template.id);
            setTimeout(() => {
                setSentPaymentId(null);
                setPaymentPopoverOpen(false);
            }, 1200);
        } catch {
            // noop
        } finally {
            setSendingPaymentId(null);
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
        <>
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
                            <p className="text-xs text-muted-foreground truncate">
                                {formatPhoneDisplay(detailData.customer?.phone_number)}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {/* Create Order button — visible when in handoff */}
                    {isHandoff && (
                        <Button
                            size="icon"
                            variant="ghost"
                            title="Crear pedido manual"
                            onClick={() => setOrderPanelOpen(true)}
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-[#1A3E35] hover:bg-[#1A3E35]/10 transition-colors"
                        >
                            <ShoppingBag className="h-4 w-4" />
                        </Button>
                    )}
                    <div className="flex items-center gap-2">
                            <span
                                className={`flex items-center gap-1 max-w-[7.5rem] sm:max-w-none ${isHandoff ? "text-muted-foreground" : "text-emerald-700"}`}
                                title="Zafer Agent"
                            >
                                {isTogglingHandoff ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                                ) : (
                                    <>
                                        <Bot className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                        <span className="text-xs font-medium truncate">Zafer Agent</span>
                                    </>
                                )}
                            </span>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={isHandoff}
                                disabled={isTogglingHandoff}
                                onClick={handleToggleHandoff}
                                title={isHandoff ? "Devolver a Zafer Agent" : "Tomar conversación (tú)"}
                                className={`
                                    relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full
                                    border-2 border-transparent transition-colors duration-200 ease-in-out
                                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                                    disabled:cursor-not-allowed disabled:opacity-50
                                    ${isHandoff ? "bg-blue-500" : "bg-muted-foreground/30"}
                                `}
                            >
                                <span className={`
                                    pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg
                                    ring-0 transition-transform duration-200 ease-in-out
                                    ${isHandoff ? "translate-x-5" : "translate-x-0"}
                                `} />
                            </button>
                            <span
                                className={`flex items-center gap-1 text-xs font-medium transition-colors duration-200 ${isHandoff ? "text-blue-700" : "text-muted-foreground"}`}
                                title="Tú (operador)"
                            >
                                <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                Tú
                            </span>
                        </div>
                    {/* Badge de estado */}
                    <span className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors duration-200 ${
                        isHandoff
                            ? "bg-blue-100 text-blue-800"
                            : "bg-emerald-100 text-emerald-800"
                    }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isHandoff ? "bg-blue-500" : "bg-emerald-500"}`} />
                        {isHandoff ? "Atención humana" : "Zafer Agent"}
                    </span>
                </div>
            </div>

            {/* ── Messages ── */}
            <ScrollArea className="flex-1 overflow-hidden">
                <div className="flex flex-col gap-1 px-4 py-4">
                    {messages.map((msg, idx) => {
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
                    {/* Payment templates button */}
                    <Popover open={paymentPopoverOpen} onOpenChange={setPaymentPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    title="Enviar plantilla de pago"
                                    className="shrink-0 h-9 w-9 rounded-full text-muted-foreground hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                                >
                                    <CreditCard className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="start" side="top" className="w-80 p-0 rounded-2xl shadow-xl border border-border/50 overflow-hidden">
                                <div className="px-4 py-3 bg-gradient-to-b from-emerald-50/80 to-white border-b border-border/40">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                                            <CreditCard className="h-3.5 w-3.5 text-emerald-700" />
                                        </div>
                                        <h4 className="font-semibold text-sm text-[#1A3E35]">Plantillas de pago</h4>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1.5 ml-8">
                                        Selecciona una para enviarla al cliente.
                                    </p>
                                </div>
                                <ScrollArea className="max-h-60">
                                    {paymentTemplatesLoading ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-5 w-5 animate-spin text-[#1A3E35]" />
                                        </div>
                                    ) : paymentTemplates && paymentTemplates.length > 0 ? (
                                        <div className="p-2 flex flex-col gap-1">
                                            {paymentTemplates.filter((t) => t.is_active).map((template) => {
                                                const isSendingThis = sendingPaymentId === template.id;
                                                const isSentThis = sentPaymentId === template.id;
                                                return (
                                                    <button
                                                        key={template.id}
                                                        disabled={isSendingThis}
                                                        onClick={() => handleSendPaymentTemplate(template)}
                                                        className="w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 hover:bg-emerald-50 transition-all duration-150 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-medium truncate text-foreground">
                                                                    {template.name}
                                                                </span>
                                                                {template.method && (
                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium shrink-0">
                                                                        {template.method}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-line mt-0.5">
                                                                {template.content}
                                                            </span>
                                                        </div>
                                                        <div className="shrink-0">
                                                            {isSendingThis ? (
                                                                <Loader2 className="h-4 w-4 animate-spin text-[#1A3E35]" />
                                                            ) : isSentThis ? (
                                                                <Check className="h-4 w-4 text-emerald-500" />
                                                            ) : (
                                                                <Send className="h-3.5 w-3.5 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-10 px-4">
                                            <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                                                <CreditCard className="h-5 w-5 text-emerald-400" />
                                            </div>
                                            <p className="text-sm font-medium text-foreground">Sin plantillas</p>
                                            <p className="text-xs text-muted-foreground text-center mt-1">
                                                Agrégalas en Configuración → Negocio.
                                            </p>
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

        {/* Create Order Panel */}
        <CreateOrderPanel
            open={orderPanelOpen}
            onClose={() => setOrderPanelOpen(false)}
            customer={detailData?.customer}
            conversationId={conversationId}
        />
        </>
    );
}
