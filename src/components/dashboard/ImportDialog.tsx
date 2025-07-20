"use client";

import React, { useState, useContext, useRef } from 'react';
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
import { Input } from '@/components/ui/input';
import { Upload, ClipboardPaste, FileUp, Paperclip, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ImportDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  plazaName: string;
}

export function ImportDialog({ isOpen, onOpenChange, plazaName }: ImportDialogProps) {
  const { setClients } = useContext(AppContext);
  const { toast } = useToast();
  const [importMode, setImportMode] = useState<'add' | 'replace'>('add');
  const [textData, setTextData] = useState('');
  const [fileName, setFileName] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processAndImportData = async (data: (string | number)[][], headers: string[]) => {
    setIsImporting(true);
    try {
      if (data.length === 0) {
        throw new Error("No se encontraron datos para importar.");
      }

      const lowerCaseHeaders = headers.map(h => String(h).toLowerCase());
      
      const requiredHeaders = ['fecha', 'nombre', 'direccion', 'telefono', 'aval', 'tel. aval', 'prestamo', 'pago', 'no.venc.', 'adeudo'];
      const getIndex = (key: string) => lowerCaseHeaders.indexOf(key);

      const headerMap = {
        fecha: getIndex('fecha'),
        plaza: getIndex('plaza'),
        nombre: getIndex('nombre'),
        direccion: getIndex('direccion'),
        telefono: getIndex('telefono'),
        aval: getIndex('aval'),
        telefonoAval: getIndex('tel. aval'),
        prestamo: getIndex('prestamo'),
        pago: getIndex('pago'),
        vencidos: getIndex('no.venc.'),
        adeudo: getIndex('adeudo'),
      };

      const missingHeaders = requiredHeaders.filter(key => headerMap[key as keyof typeof headerMap] === -1);
      if(missingHeaders.length > 0) {
        throw new Error(`Faltan las siguientes columnas en el archivo: ${missingHeaders.join(', ')}`);
      }
      
      const cleanCurrency = (value: any): number => {
        if (typeof value === 'number') return value;
        if (typeof value !== 'string') return 0;
        const cleaned = value.replace(/[$,]/g, '');
        return parseFloat(cleaned) || 0;
      };

      const newClients: Omit<Client, 'id'>[] = data.map((row, index) => {
        if (row.length < requiredHeaders.length) {
          console.warn(`Fila #${index + 2} incompleta, será ignorada.`);
          return null;
        }
        
        const newClient: Omit<Client, 'id'> = {
          plaza: headerMap.plaza !== -1 ? String(row[headerMap.plaza]) : plazaName,
          fecha: String(row[headerMap.fecha]),
          nombre: String(row[headerMap.nombre]),
          direccion: String(row[headerMap.direccion]),
          telefono: String(row[headerMap.telefono]).replace(/\s/g, ''),
          aval: String(row[headerMap.aval]),
          telefonoAval: String(row[headerMap.telefonoAval]).replace(/\s/g, ''),
          prestamo: cleanCurrency(row[headerMap.prestamo]),
          pago: cleanCurrency(row[headerMap.pago]),
          vencidos: parseInt(String(row[headerMap.vencidos]), 10) || 0,
          adeudo: cleanCurrency(row[headerMap.adeudo]),
          recuperado: false,
          historialPagos: [],
        };
        
        newClient.recuperado = newClient.adeudo <= 0;

        if (!newClient.nombre || !newClient.fecha) {
            console.warn(`Datos faltantes en la fila #${index + 2} (Nombre o Fecha), será ignorada.`);
            return null;
        }
        
        return newClient;
      }).filter((c): c is Client => c !== null);
      
      if(newClients.length === 0) {
          throw new Error("Ningún cliente válido fue encontrado en los datos proporcionados.");
      }

      await setClients(newClients as Client[], plazaName, importMode);

      toast({
        title: "Importación exitosa",
        description: `${newClients.length} clientes fueron importados a la plaza "${plazaName}".`,
      });
      onOpenChange(false);
      setTextData('');
      setFileName('');

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

  const handleImportFromText = () => {
    if (!textData.trim()) {
        toast({ variant: "destructive", title: "Error", description: "El área de texto está vacía." });
        return;
    }
    const rows = textData.trim().split('\n').map(row => row.split('	'));
    const headers = ["FECHA", "PLAZA", "NOMBRE", "DIRECCION", "TELEFONO", "AVAL", "TEL. AVAL", "PRESTAMO", "PAGO", "NO.VENC.", "ADEUDO"];
    processAndImportData(rows, headers);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsImporting(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("No se pudo leer el archivo.");
        
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData: (string | number)[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: "" });

        const headers = jsonData.length > 0 ? jsonData.shift() as string[] : [];
        if (headers.length === 0) {
          throw new Error("El archivo está vacío o no tiene encabezados.");
        }
        
        processAndImportData(jsonData, headers);

      } catch (error: any) {
        toast({ variant: "destructive", title: "Error de Archivo", description: error.message || "No se pudo procesar el archivo Excel." });
        setIsImporting(false);
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.onerror = () => {
      toast({ variant: "destructive", title: "Error", description: "No se pudo leer el archivo." });
      setIsImporting(false);
    };
    reader.readAsArrayBuffer(file);
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar Clientes</DialogTitle>
          <DialogDescription>
            Sube un archivo o pega texto para añadir nuevos clientes. El archivo debe contener los encabezados: FECHA, PLAZA, NOMBRE, DIRECCION, TELEFONO, AVAL, TEL. AVAL, PRESTAMO, PAGO, NO.VENC., ADEUDO.
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

          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">
                <FileUp className="mr-2" /> Subir Archivo
              </TabsTrigger>
              <TabsTrigger value="paste">
                <ClipboardPaste className="mr-2" /> Pegar Texto
              </TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="pt-4">
              <div className="grid gap-2">
                <Label htmlFor="file-upload">Selecciona un archivo Excel (.xlsx, .xls, .csv)</Label>
                <div className="relative">
                  <Input 
                    id="file-upload" 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx, .xls, .csv" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isImporting}
                  />
                  <div className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted">
                    {isImporting ? (
                        <div className="flex flex-col items-center gap-2 text-primary">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <p>Procesando archivo...</p>
                        </div>
                    ) : fileName ? (
                      <div className="flex items-center gap-2 text-primary">
                          <Paperclip />
                          <span className="font-medium">{fileName}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Upload className="w-8 h-8"/>
                        <p>Haz clic para buscar o arrastra el archivo aquí</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="paste" className="pt-4">
              <div className="grid gap-2">
                <Label htmlFor="paste-area">
                  Pega aquí los datos de tu hoja de cálculo. La primera fila debe ser los encabezados. Las columnas deben estar separadas por tabulaciones.
                </Label>
                <Textarea
                  id="paste-area"
                  placeholder={`FECHA	PLAZA	NOMBRE	DIRECCION...`}
                  rows={8}
                  value={textData}
                  onChange={(e) => setTextData(e.target.value)}
                  disabled={isImporting}
                />
              </div>
              <Button onClick={handleImportFromText} disabled={isImporting} className="mt-4 w-full">
                {isImporting ? <Loader2 className="mr-2 animate-spin"/> : null}
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
