"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "@/contexts/AppContext";
import { Client } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
    const { addClient, updateClient } = useContext(AppContext);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    async function onSubmit(values: z.infer<typeof clientSchema>) {
        setIsSubmitting(true);
        try {
            if (isEditMode) {
                updateClient(editingClient.id, values);
                toast({
                    title: "Cliente Actualizado",
                    description: `Los datos de "${values.nombre}" han sido actualizados.`,
                });
            } else {
                const currentDate = new Date().toLocaleDateString('es-GB');
                addClient({
                    ...values,
                    plaza: plazaName,
                    fecha: currentDate,
                    recuperado: false,
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
                            <DialogFooter className="pt-4 sticky bottom-0 bg-background py-4">
                                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                                </Button>
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
    );
}
