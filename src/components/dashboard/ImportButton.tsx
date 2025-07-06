"use client";

import { useContext } from 'react';
import { AppContext } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { mockClients } from '@/lib/mock-data';
import { useToast } from "@/hooks/use-toast";

export default function ImportButton() {
  const { setClients } = useContext(AppContext);
  const { toast } = useToast();

  const handleImport = () => {
    // In a real app, this would open a file dialog and parse an Excel file.
    // For this mock, we just load the mock data.
    setClients(mockClients);
    toast({
        title: "Datos importados",
        description: `${mockClients.length} registros de clientes han sido cargados.`,
    })
  };

  return (
    <Button onClick={handleImport}>
      <Upload className="mr-2 h-4 w-4" />
      Importar Clientes (Excel)
    </Button>
  );
}
