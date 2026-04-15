"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
    BookOpen,
    Plus,
    Pencil,
    Trash2,
    Loader2,
    AlertCircle,
    FileText,
    Clock,
    ShieldCheck,
    HelpCircle,
    Sparkles,
} from "lucide-react";

import { endpoints } from "@/lib/api";
import { apiClient, fetcher } from "@/lib/api-client";
import { useSession as useAuthSession } from "next-auth/react";
import { getSessionBusinessId } from "@/lib/business";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// ─── Tipos ───────────────────────────────────────────────────────────────────

interface KnowledgeDoc {
    id: string;
    business_id: string;
    title: string;
    content: string;
    doc_type: string;
    is_active: boolean;
    created_at: string;
}

const DOC_TYPE_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    faq:    { label: "Pregunta frecuente", icon: <HelpCircle className="h-3.5 w-3.5" />,  color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20" },
    policy: { label: "Política",           icon: <ShieldCheck className="h-3.5 w-3.5" />, color: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20" },
    hours:  { label: "Horarios",           icon: <Clock className="h-3.5 w-3.5" />,       color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" },
    custom: { label: "General",            icon: <FileText className="h-3.5 w-3.5" />,    color: "bg-muted text-muted-foreground border-border" },
};

const DOC_TYPE_EXAMPLES: Record<string, string> = {
    faq:    "¿Hacen entregas a domicilio? Sí, entregamos en un radio de 5km. El costo de envío es $30 MXN.",
    policy: "Política de devoluciones: Aceptamos devoluciones dentro de los 3 días posteriores a la compra, con ticket de compra.",
    hours:  "Lunes a Viernes: 8:00am - 8:00pm\nSábado: 9:00am - 6:00pm\nDomingo: Cerrado",
    custom: "Métodos de pago aceptados: Efectivo, transferencia SPEI, tarjeta débito/crédito con terminal.",
};

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants: Variants = {
    hidden: { y: 16, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

// ─── Página principal ─────────────────────────────────────────────────────────

export default function KnowledgePage() {
    const { data: session } = useSession();
    const { toast } = useToast();
    const businessId = getSessionBusinessId(session);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<KnowledgeDoc | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const { data: response, isLoading, error: swrError, mutate } = useSWR(
        session && businessId ? endpoints.knowledge.list(businessId) : null,
        fetcher,
        { shouldRetryOnError: false }
    );

    const docs: KnowledgeDoc[] = response?.data || response || [];

    function openCreate() {
        setEditing(null);
        setDialogOpen(true);
    }

    function openEdit(doc: KnowledgeDoc) {
        setEditing(doc);
        setDialogOpen(true);
    }

    async function handleDelete(id: string) {
        setDeleting(id);
        try {
            await apiClient.delete(endpoints.knowledge.delete(id));
            await mutate();
            toast({ title: "Documento eliminado" });
        } catch {
            toast({ title: "Error al eliminar", variant: "destructive" });
        } finally {
            setDeleting(null);
        }
    }

    async function handleSave(data: { title: string; content: string; doc_type: string }) {
        try {
            if (editing) {
                await apiClient.patch(endpoints.knowledge.update(editing.id), data);
                toast({ title: "Documento actualizado" });
            } else {
                await apiClient.post(endpoints.knowledge.create, {
                    ...data,
                    business_id: businessId,
                });
                toast({ title: "Documento creado" });
            }
            await mutate();
            setDialogOpen(false);
        } catch {
            toast({ title: "Error al guardar", variant: "destructive" });
        }
    }

    return (
        <motion.div
            className="space-y-6 max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            {/* Header */}
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <BookOpen className="h-7 w-7 text-primary" />
                        Base de Conocimiento
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Información que el agente IA usa para responder preguntas sobre tu negocio.
                    </p>
                </div>
                <Button onClick={openCreate} className="gap-2 shrink-0 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Nuevo documento
                </Button>
            </motion.div>

            {/* Info banner */}
            <motion.div variants={itemVariants}>
                <div className="flex items-start gap-3 p-3 sm:p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm">
                    <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="text-muted-foreground">
                        <span className="font-medium text-foreground">¿Cómo funciona?</span>{" "}
                        Cuando un cliente pregunte "¿tienen estacionamiento?" o "¿hacen envíos a Zapopan?",
                        el agente buscará aquí primero antes de responder. Agrega FAQs, políticas y
                        horarios para que el agente siempre tenga la respuesta correcta.
                    </div>
                </div>
            </motion.div>

            {/* Lista de documentos */}
            <motion.div variants={itemVariants}>
                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-24 w-full rounded-xl" />
                        ))}
                    </div>
                ) : swrError ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <AlertCircle className="h-8 w-8 text-destructive mb-3" />
                            <p className="font-medium text-foreground mb-1">No se pudo conectar con el servicio</p>
                            <p className="text-sm text-muted-foreground">
                                El servicio de agentes no está disponible en este momento.
                            </p>
                        </CardContent>
                    </Card>
                ) : docs.length === 0 ? (
                    <EmptyState onAdd={openCreate} />
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {docs.map((doc) => (
                                <motion.div
                                    key={doc.id}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.97 }}
                                >
                                    <DocCard
                                        doc={doc}
                                        onEdit={() => openEdit(doc)}
                                        onDelete={() => handleDelete(doc.id)}
                                        deleting={deleting === doc.id}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </motion.div>

            {/* Dialog crear/editar */}
            <DocDialog
                open={dialogOpen}
                onClose={() => setDialogOpen(false)}
                onSave={handleSave}
                initial={editing}
            />
        </motion.div>
    );
}

// ─── DocCard ──────────────────────────────────────────────────────────────────

function DocCard({
    doc,
    onEdit,
    onDelete,
    deleting,
}: {
    doc: KnowledgeDoc;
    onEdit: () => void;
    onDelete: () => void;
    deleting: boolean;
}) {
    const meta = DOC_TYPE_META[doc.doc_type] || DOC_TYPE_META.custom;

    return (
        <Card className="hover:border-primary/20 transition-all duration-200">
            <CardContent className="pt-4 pb-4">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className={`gap-1 text-xs ${meta.color}`}>
                                {meta.icon}
                                {meta.label}
                            </Badge>
                        </div>
                        <p className="font-medium text-foreground text-sm">{doc.title}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {doc.content}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={onEdit}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={onDelete}
                            disabled={deleting}
                        >
                            {deleting
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Trash2 className="h-3.5 w-3.5" />
                            }
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 bg-primary/5 rounded-full mb-4">
                    <BookOpen className="h-8 w-8 text-primary" />
                </div>
                <p className="font-semibold text-foreground mb-1">Sin documentos todavía</p>
                <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                    Agrega FAQs, horarios y políticas para que el agente pueda
                    responder preguntas específicas de tu negocio.
                </p>
                <Button onClick={onAdd} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Agregar primer documento
                </Button>
            </CardContent>
        </Card>
    );
}

// ─── Dialog crear/editar ──────────────────────────────────────────────────────

function DocDialog({
    open,
    onClose,
    onSave,
    initial,
}: {
    open: boolean;
    onClose: () => void;
    onSave: (data: { title: string; content: string; doc_type: string }) => Promise<void>;
    initial: KnowledgeDoc | null;
}) {
    const [title, setTitle] = useState(initial?.title || "");
    const [content, setContent] = useState(initial?.content || "");
    const [docType, setDocType] = useState(initial?.doc_type || "faq");
    const [saving, setSaving] = useState(false);

    // Sync cuando cambia el doc a editar
    useState(() => {
        setTitle(initial?.title || "");
        setContent(initial?.content || "");
        setDocType(initial?.doc_type || "faq");
    });

    // Reset al abrir
    const handleOpenChange = (o: boolean) => {
        if (!o) {
            onClose();
        } else {
            setTitle(initial?.title || "");
            setContent(initial?.content || "");
            setDocType(initial?.doc_type || "faq");
        }
    };

    async function handleSubmit() {
        if (!title.trim() || !content.trim()) return;
        setSaving(true);
        try {
            await onSave({ title: title.trim(), content: content.trim(), doc_type: docType });
        } finally {
            setSaving(false);
        }
    }

    const isEdit = !!initial;
    const example = DOC_TYPE_EXAMPLES[docType];

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Editar documento" : "Nuevo documento"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Modifica el contenido del documento."
                            : "El agente usará este texto para responder preguntas de tus clientes."
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={docType} onValueChange={setDocType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(DOC_TYPE_META).map(([key, meta]) => (
                                    <SelectItem key={key} value={key}>
                                        <span className="flex items-center gap-2">
                                            {meta.icon}
                                            {meta.label}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Título</Label>
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={`Ej: ${docType === "faq" ? "¿Hacen envíos?" : docType === "hours" ? "Horario de atención" : docType === "policy" ? "Política de devoluciones" : "Métodos de pago"}`}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Contenido</Label>
                        <Textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={5}
                            placeholder={example}
                        />
                        <p className="text-xs text-muted-foreground">
                            Escribe la información tal como quieres que el agente la transmita.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancelar</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={saving || !title.trim() || !content.trim()}
                        className="gap-2"
                    >
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isEdit ? "Guardar cambios" : "Crear documento"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
