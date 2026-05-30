"use client";

import { useContext, useMemo, useState, use } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Client, User } from '@/lib/constants';
import StatCard from '@/components/dashboard/StatCard';
import { Wallet, Users, UserCheck, Search, UserPlus, Upload, MoreVertical, Trash2, Phone, Edit, DollarSign, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImportDialog } from '@/components/dashboard/ImportDialog';
import { ClientFormDialog } from '@/components/dashboard/ClientFormDialog';
import { PaymentDialog } from '@/components/dashboard/PaymentDialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

export default function PlazaPage({ params }: { params: Promise<{ plaza: string }> }) {
  const { plaza } = use(params);
  const { clients, currentUser, deleteClientsByPlaza } = useContext(AppContext);
  const { toast } = useToast();
  const plazaName = decodeURIComponent(plaza);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [payingClient, setPayingClient] = useState<Client | null>(null);
  const [showRecovered, setShowRecovered] = useState(false);

  const isUserAdmin = useMemo(() => {
    if (!currentUser) return false;
    return !('plazas' in currentUser);
  }, [currentUser]);

  const permissions = useMemo(() => {
    const defaultPermissions = { canRegister: false, canImport: false, canExport: false, canExportHistory: false, hasAccess: false };
    if (!currentUser) return defaultPermissions;

    if (isUserAdmin) { // It's an Admin
      return { canRegister: true, canImport: true, canExport: true, canExportHistory: true, hasAccess: true };
    }
    
    const user = currentUser as User;
    if (!user.plazas) return defaultPermissions;
    const plazaAccess = user.plazas.find(p => p.plazaName === plazaName);

    if (plazaAccess) {
      return { ...plazaAccess.permissions, hasAccess: true };
    }

    return defaultPermissions;
  }, [currentUser, plazaName, isUserAdmin]);

  const plazaClients = useMemo(() => {
    return clients.filter(client => client.plaza === plazaName);
  }, [clients, plazaName]);

  const filteredClients = useMemo(() => {
    const searchedClients = searchTerm
      ? plazaClients.filter(
          client =>
            client.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.telefono.includes(searchTerm)
        )
      : plazaClients;
      
    // Sort clients to show recovered ones at the end
    return searchedClients.sort((a, b) => (a.recuperado ? 1 : 0) - (b.recuperado ? 1 : 0));
  }, [plazaClients, searchTerm]);

  const pendingClients = useMemo(() => {
    return filteredClients.filter(c => !c.recuperado);
  }, [filteredClients]);

  const recoveredClients = useMemo(() => {
    return filteredClients.filter(c => c.recuperado);
  }, [filteredClients]);


  const stats = useMemo(() => {
    const totalClients = plazaClients.length;
    const pendingClients = plazaClients.filter(client => !client.recuperado);
    const totalDebt = pendingClients.reduce((acc, client) => acc + client.adeudo, 0);
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

  const handleDeleteAllClients = async () => {
    await deleteClientsByPlaza(plazaName);
    toast({
        title: "Clientes eliminados",
        description: `Todos los clientes de la plaza "${plazaName}" han sido eliminados.`,
    });
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

  const renderClientsTable = (clientsList: Client[]) => (
    <div className="w-full overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-sm">
      <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
        <thead>
          <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[9px] sm:text-[10px] border-b border-slate-200">
            <th className="px-3 py-2.5">Cliente / Dirección</th>
            <th className="px-3 py-2.5">Teléfono</th>
            <th className="px-3 py-2.5">Aval / Tel. Aval</th>
            <th className="px-3 py-2.5 text-right">Préstamo</th>
            <th className="px-3 py-2.5 text-center">Vencidos</th>
            <th className="px-3 py-2.5 text-right">Adeudo</th>
            <th className="px-3 py-2.5 text-center">Estado</th>
            <th className="px-3 py-2.5 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {clientsList.map((client) => {
            const isRecovered = client.recuperado;
            return (
              <tr key={client.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-3 py-2.5 align-middle">
                  <div className="font-semibold text-slate-900 uppercase tracking-tight text-xs sm:text-sm">{client.nombre}</div>
                  <div className="text-[10px] text-slate-400 font-medium mt-0.5 max-w-[180px] sm:max-w-xs truncate" title={client.direccion}>
                    {client.direccion}
                  </div>
                </td>
                <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                  {client.telefono ? (
                    <a href={`tel:${client.telefono}`} className="text-primary hover:underline inline-flex items-center gap-1 font-medium">
                      <Phone className="h-3 w-3 text-slate-400" />
                      {client.telefono}
                    </a>
                  ) : (
                    <span className="text-slate-300">-</span>
                  )}
                </td>
                <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                  <div className="font-medium text-slate-700 truncate max-w-[120px] sm:max-w-[150px]" title={client.aval}>{client.aval || "-"}</div>
                  {client.telefonoAval ? (
                    <a href={`tel:${client.telefonoAval}`} className="text-primary hover:underline inline-flex items-center gap-1 text-[10px] mt-0.5">
                      <Phone className="h-2.5 w-2.5 text-slate-400" />
                      {client.telefonoAval}
                    </a>
                  ) : null}
                </td>
                <td className="px-3 py-2.5 align-middle text-right font-medium text-slate-700 whitespace-nowrap">
                  ${client.prestamo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2.5 align-middle text-center">
                  {client.vencidos > 0 ? (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                      {client.vencidos}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className={`px-3 py-2.5 align-middle text-right font-bold text-xs sm:text-sm whitespace-nowrap ${isRecovered ? 'text-emerald-600' : 'text-rose-600 font-extrabold'}`}>
                  ${client.adeudo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-3 py-2.5 align-middle text-center whitespace-nowrap">
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-semibold border ${
                    isRecovered ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-rose-50 border-rose-200 text-rose-700'
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${isRecovered ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                    {isRecovered ? 'Recuperado' : 'Pendiente'}
                  </span>
                </td>
                <td className="px-3 py-2.5 align-middle text-right whitespace-nowrap">
                  <div className="inline-flex gap-1">
                    <Button 
                      variant="outline" 
                      className="h-6 px-2 text-[10px] font-medium bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded"
                      onClick={() => handleOpenEdit(client)}
                    >
                      <Edit className="h-3 w-3 mr-1" /> Ver
                    </Button>
                    <Button 
                      className="h-6 px-2 text-[10px] font-medium bg-primary hover:bg-primary/95 text-white rounded shadow-sm disabled:opacity-50" 
                      onClick={() => handleOpenPayment(client)} 
                      disabled={isRecovered}
                    >
                      <DollarSign className="h-3 w-3 mr-0.5" /> Abonar
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-xl font-bold font-headline tracking-tight text-slate-800">Plaza: {plazaName}</h1>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard 
              title="Deuda Pendiente" 
              value={`$${stats.totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              icon={Wallet}
              variant="destructive"
              valueClassName="text-2xl"
          />
          <StatCard 
              title="Total de Clientes" 
              value={stats.totalClients.toString()} 
              icon={Users} 
              valueClassName="text-2xl"
          />
          <StatCard 
              title="Recuperados" 
              value={stats.recoveredClients.toString()} 
              icon={UserCheck} 
              description={`de ${stats.totalClients} clientes`}
              className="green"
              valueClassName="text-2xl"
          />
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                  <h2 className="text-base font-headline font-bold tracking-tight text-slate-800">Clientes de {plazaName}</h2>
                  <p className="text-slate-400 text-xs mt-0.5">{filteredClients.length} cliente(s) en esta plaza.</p>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                  <div className="relative w-full md:w-auto">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input 
                          placeholder="Buscar cliente..." 
                          className="pl-9 glass-input h-9 bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus-visible:ring-primary/20 focus-visible:border-primary/40 text-xs w-full md:w-60"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                      />
                  </div>
                  {permissions.canRegister && (
                    <Button 
                      onClick={handleOpenRegister}
                      className="bg-primary hover:bg-primary/95 text-white shadow-sm h-9 text-xs font-semibold rounded-lg"
                    >
                      <UserPlus className="mr-1.5 h-4 w-4" /> Registrar
                    </Button>
                  )}
                  {permissions.canImport && (
                    <Button 
                      onClick={() => setIsImportDialogOpen(true)}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 h-9 text-xs font-semibold rounded-lg transition-colors"
                    >
                      <Upload className="mr-1.5 h-4 w-4" /> Importar
                    </Button>
                  )}
                  
                  {isUserAdmin && filteredClients.length > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" className="bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 border border-rose-200/60 h-9 text-xs font-semibold rounded-lg transition-colors">
                              <Trash2 className="mr-1.5 h-4 w-4" /> Eliminar Todos
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white border border-slate-200 text-slate-800 shadow-md">
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500">
                                Esta acción es irreversible. Se eliminarán permanentemente <strong>todos los {filteredClients.length} clientes</strong> de la plaza "{plazaName}".
                                ¿Deseas continuar?
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200">Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDeleteAllClients} className="bg-destructive hover:bg-destructive/90 text-white border-0">
                                Sí, eliminar todos
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {permissions.canExport && (
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border border-slate-200 text-slate-800 shadow-md">
                        <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50 text-slate-700 hover:text-slate-900 focus:text-slate-900">Exportar a PDF</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50 text-slate-700 hover:text-slate-900 focus:text-slate-900">Exportar a Excel</DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                  )}
              </div>
          </div>
          <div className="mt-4">
              {pendingClients.length > 0 || recoveredClients.length > 0 ? (
                  <div className="space-y-6">
                      {/* Pending Clients Table */}
                      {pendingClients.length > 0 ? (
                          renderClientsTable(pendingClients)
                      ) : (
                          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 p-8 text-center bg-slate-50/50">
                              <p className="text-xs text-slate-500 font-medium">No hay clientes pendientes de cobro en esta plaza.</p>
                          </div>
                      )}

                      {/* Recovered Clients Section */}
                      {recoveredClients.length > 0 && (
                          <div className="pt-5 border-t border-slate-100">
                              <div className="flex items-center justify-between mb-3">
                                  <h3 className="text-xs font-bold text-slate-500 flex items-center gap-2 tracking-wide uppercase">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                      Clientes Recuperados ({recoveredClients.length})
                                  </h3>
                                  <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setShowRecovered(!showRecovered)}
                                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold px-3 h-7 transition-colors"
                                  >
                                      {showRecovered ? "Ocultar" : "Mostrar"}
                                  </Button>
                              </div>
                              
                              {showRecovered && renderClientsTable(recoveredClients)}
                          </div>
                      )}
                  </div>
              ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 p-12 text-center bg-slate-50/50">
                      <h3 className="text-sm font-bold text-slate-800">No se encontraron clientes</h3>
                      <p className="text-xs text-slate-500 mt-1">
                      Pruebe con otro término de búsqueda, importe o registre un nuevo cliente.
                      </p>
                  </div>
              )}
          </div>
        </div>
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
