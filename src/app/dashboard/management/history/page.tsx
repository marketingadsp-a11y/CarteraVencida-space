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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { PiggyBank, History as HistoryIcon, User, Building, Trash2, Edit, FileUp, LogIn, CreditCard, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { DateRange } from 'react-day-picker';
import { Label } from '@/components/ui/label';

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
  const { actionLogs, allPayments, plazas } = useContext(AppContext);
  const [actionSearch, setActionSearch] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [selectedPlaza, setSelectedPlaza] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const filteredActionLogs = useMemo(() => {
    if (!actionSearch) return actionLogs;
    return actionLogs.filter(log =>
      log.action.toLowerCase().includes(actionSearch.toLowerCase()) ||
      log.user.toLowerCase().includes(actionSearch.toLowerCase())
    );
  }, [actionLogs, actionSearch]);

  const parsePaymentDate = (dateString: string) => {
    // Try parsing YYYY-MM-DD first
    let date = parse(dateString, 'yyyy-MM-dd', new Date());
    // If invalid, try parsing DD/MM/YYYY
    if (isNaN(date.getTime())) {
      date = parse(dateString, 'dd/MM/yyyy', new Date());
    }
    return date;
  }

  const filteredPayments = useMemo(() => {
    let payments = allPayments;

    if (selectedPlaza !== 'all') {
      payments = payments.filter(p => p.plaza === selectedPlaza);
    }
    
    if (dateRange?.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      payments = payments.filter(p => parsePaymentDate(p.fecha) >= fromDate);
    }
    
    if (dateRange?.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      payments = payments.filter(p => parsePaymentDate(p.fecha) <= toDate);
    }
    
    if (!paymentSearch) return payments;
    return payments.filter(payment =>
      payment.clienteNombre?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      payment.plaza?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      payment.user?.toLowerCase().includes(paymentSearch.toLowerCase())
    );
  }, [allPayments, paymentSearch, selectedPlaza, dateRange]);
  
  const filteredTotalPayments = useMemo(() => {
    return filteredPayments.reduce((acc, p) => acc + p.monto, 0);
  }, [filteredPayments]);


  return (
    <div className="flex flex-col gap-6">
      <Tabs defaultValue="payments" className="w-full">
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
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
              <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 border rounded-lg bg-muted/50">
                  <div className="flex-1">
                      <p className="text-sm text-muted-foreground font-medium">Abonos Recibidos (filtrados)</p>
                      <p className="text-2xl font-bold text-green-600">
                          ${filteredTotalPayments.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 flex-1 sm:items-center sm:justify-end">
                      <div className="grid gap-2">
                          <Label>Plaza</Label>
                          <Select value={selectedPlaza} onValueChange={setSelectedPlaza}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Seleccionar plaza" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las plazas</SelectItem>
                                {plazas.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                            </SelectContent>
                          </Select>
                      </div>
                      <div className="grid gap-2">
                          <Label>Rango de Fechas</Label>
                          <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  id="date"
                                  variant={"outline"}
                                  className={cn(
                                    "w-full sm:w-[300px] justify-start text-left font-normal",
                                    !dateRange && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {dateRange?.from ? (
                                    dateRange.to ? (
                                      <>
                                        {format(dateRange.from, "LLL dd, y")} -{" "}
                                        {format(dateRange.to, "LLL dd, y")}
                                      </>
                                    ) : (
                                      format(dateRange.from, "LLL dd, y")
                                    )
                                  ) : (
                                    <span>Seleccione un rango</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                  initialFocus
                                  mode="range"
                                  defaultMonth={dateRange?.from}
                                  selected={dateRange}
                                  onSelect={setDateRange}
                                  numberOfMonths={2}
                                  locale={es}
                                />
                              </PopoverContent>
                          </Popover>
                      </div>
                  </div>
              </div>

              <ScrollArea className="h-[50vh]">
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
                            <TableCell>{payment.fecha ? format(parsePaymentDate(payment.fecha), "dd/MM/yyyy", { locale: es }) : 'N/A'}</TableCell>
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
                            No hay abonos que coincidan con los filtros.
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
