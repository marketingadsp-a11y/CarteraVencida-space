"use client";

import { useState, useMemo, useContext } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Client } from "@/lib/constants";
import { Button } from '@/components/ui/button';
import { ArrowUpDown, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AppContext } from '@/contexts/AppContext';

type SortKey = keyof Client;

export function ClientTable({ clients }: { clients: Client[] }) {
  const { toggleClientRecovered } = useContext(AppContext);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' } | null>(null);

  const sortedClients = useMemo(() => {
    let sortableClients = [...clients];
    if (sortConfig !== null) {
      sortableClients.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableClients;
  }, [clients, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  
  const renderSortArrow = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortConfig.direction === 'asc' ? '▲' : '▼';
  };

  const headers: { key: SortKey; label: string; numeric?: boolean }[] = [
    { key: 'nombre', label: 'Nombre' },
    { key: 'fecha', label: 'Fecha' },
    { key: 'adeudo', label: 'Adeudo', numeric: true },
    { key: 'vencidos', label: 'No. Venc.', numeric: true },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'aval', label: 'Aval' },
    { key: 'recuperado', label: 'Estado' },
  ];

  if (!clients.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
        <h3 className="text-2xl font-bold tracking-tight">No hay clientes</h3>
        <p className="text-sm text-muted-foreground">
          Importe datos o ajuste los filtros para ver los clientes.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border shadow-md">
      <Table>
        <TableHeader>
          <TableRow>
            {headers.map(header => (
              <TableHead key={header.key} className={header.numeric ? 'text-right' : ''}>
                <Button variant="ghost" onClick={() => requestSort(header.key)}>
                  {header.label}
                  {renderSortArrow(header.key)}
                </Button>
              </TableHead>
            ))}
            <TableHead>Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedClients.map((client) => (
            <TableRow key={client.id} className={client.recuperado ? 'bg-green-100 dark:bg-green-900/20' : ''}>
              <TableCell className="font-medium">{client.nombre}</TableCell>
              <TableCell>{client.fecha}</TableCell>
              <TableCell className="text-right">${client.adeudo.toLocaleString('en-US', { minimumFractionDigits: 2 })}</TableCell>
              <TableCell className="text-right">
                <Badge variant={client.vencidos > 3 ? "destructive" : "secondary"}>
                  {client.vencidos}
                </Badge>
              </TableCell>
              <TableCell>{client.telefono}</TableCell>
              <TableCell>{client.aval}</TableCell>
              <TableCell>
                <Badge variant={client.recuperado ? "default" : "outline"} className={client.recuperado ? 'bg-green-600 text-white' : ''}>
                    {client.recuperado ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <XCircle className="mr-1 h-3 w-3" />}
                    {client.recuperado ? 'Recuperado' : 'Pendiente'}
                </Badge>
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" onClick={() => toggleClientRecovered(client.id)}>
                    Marcar como {client.recuperado ? 'Pendiente' : 'Recuperado'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
