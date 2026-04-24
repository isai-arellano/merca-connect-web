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

interface StructuredFields {
    banco?: string;
    clabe?: string;
    titular?: string;
    nota?: string;
    comercio?: string;
    direccion?: string;
    horario?: string;
}

const EMPTY_FIELDS: StructuredFields = {};

function buildContent(method: string, fields: StructuredFields): string {
    if (method === "spei") {
        const lines = [
            "🏦 *Transferencia SPEI*",
            "━━━━━━━━━━━━━━━━━",
            `Banco: ${fields.banco || ""}`,
            `CLABE: ${fields.clabe || ""}`,
            `Titular: ${fields.titular || ""}`,
            "━━━━━━━━━━━━━━━━━",
        ];
        if (fields.nota?.trim()) lines.push(fields.nota.trim());
        lines.push("Envíanos tu comprobante al terminar ✅");
        return lines.join("\n");
    }
    if (method === "card") {
        const lines = [
            "💳 *Pago con Tarjeta*",
            "━━━━━━━━━━━━━━━━━",
            `Terminal: ${fields.comercio || ""}`,
            "Acepta Visa / Mastercard / AMEX",
            "━━━━━━━━━━━━━━━━━",
        ];
        if (fields.nota?.trim()) lines.push(fields.nota.trim());
        return lines.join("\n");
    }
    if (method === "cash") {
        const lines = [
            "💵 *Pago en Efectivo*",
            "━━━━━━━━━━━━━━━━━",
            `Dirección: ${fields.direccion || ""}`,
        ];
        if (fields.horario?.trim()) lines.push(`Horario: ${fields.horario.trim()}`);
        lines.push("━━━━━━━━━━━━━━━━━");
        if (fields.nota?.trim()) lines.push(fields.nota.trim());
        return lines.join("\n");
    }
    return "";
}

export function PaymentTemplatesSection() {
    const { data: templates, isLoading, mutate } = useSWR<PaymentTemplate[]>(
        endpoints.paymentTemplates.list,
        fetcher
    );

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [structuredFields, setStructuredFields] = useState<StructuredFields>(EMPTY_FIELDS);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const isStructured = form.method && form.method !== "other";
    const generatedContent = isStructured ? buildContent(form.method, structuredFields) : form.content;

    const openCreate = () => {
        setForm(EMPTY_FORM);
        setStructuredFields(EMPTY_FIELDS);
        setEditingId(null);
        setShowForm(true);
    };

    const openEdit = (t: PaymentTemplate) => {
        setForm({ name: t.name, method: t.method ?? "", content: t.content });
        setStructuredFields(EMPTY_FIELDS);
        setEditingId(t.id);
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingId(null);
        setForm(EMPTY_FORM);
        setStructuredFields(EMPTY_FIELDS);
    };

    const handleMethodChange = (v: string) => {
        setForm((f) => ({ ...f, method: v }));
        setStructuredFields(EMPTY_FIELDS);
    };

    const handleSave = async () => {
        const finalContent = isStructured ? generatedContent : form.content;
        if (!form.name.trim() || !finalContent.trim()) return;
        setSaving(true);
        try {
            const body = {
                name: form.name.trim(),
                method: form.method || null,
                content: finalContent.trim(),
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
                            onValueChange={handleMethodChange}
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

                    {/* Structured fields for SPEI */}
                    {form.method === "spei" && (
                        <div className="space-y-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Banco</Label>
                                <Input
                                    placeholder="Ej: BBVA"
                                    value={structuredFields.banco ?? ""}
                                    onChange={(e) => setStructuredFields((f) => ({ ...f, banco: e.target.value }))}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">CLABE (18 dígitos)</Label>
                                <Input
                                    placeholder="012345678901234567"
                                    maxLength={18}
                                    value={structuredFields.clabe ?? ""}
                                    onChange={(e) => setStructuredFields((f) => ({ ...f, clabe: e.target.value }))}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Titular</Label>
                                <Input
                                    placeholder="Nombre del titular"
                                    value={structuredFields.titular ?? ""}
                                    onChange={(e) => setStructuredFields((f) => ({ ...f, titular: e.target.value }))}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Nota opcional</Label>
                                <Input
                                    placeholder="Ej: Referencia: pedido #123"
                                    value={structuredFields.nota ?? ""}
                                    onChange={(e) => setStructuredFields((f) => ({ ...f, nota: e.target.value }))}
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Structured fields for Tarjeta */}
                    {form.method === "card" && (
                        <div className="space-y-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Nombre del comercio / terminal</Label>
                                <Input
                                    placeholder="Ej: Tienda Principal"
                                    value={structuredFields.comercio ?? ""}
                                    onChange={(e) => setStructuredFields((f) => ({ ...f, comercio: e.target.value }))}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Nota opcional</Label>
                                <Input
                                    placeholder="Instrucciones adicionales"
                                    value={structuredFields.nota ?? ""}
                                    onChange={(e) => setStructuredFields((f) => ({ ...f, nota: e.target.value }))}
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Structured fields for Efectivo */}
                    {form.method === "cash" && (
                        <div className="space-y-2">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Dirección o punto de pago</Label>
                                <Input
                                    placeholder="Ej: Av. Insurgentes 123, CDMX"
                                    value={structuredFields.direccion ?? ""}
                                    onChange={(e) => setStructuredFields((f) => ({ ...f, direccion: e.target.value }))}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Horario (opcional)</Label>
                                <Input
                                    placeholder="Ej: Lun–Vie 9am–6pm"
                                    value={structuredFields.horario ?? ""}
                                    onChange={(e) => setStructuredFields((f) => ({ ...f, horario: e.target.value }))}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Nota opcional</Label>
                                <Input
                                    placeholder="Instrucciones adicionales"
                                    value={structuredFields.nota ?? ""}
                                    onChange={(e) => setStructuredFields((f) => ({ ...f, nota: e.target.value }))}
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Free textarea for "Otro" or no method */}
                    {(!form.method || form.method === "other") && (
                        <div className="space-y-2">
                            <Label htmlFor="pt-content" className="text-xs">Texto que se enviará al cliente</Label>
                            <Textarea
                                id="pt-content"
                                placeholder={"Escribe el mensaje de pago..."}
                                value={form.content}
                                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                                rows={4}
                                className="text-sm resize-none"
                            />
                        </div>
                    )}

                    {/* Preview */}
                    {isStructured && generatedContent && (
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Vista previa del mensaje</Label>
                            <div className="rounded-lg border border-border bg-background p-3 font-mono text-xs whitespace-pre-line leading-relaxed text-foreground">
                                {generatedContent}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" variant="ghost" className="h-7 text-xs" onClick={closeForm}>
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={handleSave}
                            disabled={saving || !form.name.trim() || !generatedContent.trim()}
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
