"use client";

import { useState } from "react";
import useSWR from "swr";
import { Plus, Trash2, Pencil, CreditCard, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient, fetcher } from "@/lib/api-client";
import { endpoints } from "@/lib/api";
import { type PaymentTemplate } from "@/types/api";

const METHOD_OPTIONS = [
    { value: "spei", label: "Transferencia SPEI" },
    { value: "cash", label: "Efectivo" },
    { value: "card", label: "Tarjeta" },
    { value: "other", label: "Otro" },
];

const METHOD_LABELS: Record<string, string> = {
    spei: "SPEI",
    cash: "Efectivo",
    card: "Tarjeta",
    other: "Otro",
};

const EMPTY_FORM = { name: "", method: "", content: "" };

export function PaymentTemplatesSection() {
    const { data: templates, isLoading, mutate } = useSWR<PaymentTemplate[]>(
        endpoints.paymentTemplates.list,
        fetcher
    );

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (t: PaymentTemplate) => {
        setForm({ name: t.name, method: t.method ?? "", content: t.content });
        setEditingId(t.id);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
    };

    const handleSave = async () => {
        if (!form.name.trim() || !form.content.trim()) return;
        setSaving(true);
        try {
            const body = {
                name: form.name.trim(),
                method: form.method || null,
                content: form.content.trim(),
                is_active: true,
            };
            if (editingId) {
                await apiClient.patch(endpoints.paymentTemplates.update(editingId), body);
            } else {
                await apiClient.post(endpoints.paymentTemplates.create, body);
            }
            await mutate();
            closeForm();
        } catch {
            // noop
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await apiClient.delete(endpoints.paymentTemplates.delete(id));
            await mutate();
        } catch {
            // noop
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                    Plantillas de pago
                </Label>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs gap-1"
                    onClick={openCreate}
                >
                    <Plus className="h-3.5 w-3.5" />
                    Nueva
                </Button>
            </div>
            <p className="text-xs text-muted-foreground">
                Mensajes predefinidos que el operador puede enviar con un clic al tomar el chat.
            </p>

            {/* Formulario inline */}
            {showForm && (
                <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                            {editingId ? "Editar plantilla" : "Nueva plantilla"}
                        </span>
                        <button type="button" onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="pt-name" className="text-xs">Nombre</Label>
                        <Input
                            id="pt-name"
                            placeholder="Ej: Transferencia BBVA"
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            className="h-8 text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="pt-method" className="text-xs">Método (opcional)</Label>
                        <Select
                            value={form.method}
                            onValueChange={(v) => setForm((f) => ({ ...f, method: v }))}
                        >
                            <SelectTrigger id="pt-method" className="h-8 text-sm">
                                <SelectValue placeholder="Selecciona método" />
                            </SelectTrigger>
                            <SelectContent>
                                {METHOD_OPTIONS.map((o) => (
                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="pt-content" className="text-xs">Texto que se enviará al cliente</Label>
                        <Textarea
                            id="pt-content"
                            placeholder={"Banco: BBVA\nCLABE: 012345678912345678\nNombre: Juan Pérez\n\nEnvíanos tu comprobante 🙌"}
                            value={form.content}
                            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                            rows={4}
                            className="text-sm resize-none"
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={closeForm}>
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={handleSave}
                            disabled={saving || !form.name.trim() || !form.content.trim()}
                        >
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                            Guardar
                        </Button>
                    </div>
                </div>
            )}

            {/* Lista */}
            {isLoading ? (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            ) : templates && templates.length > 0 ? (
                <div className="space-y-2">
                    {templates.map((t) => (
                        <div
                            key={t.id}
                            className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium truncate">{t.name}</span>
                                    {t.method && (
                                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                                            {METHOD_LABELS[t.method] ?? t.method}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 whitespace-pre-line">
                                    {t.content}
                                </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => openEdit(t)}
                                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                    title="Editar"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleDelete(t.id)}
                                    disabled={deletingId === t.id}
                                    className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                                    title="Eliminar"
                                >
                                    {deletingId === t.id
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        : <Trash2 className="h-3.5 w-3.5" />
                                    }
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-muted-foreground italic">
                    Aún no hay plantillas. Crea la primera con el botón de arriba.
                </p>
            )}
        </div>
    );
}
