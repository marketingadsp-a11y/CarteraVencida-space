"use client";

import { useContext, useState, useEffect } from "react";
import { AppContext } from "@/contexts/AppContext";
import { Admin } from "@/lib/constants";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, KeyRound, Loader2 } from "lucide-react";

const adminSchema = z.object({
  username: z.string().min(3, { message: "El usuario debe tener al menos 3 caracteres." }),
  password: z.string().min(4, { message: "La contraseña debe tener al menos 4 caracteres." }).optional().or(z.literal('')),
});

export default function AdminsManagementPage() {
  const { admins, addAdmin, updateAdmin, deleteAdmin } = useContext(AppContext);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);

  const form = useForm<z.infer<typeof adminSchema>>({
    resolver: zodResolver(adminSchema),
    defaultValues: { username: "", password: "" },
  });

  useEffect(() => {
    if (editingAdmin) {
      form.setValue("username", editingAdmin.username);
      form.setValue("password", "");
    } else {
      form.reset({ username: "", password: "" });
    }
  }, [editingAdmin, form, isDialogOpen]);

  const handleAddNew = () => {
    setEditingAdmin(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setIsDialogOpen(true);
  };

  const handleDelete = async (adminId: string) => {
    const success = await deleteAdmin(adminId);
    if (success) {
      toast({
        title: "Administrador eliminado",
        description: `El administrador ha sido eliminado.`,
      });
    } else {
        toast({
            variant: "destructive",
            title: "Error al eliminar",
            description: "No se puede eliminar el último administrador.",
        });
    }
  };

  async function onSubmit(values: z.infer<typeof adminSchema>) {
    setIsSubmitting(true);
    try {
      if (editingAdmin) {
        const success = await updateAdmin(editingAdmin.id, {
          username: values.username,
          ...(values.password && { password: values.password }),
        });
        if (success) {
          toast({
            title: "Administrador actualizado",
            description: `Los datos del administrador "${values.username}" han sido actualizados.`,
          });
          setIsDialogOpen(false);
        } else {
          form.setError("username", {
            type: "manual",
            message: "Ya existe un administrador con este nombre de usuario.",
          });
        }
      } else {
        if (!values.password) {
          form.setError("password", { type: "manual", message: "La contraseña es requerida." });
          return;
        }
        const success = await addAdmin({ username: values.username, password: values.password });
        if (success) {
          toast({
            title: "Administrador registrado",
            description: `El administrador "${values.username}" ha sido creado.`,
          });
          setIsDialogOpen(false);
        } else {
          form.setError("username", {
            type: "manual",
            message: "Ya existe un administrador con este nombre de usuario.",
          });
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold font-headline tracking-tight">Gestión de Administradores</h1>
            <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2" />
                Registrar Nuevo Admin
            </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Administradores</CardTitle>
            <CardDescription>
              Aquí puedes editar y eliminar los administradores del sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre de Usuario</TableHead>
                    <TableHead className="w-[180px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.length > 0 ? (
                    admins.map((admin) => (
                      <TableRow key={admin.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                            <KeyRound className="h-4 w-4 text-muted-foreground" />
                            {admin.username}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(admin)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" disabled={admins.length <= 1}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Se eliminará permanentemente al administrador "{admin.username}". 
                                    No puedes eliminar al último administrador.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(admin.id)} className="bg-destructive hover:bg-destructive/90">
                                    Sí, eliminar
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>

                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        No hay administradores registrados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingAdmin ? "Editar Administrador" : "Registrar Nuevo Administrador"}</DialogTitle>
            <DialogDescription>
              {editingAdmin
                ? `Estás editando al administrador "${editingAdmin.username}".`
                : "Ingresa los datos para el nuevo administrador."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de usuario</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. admin_zapotlan" {...field} autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder={editingAdmin ? "Dejar en blanco para no cambiar" : "••••••••"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
