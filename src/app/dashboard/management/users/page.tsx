"use client";

import { useContext, useState, useEffect } from "react";
import { AppContext } from "@/contexts/AppContext";
import { User } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, UsersRound, Badge } from "lucide-react";
import { UserFormDialog } from "@/components/dashboard/UserFormDialog";

export default function UsersManagementPage() {
  const { users, deleteUser } = useContext(AppContext);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleAddNew = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleDelete = (userId: number) => {
    deleteUser(userId);
    toast({
        title: "Usuario eliminado",
        description: `El usuario ha sido eliminado correctamente.`,
    });
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold font-headline tracking-tight">Gestión de Usuarios</h1>
            <Button onClick={handleAddNew}>
                <PlusCircle className="mr-2" />
                Registrar Nuevo Usuario
            </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios</CardTitle>
            <CardDescription>
              Aquí puedes editar y eliminar los usuarios del sistema y sus permisos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre de Usuario</TableHead>
                    <TableHead>Plazas Asignadas</TableHead>
                    <TableHead className="w-[180px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium flex items-center gap-2">
                            <UsersRound className="h-4 w-4 text-muted-foreground" />
                            {user.username}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.plazas.length > 0 ? user.plazas.map(p => (
                              <span key={p.plazaName} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-full">{p.plazaName}</span>
                            )) : <span className="text-xs text-muted-foreground">Ninguna</span>}
                          </div>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(user)}>
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
                                    Esta acción no se puede deshacer. Se eliminará permanentemente al usuario "{user.username}".
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(user.id)} className="bg-destructive hover:bg-destructive/90">
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
                      <TableCell colSpan={3} className="h-24 text-center">
                        No hay usuarios registrados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <UserFormDialog 
        isOpen={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        editingUser={editingUser}
      />
    </>
  );
}
