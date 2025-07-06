"use client";

import { useContext, useMemo, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
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

export default function PlazaPage({ params }: { params: { plaza: string } }) {
  const { clients } = useContext(AppContext);
  const plazaName = decodeURIComponent(params.plaza);
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">Plaza: {plazaName}</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard 
            title="Deuda Pendiente" 
            value={`$${stats.totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
            icon={Wallet} 
            variant="destructive"
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
                    <p className="text-muted-foreground">{filteredClients.length} cliente(s) en este grupo.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Buscar cliente..." 
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline"><UserPlus /> Registrar</Button>
                    <Button><Upload /> Importar</Button>
                    <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>Exportar a PDF</DropdownMenuItem>
                        <DropdownMenuItem>Exportar a Excel</DropdownMenuItem>
                    </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            {filteredClients.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredClients.map(client => (
                    <ClientCard key={client.id} client={client} />
                ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">No se encontraron clientes</h3>
                    <p className="text-sm text-muted-foreground">
                    Pruebe con otro término de búsqueda o importe nuevos datos.
                    </p>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
