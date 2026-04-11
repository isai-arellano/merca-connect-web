"use client";

import { useState, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { apiClient } from "@/lib/api-client";
import { endpoints } from "@/lib/api";

const PREDEFINED_TAGS = ["VIP", "Mayoreo", "Credito", "Frecuente"] as const;

export interface Customer {
    id: string;
    name?: string | null;
    phone_number: string;
    notes?: string | null;
    tags?: string[];
    is_active?: boolean;
    created_at: string;
}

interface CustomerDialogProps {
    customer: Customer | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CustomerDialog({ customer, open, onOpenChange, onSuccess }: CustomerDialogProps) {
    const [name, setName] = useState("");
    const [notes, setNotes] = useState("");
    const [tags, setTags] = useState<string[]>([]);
    const [customTag, setCustomTag] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (customer && open) {
            setName(customer.name ?? "");
            setNotes(customer.notes ?? "");
            setTags(customer.tags ?? []);
            setCustomTag("");
            setError(null);
        }
    }, [customer, open]);

    function toggleTag(tag: string) {
        setTags((prev) =>
            prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
        );
    }

    function addCustomTag() {
        const trimmed = customTag.trim();
        if (!trimmed || tags.includes(trimmed)) return;
        setTags((prev) => [...prev, trimmed]);
        setCustomTag("");
    }

    function removeTag(tag: string) {
        setTags((prev) => prev.filter((t) => t !== tag));
    }

    async function handleSave() {
        if (!customer) return;
        setSaving(true);
        setError(null);

        try {
            await apiClient.patch(endpoints.customers.update(customer.phone_number), {
                name: name.trim() || null,
                notes: notes.trim() || null,
                tags,
            });
            onSuccess();
            onOpenChange(false);
        } catch {
            setError("No se pudo guardar. Intenta de nuevo.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle>Editar cliente</DialogTitle>
                    {customer && (
                        <p className="text-sm text-muted-foreground">+{customer.phone_number}</p>
                    )}
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label htmlFor="customer-name">Nombre</Label>
                        <Input
                            id="customer-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nombre del cliente"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="customer-notes">Notas</Label>
                        <Textarea
                            id="customer-notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ej. Paga a quincena, mayoreo solo viernes..."
                            rows={3}
                            className="resize-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Etiquetas</Label>
                        <div className="flex flex-wrap gap-2">
                            {PREDEFINED_TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                                        tags.includes(tag)
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background text-muted-foreground border-border hover:border-primary/50"
                                    }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>

                        {/* Tags activos (incluyendo custom) */}
                        {tags.filter((t) => !PREDEFINED_TAGS.includes(t as typeof PREDEFINED_TAGS[number])).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {tags
                                    .filter((t) => !PREDEFINED_TAGS.includes(t as typeof PREDEFINED_TAGS[number]))
                                    .map((tag) => (
                                        <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                                            {tag}
                                            <button
                                                type="button"
                                                onClick={() => removeTag(tag)}
                                                className="hover:text-destructive transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                            </div>
                        )}

                        {/* Tag personalizado */}
                        <div className="flex gap-2">
                            <Input
                                value={customTag}
                                onChange={(e) => setCustomTag(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
                                placeholder="Etiqueta personalizada..."
                                className="h-8 text-sm"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addCustomTag}
                                disabled={!customTag.trim()}
                                className="shrink-0"
                            >
                                Agregar
                            </Button>
                        </div>
                    </div>

                    {error && (
                        <p className="text-sm text-destructive">{error}</p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
