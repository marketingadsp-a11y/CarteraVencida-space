"use client";

import { useState, useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Client } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, ClipboardPaste, FileUp } from 'lucide-react';

interface ImportDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  plazaName: string;
}

export function ImportDialog({ isOpen, onOpenChange, plazaName }: ImportDialogProps) {
  const { clients, setClients } = useContext(AppContext);
  const { toast } = useToast();
  const [importMode, setImportMode] = useState<'add' | 'replace'>('add');
  const [textData, setTextData] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleImportFromText = () => {
    setIsImporting(true);
    try {
      if (!textData.trim()) {
        throw new Error("El área de texto está vacía.");
      }

      const rows = textData.trim().split('\n');
      let nextId = clients.length > 0 ? Math.max(...clients.map(c => c.id)) + 1 : 1;

      const newClients: Client[] = rows.map((row, index) => {
        const columns = row.split('	');
        if (columns.length !== 10) {
          throw new Error(`Fila #${index + 1} inválida. Se esperaban 10 columnas, pero se encontraron ${columns.length}.`);
        }

        const [fecha, nombre, direccion, telefono, aval, telefonoAval, prestamoStr, pagoStr, vencidosStr, adeudoStr] = columns;

        const newClient: Client = {
          id: nextId++,
          plaza: plazaName,
          fecha,
          nombre,
          direccion,
          telefono,
          aval,
          telefonoAval,
          prestamo: parseFloat(prestamoStr),
          pago: parseFloat(pagoStr),
          vencidos: parseInt(vencidosStr, 10),
          adeudo: parseFloat(adeudoStr),
          recuperado: false,
        };

        if (isNaN(newClient.prestamo) || isNaN(newClient.pago) || isNaN(newClient.vencidos) || isNaN(newClient.adeudo)) {
          throw new Error(`Dato numérico inválido en la fila #${index + 1}.`);
        }

        return newClient;
      });

      if (importMode === 'add') {
        setClients(prev => [...prev, ...newClients]);
      } else { // 'replace'
        setClients(prev => [...prev.filter(c => c.plaza !== plazaName), ...newClients]);
      }

      toast({
        title: "Importación exitosa",
        description: `${newClients.length} clientes fueron importados a la plaza "${plazaName}".`,
      });
      onOpenChange(false);
      setTextData('');

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error de importación",
        description: error.message || "Ocurrió un error al procesar los datos.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Clientes</DialogTitle>
          <DialogDescription>
            Sube un archivo o pega texto para añadir nuevos clientes. Las columnas deben estar en este orden: FECHA, NOMBRE, DIRECCION, TELEFONO, AVAL, TEL. AVAL, PRESTAMO, PAGO, NO.VENC., ADEUDO.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div>
            <Label className="font-semibold">Modo de Importación</Label>
            <RadioGroup defaultValue="add" value={importMode} onValueChange={(value: any) => setImportMode(value)} className="flex items-center gap-6 pt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="r-add" />
                <Label htmlFor="r-add">Añadir a existentes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="replace" id="r-replace" />
                <Label htmlFor="r-replace">Reemplazar todos los de esta plaza</Label>
              </div>
            </RadioGroup>
          </div>

          <Tabs defaultValue="paste" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" disabled>
                <FileUp className="mr-2" /> Subir Archivo
              </TabsTrigger>
              <TabsTrigger value="paste">
                <ClipboardPaste className="mr-2" /> Pegar Texto
              </TabsTrigger>
            </TabsList>
            <TabsContent value="paste" className="pt-4">
              <div className="grid gap-2">
                <Label htmlFor="paste-area">
                  Pega aquí los datos de tu hoja de cálculo. Las columnas deben estar separadas por tabulaciones y las filas por saltos de línea.
                </Label>
                <Textarea
                  id="paste-area"
                  placeholder={`15/05/2024	Juan Perez	Calle Falsa 123...`}
                  rows={8}
                  value={textData}
                  onChange={(e) => setTextData(e.target.value)}
                />
              </div>
              <Button onClick={handleImportFromText} disabled={isImporting} className="mt-4 w-full">
                <Upload className="mr-2" />
                {isImporting ? 'Importando...' : 'Importar desde Texto'}
              </Button>
            </TabsContent>
          </Tabs>
        </div>
        
        <DialogFooter className="sm:justify-end border-t pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
