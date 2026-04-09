"use client";

import { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Loader2,
  Eye,
  Globe,
  Tag,
  LayoutGrid,
  List,
} from "lucide-react";

import { endpoints } from "@/lib/api";
import { apiClient, fetcher } from "@/lib/api-client";
import { getBusinessPhoneId, withBusinessPhoneId } from "@/lib/business";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 20, opacity: 0 },
  show: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

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

interface TemplateComponent {
  type: string;
  text?: string;
}

interface Template {
  id?: string;
  name: string;
  status: string;
  category: string;
  language?: string;
  body?: string;
  components?: TemplateComponent[];
}

interface TemplateListResponse {
  data?: Template[];
}

export default function TemplatesPage() {
  const { data: session } = useSession();
  const businessPhoneId = getBusinessPhoneId(session);
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const previewCategory = previewTemplate?.category;
  const previewCategoryLabel = previewCategory
    ? (categoryLabels[previewCategory] ?? previewCategory)
    : undefined;
  const previewStatus = previewTemplate?.status;
  const previewStatusConfig = previewStatus ? statusConfig[previewStatus] : undefined;

  const { data: response, isLoading, mutate } = useSWR<TemplateListResponse | Template[]>(
    session && businessPhoneId
      ? withBusinessPhoneId(endpoints.templates.list, businessPhoneId)
      : null,
    fetcher
  );

  const templates = Array.isArray(response) ? response : response?.data ?? [];

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);
    const formData = new FormData(e.currentTarget);
    try {
      if (!businessPhoneId) {
        throw new Error("No se pudo identificar el negocio autenticado.");
      }

      await apiClient.post(
        withBusinessPhoneId(endpoints.templates.create, businessPhoneId),
        {
          name: formData.get("name"),
          category: formData.get("category"),
          language: formData.get("language"),
          components: [
            { type: "BODY", text: formData.get("body") },
          ],
        }
      );
      mutate();
      setCreateOpen(false);
      toast({
        title: "Template creado",
        description: "La plantilla fue enviada a Meta para aprobación.",
      });
    } catch (error) {
      console.error("Error al crear template:", error);
      toast({
        title: "Error al crear template",
        description: "No se pudo crear la plantilla. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div
      className="space-y-6 max-w-6xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Templates de Mensajes
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestiona las plantillas de mensajes de WhatsApp Business.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors ${
                viewMode === "grid"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${
                viewMode === "list"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Nuevo Template
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Template</DialogTitle>
                <DialogDescription>
                  Crea una nueva plantilla de mensaje para WhatsApp Business.
                  Será enviada a Meta para aprobación.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="ej. bienvenida_cliente"
                    required
                    pattern="[a-z0-9_]+"
                    title="Solo minúsculas, números y guiones bajos"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select name="category" required>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MARKETING">Marketing</SelectItem>
                        <SelectItem value="UTILITY">Utilidad</SelectItem>
                        <SelectItem value="AUTHENTICATION">
                          Autenticación
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Idioma</Label>
                    <Select name="language" defaultValue="es_MX">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es_MX">Español (MX)</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en_US">Inglés (US)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Cuerpo del Mensaje</Label>
                  <Textarea
                    id="body"
                    name="body"
                    placeholder="Hola {{1}}, gracias por tu compra..."
                    rows={4}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Usa {"{{1}}"}, {"{{2}}"}, etc. para variables dinámicas.
                  </p>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Crear Template
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Content */}
      {isLoading ? (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              : "space-y-3"
          }
        >
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-24 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : Array.isArray(templates) && templates.length > 0 ? (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className={
            viewMode === "grid"
              ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3"
              : "space-y-3"
          }
        >
          <AnimatePresence>
            {templates.map((template) => {
              const status =
                statusConfig[template.status] || statusConfig["PENDING"];
              const category =
                categoryLabels[template.category] || template.category;

              return (
                <motion.div
                  key={template.id || template.name}
                  variants={itemVariants}
                  layout
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                >
                  <Card className="h-full hover:border-primary/30 transition-colors duration-200 hover:shadow-md">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {template.name}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1.5">
                            <span className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {category}
                            </span>
                            <span className="text-border">|</span>
                            <span className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              {template.language || "es_MX"}
                            </span>
                          </CardDescription>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground leading-relaxed">
                        <p className="line-clamp-3">
                          {template.body ||
                            template.components?.find((component) => component.type === "BODY")?.text ||
                            "Sin contenido"}
                        </p>
                      </div>
                      <div className="flex items-center justify-end mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 text-xs text-muted-foreground"
                          onClick={() => setPreviewTemplate(template)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Vista Previa
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-1">
                Sin templates
              </h3>
              <p className="text-muted-foreground text-sm text-center max-w-sm mb-4">
                Aún no has creado plantillas de mensajes. Crea tu primera
                plantilla para enviar mensajes programados a tus clientes.
              </p>
              <Button onClick={() => setCreateOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Crear Primer Template
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Vista Previa: {previewTemplate?.name}
            </DialogTitle>
            <DialogDescription>
              {previewCategoryLabel} &middot;{" "}
              {previewTemplate?.language || "es_MX"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* WhatsApp-style message bubble */}
            <div className="bg-[#E7FDD8] dark:bg-emerald-900/30 rounded-xl rounded-tr-sm p-4 shadow-sm border border-emerald-200/50 dark:border-emerald-800/50">
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {previewTemplate?.body ||
                  previewTemplate?.components?.find((component) => component.type === "BODY")?.text ||
                  "Sin contenido"}
              </p>
              <p className="text-[10px] text-muted-foreground text-right mt-2">
                12:00 p.m.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={previewStatusConfig?.variant || "secondary"}>
                {previewStatusConfig?.label || "Pendiente"}
              </Badge>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
