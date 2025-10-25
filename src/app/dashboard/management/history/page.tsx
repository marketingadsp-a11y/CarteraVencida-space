"use client";

import { useContext, useMemo, useState } from 'react';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { AppContext } from '@/contexts/AppContext';
import { ActionLog, Payment } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PiggyBank, History as HistoryIcon, User, Building, Trash2, Edit, FileUp, LogIn, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const getActionIcon = (type: ActionLog['type']) => {
  switch (type) {
    case 'CREATE': return <Edit className="text-green-500" />;
    case 'UPDATE': return <Edit className="text-blue-500" />;
    case 'DELETE': return <Trash2 className="text-red-500" />;
    case 'PAYMENT': return <CreditCard className="text-yellow-500" />;
    case 'IMPORT': return <FileUp className="text-purple-500" />;
    case 'LOGIN': return <LogIn className="text-gray-500" />;
    default: return <HistoryIcon />;
  }
}

export default function HistoryPage() {
  const { actionLogs, allPayments } = useContext(AppContext);
  const [actionSearch, setActionSearch] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');

  const filteredActionLogs = useMemo(() => {
    if (!actionSearch) return actionLogs;
    return actionLogs.filter(log =>
      log.action.toLowerCase().includes(actionSearch.toLowerCase()) ||
      log.user.toLowerCase().includes(actionSearch.toLowerCase())
    );
  }, [actionLogs, actionSearch]);

  const filteredPayments = useMemo(() => {
    if (!paymentSearch) return allPayments;
    return allPayments.filter(payment =>
      payment.clienteNombre?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      payment.plaza?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      payment.user?.toLowerCase().includes(paymentSearch.toLowerCase())
    );
  }, [allPayments, paymentSearch]);

  const parsePaymentDate = (dateString: string) => {
    // Try parsing YYYY-MM-DD first
    let date = parse(dateString, 'yyyy-MM-dd', new Date());
    // If invalid, try parsing DD/MM/YYYY
    if (isNaN(date.getTime())) {
      date = parse(dateString, 'dd/MM/yyyy', new Date());
    }
    return date;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-headline tracking-tight">Historial del Sistema</h1>
      </div>

      <Tabs defaultValue="payments">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payments">
            <PiggyBank className="mr-2" /> Historial de Abonos
          </TabsTrigger>
          <TabsTrigger value="actions">
            <HistoryIcon className="mr-2" /> Historial de Acciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Historial de Abonos</CardTitle>
                    <CardDescription>Todos los abonos registrados en el sistema.</CardDescription>
                  </div>
                  <Input 
                    placeholder="Buscar abono..."
                    value={paymentSearch}
                    onChange={(e) => setPaymentSearch(e.target.value)}
                    className="max-w-sm"
                  />
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh]">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader className="sticky top-0 bg-muted">
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Plaza</TableHead>
                        <TableHead>Registrado por</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.length > 0 ? (
                        filteredPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{payment.fecha ? format(parsePaymentDate(payment.fecha), "dd/MM/yyyy") : 'N/A'}</TableCell>
                            <TableCell className="font-medium">{payment.clienteNombre}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{payment.plaza}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="flex items-center gap-1.5 w-fit">
                                <User className="h-3 w-3" />
                                {payment.user || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-semibold text-green-600">
                              +${payment.monto.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            No hay abonos registrados.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Historial de Acciones</CardTitle>
                        <CardDescription>Registro de todas las acciones realizadas en el sistema.</CardDescription>
                    </div>
                    <Input 
                        placeholder="Buscar acción..."
                        value={actionSearch}
                        onChange={(e) => setActionSearch(e.target.value)}
                        className="max-w-sm"
                    />
                </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[60vh]">
                <div className="rounded-md border">
                  <Table>
                     <TableHeader className="sticky top-0 bg-muted">
                      <TableRow>
                        <TableHead className="w-[200px]">Fecha y Hora</TableHead>
                        <TableHead className="w-[150px]">Usuario</TableHead>
                        <TableHead>Acción Realizada</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredActionLogs.length > 0 ? (
                        filteredActionLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="flex items-center gap-1.5">
                                    <User className="h-3 w-3"/>
                                    {log.user}
                                </Badge>
                            </TableCell>
                            <TableCell className="flex items-start gap-2">
                                <span className={cn(
                                    "flex h-8 w-8 items-center justify-center rounded-full bg-muted flex-shrink-0 mt-1",
                                )}>
                                    {getActionIcon(log.type)}
                                </span>
                                <span className="flex-grow">{log.action}</span>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center">
                            No hay acciones registradas.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
