"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bot, MessageCircleWarning, Loader2, CheckCircle2 } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useHandoffNotifications } from "@/hooks/useHandoffNotifications";
import { formatPhoneDisplay } from "@/lib/phoneUtils";

function timeAgo(isoString: string | null): string {
    if (!isoString) return "";
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return "hace un momento";
    if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
    return `hace ${Math.floor(diff / 86400)} d`;
}

export function EscalationPanel() {
    const [open, setOpen] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);
    const router = useRouter();
    const { data: session } = useSession();
    const { notifications, count, markAsAttended } = useHandoffNotifications();
    const adminName = session?.user?.name?.split(" ")[0] || "equipo";

    const handleOpenConversation = (conversationId: string) => {
        setOpen(false);
        router.push(`/dashboard/inbox?conversation=${conversationId}`);
    };

    const handleMarkAsAttended = async (conversationId: string) => {
        setBusyId(conversationId);
        try {
            await markAsAttended(conversationId);
        } finally {
            setBusyId(null);
        }
    };

    return (
        <>
            <Button
                type="button"
                size="icon"
                onClick={() => setOpen(true)}
                className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-2xl shadow-lg bg-[#EEFAEE] hover:bg-[#DDFADD] border border-gray-200"
                title="Chat con Zafer"
            >
                <MessageCircleWarning className="h-6 w-6 text-[#1A3E35]" />
                {count > 0 && (
                    <span className="absolute -top-1 -right-1 h-6 min-w-6 px-1 rounded-full bg-red-500 text-white text-xs font-bold inline-flex items-center justify-center">
                        {count > 99 ? "99+" : count}
                    </span>
                )}
            </Button>

            <Sheet open={open} onOpenChange={setOpen}>
                <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
                    <VisuallyHidden>
                        <SheetTitle>Chat con Zafer</SheetTitle>
                    </VisuallyHidden>

                    <div className="border-b border-border px-4 py-3">
                        <p className="text-sm font-semibold">Zafer necesita tu ayuda</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Escalaciones activas para atención humana
                        </p>
                        <div className="mt-2">
                            <Badge variant={count > 0 ? "destructive" : "secondary"}>
                                {count} pendientes
                            </Badge>
                        </div>
                    </div>

                    <ScrollArea className="flex-1 px-4 py-4">
                        {count === 0 ? (
                            <div className="h-full min-h-[280px] flex flex-col items-center justify-center text-muted-foreground">
                                <CheckCircle2 className="h-10 w-10 opacity-40 mb-3" />
                                <p className="text-sm font-medium">Todo en orden</p>
                                <p className="text-xs">No hay conversaciones pendientes</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {notifications.map((notification) => {
                                    const customerLabel =
                                        notification.customer_name ||
                                        formatPhoneDisplay(notification.customer_phone) ||
                                        "Cliente";
                                    const customerPhone = formatPhoneDisplay(notification.customer_phone);
                                    const isBusy = busyId === notification.id;

                                    return (
                                        <div key={notification.id} className="space-y-2">
                                            <div className="flex items-start gap-2">
                                                <div className="h-8 w-8 rounded-full bg-[#1A3E35]/10 text-[#1A3E35] flex items-center justify-center shrink-0">
                                                    <Bot className="h-4 w-4" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="rounded-2xl rounded-tl-sm bg-muted p-3 text-sm">
                                                        <p>
                                                            Hola {adminName}. Necesitamos tu ayuda con {customerLabel}
                                                            {customerPhone ? ` (${customerPhone})` : ""}. Por favor revisa el chat y atiende esta conversación.
                                                        </p>
                                                    </div>
                                                    <p className="text-[11px] text-muted-foreground mt-1">
                                                        {timeAgo(notification.updated_at)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="pl-10 flex gap-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleOpenConversation(notification.id)}
                                                >
                                                    Ver conversación
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() => handleMarkAsAttended(notification.id)}
                                                    disabled={isBusy}
                                                >
                                                    {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                                    Marcar como atendido
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </>
    );
}
