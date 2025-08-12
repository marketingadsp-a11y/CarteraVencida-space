
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React, { useContext, useState, useEffect, useMemo } from "react";
import { AppContext } from "@/contexts/AppContext";
import { Client, User } from "@/lib/constants";
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
import { Loader2, FileDown, Trash2 } from "lucide-react";
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
    const { addClient, updateClient, deleteClient, currentUser } = useContext(AppContext);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

    const handleExportPDF = () => {
        if (!editingClient) return;

        const doc = new jsPDF();
        const client = editingClient;

        doc.setFontSize(18);
        doc.text(`Historial de Cliente: ${client.nombre}`, 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);

        // Client details
        let y = 35;
        doc.text(`Plaza: ${client.plaza}`, 14, y);
        doc.text(`Fecha de registro: ${client.fecha}`, 14, y += 7);
        doc.text(`Dirección: ${client.direccion}`, 14, y += 7);
        doc.text(`Teléfono: ${client.telefono}`, 14, y += 7);
        doc.text(`Aval: ${client.aval}`, 14, y += 7);
        doc.text(`Teléfono Aval: ${client.telefonoAval}`, 14, y += 7);
        
        y += 10;
        doc.setFontSize(12);
        doc.text('Resumen Financiero', 14, y);
        doc.setFontSize(11);
        doc.text(`Préstamo Original: $${client.prestamo.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 14, y += 7);
        doc.text(`Pagos Totales: $${(client.prestamo - client.adeudo).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 14, y += 7);
        doc.text(`Adeudo Actual: $${client.adeudo.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 14, y += 7);
        doc.text(`No. Vencidos: ${client.vencidos}`, 14, y += 7);
        
        // Payment history
        if (client.historialPagos && client.historialPagos.length > 0) {
            autoTable(doc, {
                startY: y + 10,
                head: [['Fecha', 'Monto', 'Saldo Anterior', 'Saldo Nuevo']],
                body: client.historialPagos.slice().reverse().map(p => [
                    p.fecha,
                    `$${p.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                    `$${p.saldoAnterior.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                    `$${p.saldoNuevo.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                ]),
                theme: 'grid',
                styles: { fontSize: 8 },
                headStyles: { fontStyle: 'bold' },
            });
        } else {
            doc.text('No hay historial de pagos.', 14, y + 15);
        }
        
        doc.save(`historial_${client.nombre.replace(/ /g, '_')}.pdf`);
    };

    async function onSubmit(values: z.infer<typeof clientSchema>) {
        setIsSubmitting(true);
        try {
            const dataToSubmit = {
                ...values,
                recuperado: values.adeudo <= 0,
            };

            if (isEditMode) {
                await updateClient(editingClient.id, dataToSubmit);
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
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{isEditMode ? "Ver / Editar Cliente" : "Registrar Nuevo Cliente"}</DialogTitle>
                        <DialogDescription>
                            {isEditMode 
                                ? `Editando los datos de ${editingClient.nombre}.` 
                                : `Complete los datos para registrar un nuevo cliente en la plaza "${plazaName}".`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[70vh] overflow-y-auto px-2 -mx-2">
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="nombre" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre Completo</FormLabel>
                                            <FormControl><Input placeholder="Juan Perez" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="direccion" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Dirección</FormLabel>
                                            <FormControl><Input placeholder="Calle Falsa 123" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="telefono" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Teléfono</FormLabel>
                                            <FormControl><Input placeholder="3171234567" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="aval" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nombre del Aval</FormLabel>
                                            <FormControl><Input placeholder="Maria Lopez" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="telefonoAval" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Teléfono del Aval</FormLabel>
                                            <FormControl><Input placeholder="3177654321" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="prestamo" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Monto del Préstamo ($)</FormLabel>
                                            <FormControl><Input type="number" step="0.01" placeholder="5000" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="pago" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Monto de Pago ($)</FormLabel>
                                            <FormControl><Input type="number" step="0.01" placeholder="2500" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="vencidos" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>No. Vencidos</FormLabel>
                                            <FormControl><Input type="number" step="1" placeholder="3" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="adeudo" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Adeudo Actual ($)</FormLabel>
                                            <FormControl><Input type="number" step="0.01" placeholder="2500" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </div>
                                <DialogFooter className="pt-4 sticky bottom-0 bg-background py-4 flex-wrap justify-between">
                                    <div className="flex gap-2 items-center">
                                        {isEditMode && canExportHistory && (
                                            <Button type="button" variant="secondary" onClick={handleExportPDF}>
                                                <FileDown className="mr-2 h-4 w-4" /> Exportar Historial
                                            </Button>
                                        )}
                                        {isEditMode && isUserAdmin && (
                                            <Button type="button" variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Eliminar Cliente
                                            </Button>
                                        )}
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                                        </Button>
                                    </div>
                                </DialogFooter>
                            </form>
                        </Form>
                        {isEditMode && editingClient.historialPagos && editingClient.historialPagos.length > 0 && (
                            <div className="mt-6">
                                <Separator />
                                <h3 className="text-lg font-medium my-4">Historial de Pagos</h3>
                                <div className="rounded-md border max-h-48 overflow-y-auto">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-muted">
                                            <TableRow>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead className="text-right">Monto</TableHead>
                                                <TableHead className="text-right">Saldo Anterior</TableHead>
                                                <TableHead className="text-right">Saldo Nuevo</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {editingClient.historialPagos.slice().reverse().map((pago, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{pago.fecha}</TableCell>
                                                    <TableCell className="text-right font-medium text-green-600">${pago.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                                                    <TableCell className="text-right">${pago.saldoAnterior.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
                                                    <TableCell className="text-right">${pago.saldoNuevo.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
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
                            placeholder="Ingrese el código de 4 dígitos"
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
        </>
    );
}
