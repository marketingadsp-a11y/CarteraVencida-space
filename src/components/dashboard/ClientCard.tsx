"use client";

import { Client } from '@/lib/constants';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, User, Edit, DollarSign } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function ClientCard({ client, onEdit, onPay }: { client: Client, onEdit: (client: Client) => void, onPay: (client: Client) => void }) {
  return (
    <Card className="flex flex-col rounded-xl shadow-md transition-all duration-200 hover:shadow-lg hover:border-primary">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-bold uppercase leading-tight">{client.nombre}</CardTitle>
          {!client.recuperado && (
            <Badge variant="outline" className="border-destructive text-destructive shrink-0">
              Pendiente
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{client.direccion}</p>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 pt-0">
        <div className="flex items-center text-sm text-muted-foreground">
          <Phone className="mr-2 h-4 w-4 shrink-0" />
          <span>{client.telefono}</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <User className="mr-2 h-4 w-4 shrink-0" />
          <span className="truncate">{client.aval}</span>
        </div>
        <Separator className="my-2" />
        <div className="grid grid-cols-2 items-baseline gap-2">
            <div className="text-left">
                <p className="text-xs text-muted-foreground">Préstamo</p>
                <p className="font-semibold">${client.prestamo.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="text-right">
                <p className="text-xs text-muted-foreground">Adeudo</p>
                <p className="font-bold text-lg text-destructive">${client.adeudo.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2 p-4">
        <Button variant="outline" className="w-full" onClick={() => onEdit(client)}>
          <Edit /> Editar
        </Button>
        <Button className="w-full" onClick={() => onPay(client)}>
          <DollarSign /> Abonar
        </Button>
      </CardFooter>
    </Card>
  );
}
