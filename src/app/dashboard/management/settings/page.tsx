"use client";

import { useContext, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save, Loader2 } from "lucide-react";

const settingsSchema = z.object({
  appName: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
  logoUrl: z.string().url({ message: "Ingrese una URL válida (ej: https://ejemplo.com/logo.png)." }).or(z.string().length(0)),
});

export default function SettingsPage() {
  const { appName, setAppName, logoUrl, setLogoUrl } = useContext(AppContext);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    values: { appName, logoUrl },
  });

  async function onSubmit(values: z.infer<typeof settingsSchema>) {
    setIsSubmitting(true);
    await setAppName(values.appName);
    await setLogoUrl(values.logoUrl);
    toast({
      title: "Ajustes guardados",
      description: "El nombre y logotipo de la aplicación han sido actualizados.",
    });
    setIsSubmitting(false);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold font-headline tracking-tight">Ajustes Generales</h1>

      <Card>
        <CardHeader>
          <CardTitle>Configuración de Marca</CardTitle>
          <CardDescription>
            Personaliza la apariencia de la plataforma configurando el nombre y logotipo de tu empresa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md">
              <FormField
                control={form.control}
                name="appName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la App</FormLabel>
                    <FormControl>
                      <Input placeholder="Mi Cartera App" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL del Logotipo</FormLabel>
                    <FormControl>
                      <Input placeholder="https://ejemplo.com/logo.png" {...field} />
                    </FormControl>
                    <FormDescription>
                      Ingresa la URL de la imagen del logotipo. Se utilizará en la barra lateral y en la pantalla de inicio de sesión. Dejar vacío para usar el icono por defecto.
                    </FormDescription>
                    <FormMessage />
                    {field.value && (
                      <div className="mt-3 p-3 border border-dashed border-slate-200 rounded-lg bg-slate-50 w-fit">
                        <p className="text-xs text-slate-400 mb-1.5 font-medium">Vista previa del logotipo:</p>
                        <img 
                          src={field.value} 
                          alt="Vista previa" 
                          className="max-h-16 max-w-[200px] object-contain rounded-md border border-slate-100 bg-white p-1"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
