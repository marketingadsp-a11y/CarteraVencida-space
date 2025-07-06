"use client";

import { useContext, useState } from "react";
import { AppContext } from "@/contexts/AppContext";
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
import { PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";

const plazaSchema = z.object({
  name: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
});

export default function PlazasManagementPage() {
  const { plazas, addPlaza, updatePlaza, deletePlaza } = useContext(AppContext);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPlaza, setEditingPlaza] = useState<string | null>(null);

  const form = useForm<z.infer<typeof plazaSchema>>({
    resolver: zodResolver(plazaSchema),
    defaultValues: { name: "" },
  });

  const handleAddNew = () => {
    setEditingPlaza(null);
    form.reset({ name: "" });
    setIsDialogOpen(true);
  };

  const handleEdit = (plazaName: string) => {
    setEditingPlaza(plazaName);
    form.setValue("name", plazaName);
    setIsDialogOpen(true);
  };

  const handleDelete = async (plazaName: string) => {
    const success = await deletePlaza(plazaName);
    if (success) {
      toast({
        title: "Plaza eliminada",
        description: `La plaza "${plazaName}" ha sido eliminada.`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error al eliminar",
        description: "No se puede eliminar una plaza que tiene clientes asignados.",
      });
    }
  };

  async function onSubmit(values: z.infer<typeof plazaSchema>) {
    setIsSubmitting(true);
    let success = false;
    try {
      if (editingPlaza) {
        success = await updatePlaza(editingPlaza, values.name);
      } else {
        success = await addPlaza(values.name);
      }

      if (success) {
        toast({
          title: editingPlaza ? "Plaza actualizada" : "Plaza creada",
          description: `La plaza "${values.name}" ha sido guardada.`,
        });
        setIsDialogOpen(false);
      } else {
        form.setError("name", {
          type: "manual",
          message: "Ya existe una plaza con este nombre.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold font-headline tracking-tight">Gestión de Plazas</h1>
            <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2" />
                Registrar Nueva Plaza
            </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Plazas Existentes</CardTitle>
            <CardDescription>
              Aquí puedes editar y eliminar las plazas de la cartera.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="w-[180px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plazas.length > 0 ? (
                    plazas.map((plaza) => (
                      <TableRow key={plaza}>
                        <TableCell className="font-medium">{plaza}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(plaza)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás realmente seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Se eliminará permanentemente la plaza "{plaza}". 
                                    No podrás eliminarla si tiene clientes asignados.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(plaza)} className="bg-destructive hover:bg-destructive/90">
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
                        No hay plazas registradas.
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
            <DialogTitle>{editingPlaza ? "Editar Plaza" : "Registrar Nueva Plaza"}</DialogTitle>
            <DialogDescription>
              {editingPlaza
                ? `Estás editando la plaza "${editingPlaza}".`
                : "Ingresa el nombre para la nueva plaza."}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Plaza</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. ZAPOTLAN EL GRANDE" {...field} autoFocus />
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
