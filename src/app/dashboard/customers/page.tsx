"use client";

import { useState } from "react";
import { Search, Loader2, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSession } from "next-auth/react";
import { motion, Variants } from "framer-motion";
import useSWR from "swr";
import { endpoints } from "@/lib/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getSessionBusinessPhoneId } from "@/lib/business";
import { CustomerDialog, type Customer } from "@/components/customers/customer-dialog";

const TAG_COLORS: Record<string, string> = {
    VIP: "bg-yellow-100 text-yellow-800 border-yellow-200",
    Mayoreo: "bg-blue-100 text-blue-800 border-blue-200",
    Credito: "bg-red-100 text-red-800 border-red-200",
    Frecuente: "bg-green-100 text-green-800 border-green-200",
};

const containerVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3, staggerChildren: 0.1 } }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
};

export default function CustomersPage() {
    const { data: session } = useSession();
    const [searchTerm, setSearchTerm] = useState("");
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    const sessionBusinessPhoneId = getSessionBusinessPhoneId(session);

    const { data: response, isLoading, mutate } = useSWR(
        session && sessionBusinessPhoneId ? endpoints.customers.list : null
    );

    const customers = (response?.data || []) as Customer[];

    const filteredCustomers = customers.filter((customer) =>
        (customer.name && customer.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (customer.phone_number && customer.phone_number.includes(searchTerm))
    );

    function openEdit(customer: Customer) {
        setEditingCustomer(customer);
        setDialogOpen(true);
    }

    return (
        <motion.div
            className="space-y-6 max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <motion.div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" variants={itemVariants}>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                        Gestión de Clientes
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Base de datos de tus clientes que han interactuado por WhatsApp.
                    </p>
                </div>
            </motion.div>

            <motion.div className="flex items-center gap-2" variants={itemVariants}>
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Buscar por nombre o teléfono..."
                        className="pl-9 bg-background focus-visible:ring-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </motion.div>

            <motion.div className="rounded-2xl border border-border/60 bg-background overflow-hidden shadow-sm" variants={itemVariants}>
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="border-border">
                            <TableHead className="w-[200px]">Nombre</TableHead>
                            <TableHead>WhatsApp</TableHead>
                            <TableHead>Etiquetas</TableHead>
                            <TableHead>Notas</TableHead>
                            <TableHead>Registro</TableHead>
                            <TableHead className="w-[60px]" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                        Cargando base de datos...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                    No se encontraron clientes.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <TableRow key={customer.id} className="border-border hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium text-foreground">
                                        {customer.name || <span className="text-muted-foreground italic">Sin nombre</span>}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        +{customer.phone_number}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {(customer.tags ?? []).length > 0
                                                ? customer.tags!.map((tag) => (
                                                    <span
                                                        key={tag}
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${TAG_COLORS[tag] ?? "bg-muted text-muted-foreground border-border"}`}
                                                    >
                                                        {tag}
                                                    </span>
                                                ))
                                                : <span className="text-muted-foreground text-sm">—</span>
                                            }
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                                        {customer.notes || "—"}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(customer.created_at), 'dd MMM yyyy', { locale: es })}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                            onClick={() => openEdit(customer)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                </div>
            </motion.div>

            <CustomerDialog
                customer={editingCustomer}
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSuccess={() => mutate()}
            />
        </motion.div>
    );
}
