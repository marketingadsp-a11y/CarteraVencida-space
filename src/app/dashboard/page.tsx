"use client";

import { useContext, useMemo } from 'react';
import Link from 'next/link';
import { AppContext } from '@/contexts/AppContext';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { DollarSign, Users, UserCheck, Percent, ArrowRight, Building, Store, Landmark, Warehouse, School, Factory, Castle, Home, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const plazaIcons = [Building, Store, Landmark, Warehouse, School, Factory, Castle, Home];

export default function Dashboard() {
  const { clients, userPlazas, currentUser } = useContext(AppContext);

  const isUserAdmin = useMemo(() => {
    if (!currentUser) return false;
    // An admin user does not have a 'plazas' property
    return !('plazas' in currentUser);
  }, [currentUser]);

  const stats = useMemo(() => {
    const pendingClients = clients.filter(client => !client.recuperado);
    const totalClients = clients.length;
    const totalDebt = pendingClients.reduce((acc, client) => acc + client.adeudo, 0);
    const recoveredClients = clients.filter(c => c.recuperado).length;
    const recoveryRate = totalClients > 0 ? (recoveredClients / totalClients) * 100 : 0;
    
    return { totalClients, totalDebt, recoveredClients, recoveryRate };
  }, [clients]);

  const plazaStats = useMemo(() => {
    return userPlazas.map((plaza, index) => {
      const plazaClients = clients.filter(c => c.plaza === plaza);
      const pendingDebt = plazaClients.filter(c => !c.recuperado).reduce((acc, client) => acc + client.adeudo, 0);
      const totalClientsInPlaza = plazaClients.length;
      const recoveredInPlaza = plazaClients.filter(c => c.recuperado).length;
      const recoveryRate = totalClientsInPlaza > 0 ? (recoveredInPlaza / totalClientsInPlaza) * 100 : 0;

      return {
        name: plaza,
        pendingDebt,
        recoveryRate,
        icon: plazaIcons[index % plazaIcons.length]
      };
    });
  }, [clients, userPlazas]);
  
  const handleExportAllExcel = () => {
    const dataToExport = clients.map(c => ({
      'FECHA': c.fecha,
      'PLAZA': c.plaza,
      'NOMBRE': c.nombre,
      'DIRECCION': c.direccion,
      'TELEFONO': c.telefono,
      'AVAL': c.aval,
      'TEL. AVAL': c.telefonoAval,
      'PRESTAMO': c.prestamo,
      'PAGO': c.pago,
      'NO.VENC.': c.vencidos,
      'ADEUDO': c.adeudo,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Todos_los_Clientes');
    
    worksheet['!cols'] = [
      { wch: 12 }, // FECHA
      { wch: 20 }, // PLAZA
      { wch: 30 }, // NOMBRE
      { wch: 35 }, // DIRECCION
      { wch: 15 }, // TELEFONO
      { wch: 30 }, // AVAL
      { wch: 15 }, // TEL. AVAL
      { wch: 10 }, // PRESTAMO
      { wch: 10 }, // PAGO
      { wch: 10 }, // NO.VENC.
      { wch: 10 }, // ADEUDO
    ];

    XLSX.writeFile(workbook, `cartera_total_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-8">
      {isUserAdmin && (
        <>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold font-headline tracking-tight">Resumen General</h1>
              <p className="text-muted-foreground">Vista general de la cartera de clientes.</p>
            </div>
            {isUserAdmin && (
              <Button onClick={handleExportAllExcel}>
                <Download /> Exportar Todo (Excel)
              </Button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Deuda Total" 
              value={`$${stats.totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
              icon={DollarSign} 
              variant="destructive"
              className="bg-gradient-to-br from-red-900 to-rose-500 text-destructive-foreground"
            />
            <StatCard title="Clientes Totales" value={stats.totalClients.toString()} icon={Users} />
            <StatCard 
              title="Clientes Recuperados" 
              value={stats.recoveredClients.toString()} 
              icon={UserCheck} 
              className="bg-gradient-to-br from-green-600 to-emerald-500 text-white"
            />
            <StatCard 
              title="Tasa de Recuperación" 
              value={`${stats.recoveryRate.toFixed(1)}%`} 
              icon={Percent} 
              className="bg-gradient-to-br from-primary to-blue-400 text-primary-foreground"
            />
          </div>
        </>
      )}

      <div>
        <h2 className="text-2xl font-bold font-headline tracking-tight mb-4">
          {isUserAdmin ? 'Cartera por Plaza' : 'Mis Plazas'}
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plazaStats.map(plaza => (
            <Card key={plaza.name} className="flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <plaza.icon className="w-5 h-5 text-accent" />
                    {plaza.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-6">
                  <p className="text-sm text-muted-foreground">Deuda Pendiente</p>
                  <p className="text-3xl font-bold text-destructive">
                    ${plaza.pendingDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Tasa de Recuperación</div>
                  <div className="flex items-center gap-2">
                      <Progress value={plaza.recoveryRate} className="w-full" />
                      <span className="font-bold">{plaza.recoveryRate.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                 <Link href={`/dashboard/${encodeURIComponent(plaza.name)}`} className="w-full">
                    <Button className="w-full bg-primary hover:bg-primary/90">
                        Ver Detalles <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
