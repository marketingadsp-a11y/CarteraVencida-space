"use client";

import { useContext, useMemo } from 'react';
import Link from 'next/link';
import { AppContext } from '@/contexts/AppContext';
import StatCard from '@/components/dashboard/StatCard';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from "@/components/ui/progress";
import { Separator } from '@/components/ui/separator';
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
    <div className="flex flex-col gap-6">
      {isUserAdmin && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
          {/* Left section: Title & Actions */}
          <div className="flex flex-col gap-3 min-w-[220px]">
            <div>
              <h1 className="text-lg font-bold font-headline tracking-tight text-slate-800">Resumen General</h1>
              <p className="text-[10px] text-slate-500 font-medium">Estado consolidado de la cartera</p>
            </div>
            <Button 
              onClick={handleExportAllExcel} 
              className="w-fit bg-primary hover:bg-primary/95 text-white font-semibold shadow-sm transition-transform active:scale-95 text-xs h-8 rounded-lg px-4"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" /> Exportar (Excel)
            </Button>
          </div>

          {/* Separator */}
          <div className="hidden lg:block w-[1px] bg-slate-200 self-stretch mx-2" />

          {/* Right section: KPIs Grid */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Deuda Total KPI */}
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Deuda Pendiente</span>
              <span className="text-2xl font-extrabold font-headline tracking-tight text-rose-600">
                ${stats.totalDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[9px] text-slate-500 font-medium mt-0.5">Saldo activo deudor</span>
            </div>

            {/* Tasa Recuperación KPI */}
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Eficiencia de Cobro</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold font-headline tracking-tight text-primary">
                  {stats.recoveryRate.toFixed(1)}%
                </span>
              </div>
              <Progress value={stats.recoveryRate} className="w-16 bg-slate-100 h-1.5 rounded-full mt-1.5" />
            </div>

            {/* Clientes Totales KPI */}
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Clientes Totales</span>
              <span className="text-2xl font-extrabold text-slate-800">
                {stats.totalClients}
              </span>
              <span className="text-[9px] text-slate-500 font-medium mt-0.5">
                {stats.totalClients - stats.recoveredClients} con saldo pendiente
              </span>
            </div>

            {/* Clientes Recuperados KPI */}
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Cuentas Liquidadas</span>
              <span className="text-2xl font-extrabold text-emerald-600">
                {stats.recoveredClients}
              </span>
              <span className="text-[9px] text-slate-500 font-medium mt-0.5">
                {stats.totalClients > 0 ? ((stats.recoveredClients / stats.totalClients) * 100).toFixed(0) : 0}% de la cartera
              </span>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-base font-bold font-headline tracking-tight mb-4 text-slate-800">
          {isUserAdmin ? 'Cartera por Plaza' : 'Mis Plazas'}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plazaStats.map(plaza => (
            <Link 
              key={plaza.name} 
              href={`/dashboard/${encodeURIComponent(plaza.name)}`} 
              className="group bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between hover:border-slate-350 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <div>
                {/* Header of Plaza card */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="flex items-center gap-2 font-headline font-bold text-sm text-slate-800">
                    <plaza.icon className="w-4 h-4 text-primary" />
                    {plaza.name}
                  </h3>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>

                <Separator className="bg-slate-100 my-2" />

                {/* Metrics row */}
                <div className="grid grid-cols-2 gap-4 items-center">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Deuda Pendiente</span>
                    <span className="text-lg font-extrabold tracking-tight text-rose-600 mt-0.5 block">
                      ${plaza.pendingDebt.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex flex-col items-end text-right">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Recuperación</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="font-bold text-xs text-slate-700">{plaza.recoveryRate.toFixed(1)}%</span>
                      <Progress value={plaza.recoveryRate} className="w-10 bg-slate-100 h-1 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
