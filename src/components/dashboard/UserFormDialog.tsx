"use client";

import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import React, { useContext, useState, useEffect } from "react";
import { AppContext } from "@/contexts/AppContext";
import { User } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const userPermissionSchema = z.object({
  canRegister: z.boolean().default(false),
  canImport: z.boolean().default(false),
  canExport: z.boolean().default(false),
  canExportHistory: z.boolean().default(false),
});

const userPlazaAccessSchema = z.object({
  plazaName: z.string(),
  hasAccess: z.boolean().default(false),
  permissions: userPermissionSchema,
});

const userFormSchema = z.object({
  username: z.string().min(3, { message: "El usuario debe tener al menos 3 caracteres." }),
  password: z.string().min(4, "La contraseña debe tener al menos 4 caracteres.").optional().or(z.literal('')),
  plazaAccess: z.array(userPlazaAccessSchema),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  editingUser: User | null;
}

export function UserFormDialog({ isOpen, onOpenChange, editingUser }: UserFormDialogProps) {
  const { plazas, addUser, updateUser } = useContext(AppContext);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: "plazaAccess",
  });

  useEffect(() => {
    if (isOpen) {
      const defaultValues = {
        username: editingUser?.username || "",
        password: "",
        plazaAccess: plazas.map(plazaName => {
          const existingAccess = editingUser?.plazas.find(p => p.plazaName === plazaName);
          return {
            plazaName,
            hasAccess: !!existingAccess,
            permissions: existingAccess?.permissions || { canRegister: false, canImport: false, canExport: false, canExportHistory: false },
          };
        }),
      };
      form.reset(defaultValues);
    }
  }, [isOpen, editingUser, plazas, form]);

  const onSubmit = async (values: UserFormData) => {
    setIsSubmitting(true);
    
    const assignedPlazas = values.plazaAccess
      .filter(p => p.hasAccess)
      .map(({ plazaName, permissions }) => ({ plazaName, permissions }));

    const userData = {
      username: values.username,
      plazas: assignedPlazas,
      ...(values.password && { password: values.password }),
    };

    let success = false;
    try {
      if (editingUser) {
        success = await updateUser(editingUser.id, userData);
      } else {
        if (!values.password) {
          form.setError("password", { type: "manual", message: "La contraseña es requerida para nuevos usuarios." });
          setIsSubmitting(false);
          return;
        }
        success = await addUser(userData as Omit<User, 'id'>);
      }

      if (success) {
        toast({
          title: editingUser ? "Usuario actualizado" : "Usuario creado",
          description: `El usuario "${values.username}" ha sido guardado.`,
        });
        onOpenChange(false);
      } else {
        form.setError("username", { type: "manual", message: "Ya existe un usuario con este nombre." });
      }
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingUser ? "Editar Usuario" : "Registrar Nuevo Usuario"}</DialogTitle>
          <DialogDescription>
            {editingUser ? `Editando al usuario "${editingUser.username}".` : "Completa los datos del nuevo usuario."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="username" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de usuario</FormLabel>
                  <FormControl><Input placeholder="Ej. juan_perez" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl><Input type="password" placeholder={editingUser ? "Dejar en blanco para no cambiar" : "••••••••"} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            
            <div className="space-y-2">
              <FormLabel>Acceso y Permisos por Plaza</FormLabel>
              <Accordion type="multiple" className="w-full">
                {fields.map((field, index) => {
                  const hasAccess = form.watch(`plazaAccess.${index}.hasAccess`);
                  return (
                  <AccordionItem key={field.id} value={field.plazaName}>
                    <div className="flex items-center gap-2 border-b">
                      <FormField
                        control={form.control}
                        name={`plazaAccess.${index}.hasAccess`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                       <AccordionTrigger className="py-4 flex-1">{field.plazaName}</AccordionTrigger>
                    </div>
                    {hasAccess && (
                    <AccordionContent>
                      <div className="grid grid-cols-2 gap-4 pl-12 pr-4 pt-2">
                        <FormField control={form.control} name={`plazaAccess.${index}.permissions.canRegister`} render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <FormLabel className="font-normal">Registrar</FormLabel>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name={`plazaAccess.${index}.permissions.canImport`} render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <FormLabel className="font-normal">Importar</FormLabel>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name={`plazaAccess.${index}.permissions.canExport`} render={({ field }) => (
                             <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <FormLabel className="font-normal">Exportar Lista</FormLabel>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name={`plazaAccess.${index}.permissions.canExportHistory`} render={({ field }) => (
                             <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                                <FormLabel className="font-normal">Exportar Historial</FormLabel>
                            </FormItem>
                        )} />
                      </div>
                    </AccordionContent>
                    )}
                  </AccordionItem>
                )})}
              </Accordion>
            </div>
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? "Guardando..." : "Guardar Usuario"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
