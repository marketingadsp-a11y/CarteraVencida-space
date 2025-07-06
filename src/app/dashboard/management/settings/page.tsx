"use client";

import { useContext } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";

const settingsSchema = z.object({
  appName: z.string().min(3, { message: "El nombre debe tener al menos 3 caracteres." }),
});

export default function SettingsPage() {
  const { appName, setAppName } = useContext(AppContext);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    values: { appName },
  });

  function onSubmit(values: z.infer<typeof settingsSchema>) {
    setAppName(values.appName);
    toast({
      title: "Ajustes guardados",
      description: "El nombre de la aplicación ha sido actualizado.",
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold font-headline tracking-tight">Ajustes Generales</h1>

      <Card>
        <CardHeader>
          <CardTitle>Nombre de la Aplicación</CardTitle>
          <CardDescription>
            Este nombre aparecerá en el título de la página y en la pantalla de inicio de sesión.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
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
              <Button type="submit">
                <Save className="mr-2" />
                Guardar Cambios
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
