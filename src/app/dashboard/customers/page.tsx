"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSession } from "next-auth/react";
import { motion, Variants } from "framer-motion";
import useSWR from "swr";
import { endpoints } from "@/lib/api";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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

    // TODO: Obtener del usuario logueado
    const businessPhoneId = "1039767285877200";

    // Solo hacer fetch si hay sesión
    const { data: response, isLoading } = useSWR(
        session ? `${endpoints.customers.list}?business_phone_id=${businessPhoneId}` : null
    );

    const customers = response?.data || [];

    // Fila rápida de filtrado
    const filteredCustomers = customers.filter((c: any) =>
        (c.name && c.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (c.phone_number && c.phone_number.includes(searchTerm))
    );

    return (
        <motion.div
            className="space-y-6 max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="show"
        >
            <motion.div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" variants={itemVariants}>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Gestión de Clientes
                    </h1>
                    <p className="text-muted-foreground mt-2">
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

            <motion.div className="rounded-xl border border-border bg-background overflow-hidden shadow-sm" variants={itemVariants}>
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="border-border">
                            <TableHead className="w-[200px]">Nombre</TableHead>
                            <TableHead>WhatsApp ID</TableHead>
                            <TableHead>Fecha de Registro</TableHead>
                            <TableHead>Notas</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-40 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                        Cargando base de datos...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                                    No se encontraron clientes.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCustomers.map((customer: any) => (
                                <TableRow key={customer.id} className="border-border hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium text-foreground">
                                        {customer.name}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        +{customer.phone_number}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {format(new Date(customer.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                                        {customer.notes || "—"}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </motion.div>
        </motion.div>
    );
}
