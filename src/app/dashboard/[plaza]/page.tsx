"use client";

import { useContext, useMemo, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Client, User } from '@/lib/constants';
import { ClientCard } from '@/components/dashboard/ClientCard';
import StatCard from '@/components/dashboard/StatCard';
import { Wallet, Users, UserCheck, Search, UserPlus, Upload, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImportDialog } from '@/components/dashboard/ImportDialog';
import { ClientFormDialog } from '@/components/dashboard/ClientFormDialog';
import { PaymentDialog } from '@/components/dashboard/PaymentDialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function PlazaPage({ params }: { params: { plaza: string } }) {
  const { clients, currentUser } = useContext(AppContext);
  const plazaName = decodeURIComponent(params.plaza);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [payingClient, setPayingClient] = useState<Client | null>(null);

  const permissions = useMemo(() => {
    const defaultPermissions = { canRegister: false, canImport: false, canExport: false, hasAccess: false };
    if (!currentUser) return defaultPermissions;

    const isRegularUser = 'plazas' in currentUser;

    if (!isRegularUser) { // It's an Admin
      return { canRegister: true, canImport: true, canExport: true, hasAccess: true };
    }
    
    const user = currentUser as User;
    if (!user.plazas) return defaultPermissions;
    const plazaAccess = user.plazas.find(p => p.plazaName === plazaName);

    if (plazaAccess) {
      return { ...plazaAccess.permissions, hasAccess: true };
    }

    return defaultPermissions;
  }, [currentUser, plazaName]);

  const plazaClients = useMemo(() => {
    return clients.filter(client => client.plaza === plazaName);
  }, [clients, plazaName]);

  const filteredClients = useMemo(() => {
    if (!searchTerm) return plazaClients;
    return plazaClients.filter(
      client => 
        client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.telefono.includes(searchTerm)
    );
  }, [plazaClients, searchTerm]);

  const stats = useMemo(() => {
    const totalClients = plazaClients.length;
    const totalDebt = plazaClients.reduce((acc, client) => acc + client.adeudo, 0);
    const recoveredClients = plazaClients.filter(c => c.recuperado).length;
    
    return { totalClients, totalDebt, recoveredClients };
  }, [plazaClients]);
  
  const handleOpenRegister = () => {
    setEditingClient(null);
    setIsClientFormOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    setEditingClient(client);
    setIsClientFormOpen(true);
  };

  const handleOpenPayment = (client: Client) => {
    setPayingClient(client);
    setIsPaymentDialogOpen(true);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text(`Clientes de ${plazaName}`, 14, 16);
    autoTable(doc, {
      head: [['ID', 'Fecha', 'Nombre', 'Dirección', 'Teléfono', 'Aval', 'Tel. Aval', 'Préstamo', 'Pago', 'Vencidos', 'Adeudo', 'Estado']],
      body: filteredClients.map(c => [
          c.id,
          c.fecha,
          c.nombre,
          c.direccion,
          c.telefono,
          c.aval,
          c.telefonoAval,
          `$${c.prestamo.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          `$${c.pago.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          c.vencidos,
          `$${c.adeudo.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          c.recuperado ? 'Recuperado' : 'Pendiente'
      ]),
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 7 },
      headStyles: { fontSize: 7, fontStyle: 'bold' },
    });
    doc.save(`clientes_${plazaName.replace(/ /g, '_')}.pdf`);
  };

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredClients.map(c => ({
        'ID': c.id,
        'Plaza': c.plaza,
        'Fecha': c.fecha,
        'Nombre Cliente': c.nombre,
        'Dirección': c.direccion,
        'Teléfono': c.telefono,
        'Aval': c.aval,
        'Tel. Aval': c.telefonoAval,
        'Préstamo ($)': c.prestamo,
        'Pago ($)': c.pago,
        'No. Vencidos': c.vencidos,
        'Adeudo ($)': c.adeudo,
        'Estado': c.recuperado ? 'Recuperado' : 'Pendiente'
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
    XLSX.writeFile(workbook, `clientes_${plazaName.replace(/ /g, '_')}.xlsx`);
  };

  if (!permissions.hasAccess && !currentUser) {
     return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center h-full">
            <h3 className="text-2xl font-bold tracking-tight">Cargando...</h3>
        </div>
    );
  }

  if (!permissions.hasAccess) {
    return (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center h-full">
            <h3 className="text-2xl font-bold tracking-tight">Acceso Denegado</h3>
            <p className="text-sm text-muted-foreground">
            No tienes permiso para ver esta plaza.
            </p>
        </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight">Plaza: {plazaName}</h1>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard 
              title="Deuda Pendiente" 
              value={`$${stats.totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              icon={Wallet} 
              valueClassName="text-destructive text-3xl"
          />
          <StatCard 
              title="Total de Clientes" 
              value={stats.totalClients.toString()} 
              icon={Users} 
          />
          <StatCard 
              title="Recuperados" 
              value={stats.recoveredClients.toString()} 
              icon={UserCheck} 
              description={`de ${stats.totalClients} clientes`}
          />
        </div>

        <Card>
          <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                      <CardTitle className="text-2xl font-bold tracking-tight">Clientes de {plazaName}</CardTitle>
                      <p className="text-muted-foreground">{filteredClients.length} cliente(s) en esta plaza.</p>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                      <div className="relative w-full md:w-auto">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input 
                              placeholder="Buscar cliente..." 
                              className="pl-9"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                          />
                      </div>
                      {permissions.canRegister && <Button onClick={handleOpenRegister}><UserPlus /> Registrar</Button>}
                      {permissions.canImport && <Button onClick={() => setIsImportDialogOpen(true)}><Upload /> Importar</Button>}
                      {permissions.canExport && (
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={handleExportPDF}>Exportar a PDF</DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportExcel}>Exportar a Excel</DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                  </div>
              </div>
          </CardHeader>
          <CardContent>
              {filteredClients.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredClients.map(client => (
                      <ClientCard key={client.id} client={client} onEdit={handleOpenEdit} onPay={handleOpenPayment}/>
                  ))}
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                      <h3 className="text-2xl font-bold tracking-tight">No se encontraron clientes</h3>
                      <p className="text-sm text-muted-foreground">
                      Pruebe con otro término de búsqueda, importe o registre un nuevo cliente.
                      </p>
                  </div>
              )}
          </CardContent>
        </Card>
      </div>
      {permissions.canImport && <ImportDialog isOpen={isImportDialogOpen} onOpenChange={setIsImportDialogOpen} plazaName={plazaName} />}
      <ClientFormDialog 
        isOpen={isClientFormOpen} 
        onOpenChange={setIsClientFormOpen} 
        plazaName={plazaName}
        editingClient={editingClient}
      />
      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onOpenChange={setIsPaymentDialogOpen}
        client={payingClient}
      />
    </>
  );
}
