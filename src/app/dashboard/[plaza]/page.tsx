"use client";

import { useContext, useMemo, useState } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { ClientTable } from '@/components/dashboard/ClientTable';
import StatCard from '@/components/dashboard/StatCard';
import { DollarSign, Users, UserCheck, Percent } from 'lucide-react';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

export default function PlazaPage({ params }: { params: { plaza: string } }) {
  const { clients } = useContext(AppContext);
  const plazaName = decodeURIComponent(params.plaza);
  const [vencidosRange, setVencidosRange] = useState([0, 10]);

  const plazaClients = useMemo(() => {
    return clients.filter(client => client.plaza === plazaName);
  }, [clients, plazaName]);

  const filteredClients = useMemo(() => {
    return plazaClients.filter(
      client => client.vencidos >= vencidosRange[0] && client.vencidos <= vencidosRange[1]
    );
  }, [plazaClients, vencidosRange]);

  const stats = useMemo(() => {
    const totalClients = plazaClients.length;
    const totalDebt = plazaClients.reduce((acc, client) => acc + client.adeudo, 0);
    const recoveredClients = plazaClients.filter(c => c.recuperado).length;
    const recoveryRate = totalClients > 0 ? (recoveredClients / totalClients) * 100 : 0;
    
    return { totalClients, totalDebt, recoveredClients, recoveryRate };
  }, [plazaClients]);

  const maxVencidos = useMemo(() => 
    plazaClients.length > 0 ? Math.max(...plazaClients.map(c => c.vencidos), 10) : 10
  , [plazaClients]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">{plazaName}</h1>
        <p className="text-muted-foreground">Detalle de la cartera de clientes de la plaza.</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Deuda Pendiente" value={`$${stats.totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} icon={DollarSign} />
        <StatCard title="Clientes en Plaza" value={stats.totalClients.toString()} icon={Users} />
        <StatCard title="Clientes Recuperados" value={stats.recoveredClients.toString()} icon={UserCheck} />
        <StatCard title="Tasa de Recuperación" value={`${stats.recoveryRate.toFixed(1)}%`} icon={Percent} />
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
                <Label htmlFor="vencidos-range" className="text-lg font-semibold">Filtrar por No. de Pagos Vencidos</Label>
                <p className="text-sm text-muted-foreground">Rango: {vencidosRange[0]} - {vencidosRange[1]}</p>
            </div>
        </div>
        <Slider
          id="vencidos-range"
          min={0}
          max={maxVencidos}
          step={1}
          value={[vencidosRange[1]]}
          onValueChange={(value) => setVencidosRange([vencidosRange[0], value[0]])}
          className="w-full"
        />
      </div>

      <ClientTable clients={filteredClients} />
    </div>
  );
}
