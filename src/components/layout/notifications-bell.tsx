"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, UserRound, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export function NotificationsBell() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const { notifications, count } = useHandoffNotifications();

    function handleGoToConversation(id: string) {
        setOpen(false);
        router.push(`/dashboard/inbox?conversation=${id}`);
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-primary"
                >
                    <Bell className="h-5 w-5" />
                    {count > 0 && (
                        <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center leading-none">
                            {count > 9 ? "9+" : count}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                className="w-80 p-0 overflow-hidden"
                sideOffset={8}
            >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <p className="font-semibold text-sm text-foreground">Notificaciones</p>
                    {count > 0 && (
                        <Badge variant="destructive" className="text-xs h-5">
                            {count} esperando
                        </Badge>
                    )}
                </div>

                <div className="max-h-80 overflow-y-auto">
                    {count === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                            <Bell className="h-8 w-8 opacity-20" />
                            <p className="text-sm">Sin notificaciones pendientes</p>
                        </div>
                    ) : (
                        <ul>
                            {notifications.map((n) => (
                                <li key={n.id}>
                                    <button
                                        onClick={() => handleGoToConversation(n.id)}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0"
                                    >
                                        <div className="shrink-0 h-9 w-9 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                                            <UserRound className="h-4 w-4 text-red-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {n.customer_name || formatPhoneDisplay(n.customer_phone) || "Cliente"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Solicita atención humana · {timeAgo(n.updated_at)}
                                            </p>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {count > 0 && (
                    <div className="px-4 py-2 border-t border-border">
                        <button
                            onClick={() => { setOpen(false); router.push("/dashboard/inbox"); }}
                            className="text-xs text-brand-forest font-medium hover:underline w-full text-center"
                        >
                            Ver todas en el Inbox
                        </button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
