"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "@/contexts/AppContext";
import { Client } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface PaymentDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    client: Client | null;
}

export function PaymentDialog({ isOpen, onOpenChange, client }: PaymentDialogProps) {
    const { addPayment } = useContext(AppContext);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const paymentSchema = z.object({
      monto: z.coerce.number()
        .positive({ message: "El monto debe ser mayor a cero." })
        .max(client?.adeudo ?? Infinity, { message: "El monto no puede ser mayor al adeudo." }),
    });

    const form = useForm<z.infer<typeof paymentSchema>>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
          monto: 0,
        },
    });
    
    useEffect(() => {
        if (!isOpen) {
            form.reset({ monto: 0 });
        }
    }, [isOpen, form]);

    if (!client) return null;

    async function onSubmit(values: z.infer<typeof paymentSchema>) {
        setIsSubmitting(true);
        try {
            addPayment(client!.id, values.monto);
            toast({
                title: "Pago Registrado",
                description: `Se ha registrado un abono de $${values.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })} para ${client!.nombre}.`,
            });
            onOpenChange(false);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se pudo registrar el pago.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Abonar a Deuda</DialogTitle>
                    <DialogDescription>
                        Registrar un pago para <strong>{client.nombre}</strong>.
                        <br/>
                        Adeudo actual: <span className="font-bold text-destructive">${client.adeudo.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="monto" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Monto del Abono ($)</FormLabel>
                                <FormControl><Input type="number" step="0.01" placeholder="0.00" {...field} autoFocus /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSubmitting ? "Guardando..." : "Realizar Pago"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
