
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React, { useContext, useState, useEffect, useMemo } from "react";
import { AppContext } from "@/contexts/AppContext";
import { Client, User, Payment } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, FileDown, Trash2, User as UserIcon, ShieldCheck, DollarSign, Calendar, MapPin, Phone, History } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const clientSchema = z.object({
  nombre: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  direccion: z.string().min(5, { message: "La dirección es requerida." }),
  telefono: z.string().length(10, { message: "El teléfono debe tener 10 dígitos." }).regex(/^\d+$/, "Solo números permitidos."),
  aval: z.string().min(3, { message: "El nombre del aval es requerido." }),
  telefonoAval: z.string().length(10, { message: "El teléfono del aval debe tener 10 dígitos." }).regex(/^\d+$/, "Solo números permitidos."),
  prestamo: z.coerce.number().positive({ message: "El préstamo debe ser mayor a cero." }),
  pago: z.coerce.number().min(0, { message: "El pago no puede ser negativo." }),
  vencidos: z.coerce.number().int().min(0, { message: "Debe ser un número entero no negativo." }),
  adeudo: z.coerce.number().min(0, { message: "El adeudo no puede ser negativo." }),
});

interface ClientFormDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    plazaName: string;
    editingClient: Client | null;
}

const defaultFormValues = {
    nombre: "",
    direccion: "",
    telefono: "",
    aval: "",
    telefonoAval: "",
    prestamo: 0,
    pago: 0,
    vencidos: 0,
    adeudo: 0,
};

export function ClientFormDialog({ isOpen, onOpenChange, plazaName, editingClient }: ClientFormDialogProps) {
    const { addClient, updateClient, deleteClient, deletePayment, currentUser } = useContext(AppContext);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeletePaymentDialogOpen, setIsDeletePaymentDialogOpen] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
    const [confirmationCode, setConfirmationCode] = useState("");
    const isEditMode = !!editingClient;

    const form = useForm<z.infer<typeof clientSchema>>({
        resolver: zodResolver(clientSchema),
        defaultValues: defaultFormValues,
    });
    
    useEffect(() => {
        if (isOpen) {
            if (isEditMode) {
                form.reset(editingClient);
            } else {
                form.reset(defaultFormValues);
            }
        }
    }, [isOpen, editingClient, isEditMode, form]);

    useEffect(() => {
        if (!isDeleteDialogOpen) {
            setConfirmationCode("");
        }
    }, [isDeleteDialogOpen]);

    useEffect(() => {
        if (!isDeletePaymentDialogOpen) {
            setPaymentToDelete(null);
        }
    }, [isDeletePaymentDialogOpen]);
    
    const isUserAdmin = useMemo(() => {
        if (!currentUser) return false;
        return !('plazas' in currentUser);
    }, [currentUser]);

    const canExportHistory = useMemo(() => {
        if (!currentUser) return false;
        if (isUserAdmin) return true; // Admin

        const user = currentUser as User;
        if (!user.plazas) return false;
        
        const plazaAccess = user.plazas.find(p => p.plazaName === plazaName);
        return plazaAccess?.permissions.canExportHistory ?? false;
    }, [currentUser, plazaName, isUserAdmin]);

    const handleDelete = async () => {
        if (!editingClient) return;

        if (confirmationCode !== '0120') {
            toast({
                variant: "destructive",
                title: "Código incorrecto",
                description: "El código de confirmación no es válido. No se eliminó el cliente.",
            });
            return;
        }

        await deleteClient(editingClient.id);
        toast({
            title: "Cliente eliminado",
            description: `El cliente "${editingClient.nombre}" ha sido eliminado.`,
        });
        setIsDeleteDialogOpen(false);
        onOpenChange(false);
    };
    
    const handleDeletePayment = async () => {
        if (!editingClient || !paymentToDelete) return;
        await deletePayment(editingClient.id, paymentToDelete.id);
        toast({
            title: "Pago eliminado",
            description: `El abono de $${paymentToDelete.monto.toLocaleString()} ha sido eliminado y la deuda ha sido actualizada.`,
        });
        setIsDeletePaymentDialogOpen(false);
    };

    const handleExportPDF = () => {
        if (!editingClient) return;

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        const client = editingClient;

        // 1. Top Decorative Indigo Band
        doc.setFillColor(79, 70, 229); // Indigo-600
        doc.rect(15, 15, 180, 5, 'F');

        // 2. Document Title and Plaza Details
        doc.setFont("helvetica", "bold");
        doc.setFontSize(18);
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.text("ESTADO DE CUENTA", 15, 30);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139); // Slate-500
        const dateStr = new Date().toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        doc.text(`Plaza: ${client.plaza.toUpperCase()}  |  Fecha de emisión: ${dateStr}`, 15, 36);

        // 3. Separator Line
        doc.setDrawColor(226, 232, 240); // Slate-200
        doc.setLineWidth(0.5);
        doc.line(15, 40, 195, 40);

        // 4. Client Info & Financial Summary Recuadro
        doc.setFillColor(248, 250, 252); // Slate-50 background
        doc.rect(15, 45, 180, 45, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(15, 45, 180, 45, 'S');

        // Left Column: Client Details
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(79, 70, 229); // Indigo Accent
        doc.text("DATOS DEL CLIENTE", 20, 52);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85); // Slate-700
        doc.text(`Nombre: ${client.nombre.toUpperCase()}`, 20, 58);
        doc.text(`Dirección: ${client.direccion}`, 20, 64);
        doc.text(`Teléfono: ${client.telefono}`, 20, 70);
        doc.text(`Aval: ${client.aval.toUpperCase()} (${client.telefonoAval || "-"})`, 20, 76);
        doc.text(`Fecha de Registro: ${client.fecha}`, 20, 82);

        // Right Column: Financial Summary
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(79, 70, 229); // Indigo Accent
        doc.text("RESUMEN DE CUENTA", 110, 52);

        const totalPaid = client.prestamo - client.adeudo;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(51, 65, 85);
        doc.text(`Monto Prestado: $${client.prestamo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 110, 58);
        doc.text(`Total Abonado: $${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 110, 64);
        doc.text(`Adeudo Pendiente: $${client.adeudo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 110, 70);
        doc.text(`Pagos Vencidos: ${client.vencidos}`, 110, 76);

        // 5. Payment History Section Title
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(30, 41, 59); // Slate-800
        doc.text("HISTORIAL DE ABONOS", 15, 102);

        // 6. Payment History Table
        let lastY = 104;
        if (client.historialPagos && client.historialPagos.length > 0) {
            autoTable(doc, {
                startY: 106,
                head: [['Fecha de Abono', 'Monto Abonado', 'Saldo Anterior', 'Saldo Pendiente']],
                body: client.historialPagos.slice().reverse().map(p => [
                    p.fecha,
                    `$${p.monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    `$${p.saldoAnterior.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    `$${p.saldoNuevo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                ]),
                theme: 'striped',
                styles: { 
                    fontSize: 8, 
                    cellPadding: 3,
                    lineColor: [241, 245, 249],
                    lineWidth: 0.2
                },
                headStyles: { 
                    fillColor: [79, 70, 229], 
                    textColor: [255, 255, 255], 
                    fontStyle: 'bold', 
                    fontSize: 8.5 
                },
                alternateRowStyles: { 
                    fillColor: [248, 250, 252] 
                },
                columnStyles: { 
                    0: { halign: 'left' }, 
                    1: { halign: 'right', fontStyle: 'bold', textColor: [16, 185, 129] }, // emerald green
                    2: { halign: 'right' }, 
                    3: { halign: 'right', fontStyle: 'bold', textColor: [225, 29, 72] }  // rose red
                },
                didDrawPage: (data) => {
                    lastY = data.cursor ? data.cursor.y : lastY;
                }
            });
        } else {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(8.5);
            doc.setTextColor(148, 163, 184); // Slate-400
            doc.text("No se registran abonos en el historial de este cliente.", 15, 110);
            lastY = 115;
        }

        // 7. Signature Line (Discreet)
        if (lastY < 240) {
            const sigY = 250;
            doc.setDrawColor(203, 213, 225); // Slate-300
            doc.setLineWidth(0.5);
            doc.line(75, sigY, 135, sigY);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text("Firma de Conformidad", 105, sigY + 4, { align: "center" });
        }

        // 8. Footer (Page numbers, legal watermark)
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7.5);
            doc.setTextColor(148, 163, 184); // Slate-400
            doc.text("Planet Cartera  |  Reporte Oficial de Control Interno", 15, 285);
            doc.text(`Página ${i} de ${pageCount}`, 195, 285, { align: "right" });
        }

        doc.save(`estado_cuenta_${client.nombre.toLowerCase().replace(/ /g, '_')}.pdf`);
    };

    async function onSubmit(values: z.infer<typeof clientSchema>) {
        setIsSubmitting(true);
        try {
            const dataToSubmit = {
                ...values,
                recuperado: values.adeudo <= 0,
            };

            if (isEditMode) {
                const clientDataToUpdate: Partial<Client> = { ...dataToSubmit };
                // Ensure historialPagos is not unintentionally erased if it exists
                if (!clientDataToUpdate.historialPagos) {
                   delete clientDataToUpdate.historialPagos;
                }
                await updateClient(editingClient.id, clientDataToUpdate);
                toast({
                    title: "Cliente Actualizado",
                    description: `Los datos de "${values.nombre}" han sido actualizados.`,
                });
            } else {
                const currentDate = new Date().toLocaleDateString('es-GB');
                await addClient({
                    ...dataToSubmit,
                    plaza: plazaName,
                    fecha: currentDate,
                });
                toast({
                    title: "Cliente Registrado",
                    description: `El cliente "${values.nombre}" ha sido añadido a la plaza ${plazaName}.`,
                });
            }
            onOpenChange(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: `No se pudo ${isEditMode ? 'actualizar' : 'registrar'} al cliente.`,
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-2xl border border-slate-200">
                    <DialogHeader className="pb-3 border-b border-slate-100">
                        <DialogTitle className="text-base font-bold text-slate-800">{isEditMode ? "Ver / Editar Cliente" : "Registrar Nuevo Cliente"}</DialogTitle>
                        <DialogDescription className="text-xs text-slate-500">
                            {isEditMode 
                                ? `Editando los datos de ${editingClient.nombre}.` 
                                : `Complete los datos para registrar un nuevo cliente en la plaza "${plazaName}".`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[75vh] overflow-y-auto px-1">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {/* Left Column: Personal Info & Aval */}
                                    <div className="space-y-4">
                                        {/* Client Info Card */}
                                        <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-100 space-y-3">
                                            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200/60 mb-2">
                                                <UserIcon className="h-3.5 w-3.5 text-primary" />
                                                <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Datos del Cliente</h3>
                                            </div>
                                            <FormField control={form.control} name="nombre" render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nombre Completo</FormLabel>
                                                    <FormControl><Input placeholder="Juan Perez" className="h-8 text-xs bg-white border-slate-200" {...field} /></FormControl>
                                                    <FormMessage className="text-[10px] text-rose-500" />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="telefono" render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Teléfono</FormLabel>
                                                    <FormControl><Input placeholder="3171234567" className="h-8 text-xs bg-white border-slate-200" {...field} /></FormControl>
                                                    <FormMessage className="text-[10px] text-rose-500" />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="direccion" render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Dirección</FormLabel>
                                                    <FormControl><Input placeholder="Calle Falsa 123" className="h-8 text-xs bg-white border-slate-200" {...field} /></FormControl>
                                                    <FormMessage className="text-[10px] text-rose-500" />
                                                </FormItem>
                                            )} />
                                        </div>

                                        {/* Aval Info Card */}
                                        <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-100 space-y-3">
                                            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200/60 mb-2">
                                                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                                                <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Garantía (Aval)</h3>
                                            </div>
                                            <FormField control={form.control} name="aval" render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Nombre del Aval</FormLabel>
                                                    <FormControl><Input placeholder="Maria Lopez" className="h-8 text-xs bg-white border-slate-200" {...field} /></FormControl>
                                                    <FormMessage className="text-[10px] text-rose-500" />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="telefonoAval" render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Teléfono del Aval</FormLabel>
                                                    <FormControl><Input placeholder="3177654321" className="h-8 text-xs bg-white border-slate-200" {...field} /></FormControl>
                                                    <FormMessage className="text-[10px] text-rose-500" />
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>

                                    {/* Right Column: Financial Info Card */}
                                    <div className="bg-slate-50/50 p-4 rounded-lg border border-slate-100 space-y-3 flex flex-col justify-between">
                                        <div className="space-y-3 w-full">
                                            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-200/60 mb-2">
                                                <DollarSign className="h-3.5 w-3.5 text-primary" />
                                                <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Detalles del Préstamo</h3>
                                            </div>
                                            <FormField control={form.control} name="prestamo" render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Monto del Préstamo ($)</FormLabel>
                                                    <FormControl><Input type="number" step="0.01" placeholder="5000" className="h-8 text-xs bg-white border-slate-200" {...field} /></FormControl>
                                                    <FormMessage className="text-[10px] text-rose-500" />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="pago" render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Monto de Pago ($)</FormLabel>
                                                    <FormControl><Input type="number" step="0.01" placeholder="2500" className="h-8 text-xs bg-white border-slate-200" {...field} /></FormControl>
                                                    <FormMessage className="text-[10px] text-rose-500" />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="vencidos" render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">No. Vencidos</FormLabel>
                                                    <FormControl><Input type="number" step="1" placeholder="3" className="h-8 text-xs bg-white border-slate-200" {...field} /></FormControl>
                                                    <FormMessage className="text-[10px] text-rose-500" />
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="adeudo" render={({ field }) => (
                                                <FormItem className="space-y-1">
                                                    <FormLabel className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Adeudo Actual ($)</FormLabel>
                                                    <FormControl><Input type="number" step="0.01" placeholder="2500" className="h-8 text-xs bg-white border-slate-200" {...field} /></FormControl>
                                                    <FormMessage className="text-[10px] text-rose-500" />
                                                </FormItem>
                                            )} />
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter className="pt-3 sticky bottom-0 bg-white border-t border-slate-100 py-3 flex-wrap justify-between gap-3 mt-4 z-20">
                                    <div className="flex gap-2 items-center">
                                        {isEditMode && canExportHistory && (
                                            <Button type="button" variant="outline" className="h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-50" onClick={handleExportPDF}>
                                                <FileDown className="mr-1.5 h-3.5 w-3.5 text-slate-400" /> Exportar Historial
                                            </Button>
                                        )}
                                        {isEditMode && isUserAdmin && (
                                            <Button type="button" variant="ghost" className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50" onClick={() => setIsDeleteDialogOpen(true)}>
                                                <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Eliminar Cliente
                                            </Button>
                                        )}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <Button type="button" variant="outline" className="h-8 text-xs border-slate-200 text-slate-700 hover:bg-slate-50" onClick={() => onOpenChange(false)}>Cancelar</Button>
                                        <Button type="submit" className="h-8 text-xs bg-primary hover:bg-primary/95 text-white shadow-sm px-4" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                                            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                                        </Button>
                                    </div>
                                </DialogFooter>
                            </form>
                        </Form>
                        {isEditMode && editingClient.historialPagos && editingClient.historialPagos.length > 0 && (
                            <div className="mt-5 border-t border-slate-100 pt-5 pb-2">
                                <div className="flex items-center gap-1.5 mb-3">
                                    <History className="h-3.5 w-3.5 text-primary" />
                                    <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Historial de Pagos</h3>
                                </div>
                                <div className="rounded-lg border border-slate-200 max-h-48 overflow-y-auto bg-white shadow-sm">
                                    <Table className="text-xs">
                                        <TableHeader className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha</TableHead>
                                                <TableHead className="px-3 py-2 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Monto</TableHead>
                                                <TableHead className="px-3 py-2 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Saldo Anterior</TableHead>
                                                <TableHead className="px-3 py-2 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Saldo Nuevo</TableHead>
                                                {isUserAdmin && <TableHead className="px-3 py-2 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">Acción</TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody className="divide-y divide-slate-100">
                                            {editingClient.historialPagos.slice().reverse().map((pago, index) => (
                                                <TableRow key={`${pago.id}-${index}`} className="hover:bg-slate-50/50 transition-colors">
                                                    <TableCell className="px-3 py-2 font-medium text-slate-600">{pago.fecha}</TableCell>
                                                    <TableCell className="px-3 py-2 text-right font-bold text-emerald-600">${pago.monto.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                                    <TableCell className="px-3 py-2 text-right text-slate-500">${pago.saldoAnterior.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                                    <TableCell className="px-3 py-2 text-right text-slate-700 font-medium">${pago.saldoNuevo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                                                    {isUserAdmin && (
                                                        <TableCell className="px-3 py-1.5 text-right">
                                                            <Button 
                                                                variant="ghost" 
                                                                size="icon" 
                                                                className="h-6 w-6 hover:bg-rose-50 text-rose-500 hover:text-rose-600 rounded"
                                                                onClick={() => {
                                                                    setPaymentToDelete(pago);
                                                                    setIsDeletePaymentDialogOpen(true);
                                                                }}>
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </TableCell>
                                                    )}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmación de Eliminación</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción es permanente y no se puede deshacer. Para confirmar, ingrese el código de seguridad.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-2">
                        <Input 
                            value={confirmationCode}
                            onChange={(e) => setConfirmationCode(e.target.value)}
                            placeholder="Ingrese el código de seguridad"
                            maxLength={4}
                            autoFocus
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={confirmationCode !== '0120'} className="bg-destructive hover:bg-destructive/90">
                            Sí, eliminar cliente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={isDeletePaymentDialogOpen} onOpenChange={setIsDeletePaymentDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar este abono?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. El monto de <strong>${paymentToDelete?.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> se sumará de nuevo a la deuda del cliente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive hover:bg-destructive/90">
                            Sí, eliminar abono
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

    