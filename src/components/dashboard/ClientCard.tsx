"use client";

import { Client } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, User, Edit, DollarSign, CheckCircle2, XCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export function ClientCard({ client, onEdit, onPay }: { client: Client, onEdit: (client: Client) => void, onPay: (client: Client) => void }) {
  const isRecovered = client.recuperado;
  
  return (
    <div className={cn(
        "glass-card flex flex-col rounded-2xl p-5 relative overflow-hidden",
        isRecovered 
          ? "bg-emerald-50/40 border-emerald-200/50 shadow-[0_4px_20px_rgba(16,185,129,0.02)]" 
          : "bg-white/55 border-slate-200/40"
      )}>
      {/* Subtle background glow spot */}
      <div className={cn(
        "absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-10",
        isRecovered ? "bg-emerald-400" : "bg-rose-400"
      )} />

      <div className="flex items-start justify-between gap-4 mb-2">
        <h3 className="text-base font-headline font-bold text-slate-800 uppercase leading-tight tracking-tight">{client.nombre}</h3>
        <Badge 
          variant="outline" 
          className={cn(
            "shrink-0 text-[10px] font-bold px-2 py-0.5 border rounded-full",
            isRecovered 
              ? "bg-emerald-100/80 border-emerald-200 text-emerald-700" 
              : "bg-rose-100/80 border-rose-200 text-rose-700"
          )}
        >
          {isRecovered ? <CheckCircle2 className="mr-1 h-3 w-3"/> : <XCircle className="mr-1 h-3 w-3" />}
          {isRecovered ? 'Recuperado' : 'Pendiente'}
        </Badge>
      </div>
      <p className="text-xs text-slate-500 mb-4">{client.direccion}</p>
      
      <div className="flex-grow space-y-2.5 mb-4">
        <div className="flex items-center text-xs text-slate-600">
          <Phone className="mr-2.5 h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span>{client.telefono}</span>
        </div>
        <div className="flex items-center text-xs text-slate-600">
          <User className="mr-2.5 h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{client.aval}</span>
        </div>
        <Separator className="bg-slate-200/50 my-2" />
        <div className="grid grid-cols-2 items-baseline gap-2 pt-1">
            <div className="text-left">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Préstamo</p>
                <p className="font-semibold text-slate-800">${client.prestamo.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="text-right">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Adeudo</p>
                <p className={cn(
                    "font-extrabold text-lg tracking-tight",
                    isRecovered ? "text-emerald-600" : "text-rose-600"
                )}>
                  ${client.adeudo.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
            </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-auto pt-2">
        <Button 
          variant="outline" 
          className="w-full bg-white/60 hover:bg-slate-100/80 text-slate-700 hover:text-slate-900 border-slate-200/50 hover:border-slate-300 transition-colors h-9 rounded-lg text-xs font-semibold" 
          onClick={() => onEdit(client)}
        >
          <Edit className="mr-1.5 h-3.5 w-3.5" /> Ver
        </Button>
        <Button 
          className="w-full bg-gradient-to-r from-primary to-rose-500 hover:from-primary/90 hover:to-rose-500/90 text-white border-0 shadow-[0_4px_12px_rgba(255,127,80,0.2)] h-9 rounded-lg text-xs font-semibold" 
          onClick={() => onPay(client)} 
          disabled={isRecovered}
        >
          <DollarSign className="mr-1 h-3.5 w-3.5" /> Abonar
        </Button>
      </div>
    </div>
  );
}
