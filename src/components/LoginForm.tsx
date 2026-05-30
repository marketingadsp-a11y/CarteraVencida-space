"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useContext, useState } from "react";
import { AppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Rocket } from "lucide-react";

const formSchema = z.object({
  username: z.string().min(1, { message: "El usuario es requerido." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
});

export function LoginForm() {
  const { login, appName, logoUrl } = useContext(AppContext);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const success = await login(values.username, values.password);
    if (!success) {
      toast({
        variant: "destructive",
        title: "Error de autenticación",
        description: "Usuario o contraseña incorrectos.",
      });
      setIsSubmitting(false);
    }
    // No setear isSubmitting a false en caso de éxito, porque la página redirigirá.
  }

  return (
    <div className="w-full max-w-sm bg-white/70 backdrop-blur-md border border-white/60 p-8 rounded-2xl relative overflow-hidden shadow-2xl shadow-indigo-100/40 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out group">
      {/* Decorative inner glow reflection */}
      <div className="absolute -top-12 -left-12 w-24 h-24 bg-white/40 rounded-full blur-xl pointer-events-none" />
      
      <div className="text-center mb-6">
        {logoUrl ? (
          <div className="mx-auto mb-4 w-fit transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-1">
            <img 
              src={logoUrl} 
              alt={appName} 
              className="max-h-32 max-w-[300px] object-contain rounded-xl"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="mx-auto bg-primary text-white p-3.5 rounded-2xl mb-4 w-fit shadow-md transition-transform duration-300 ease-out group-hover:translate-x-1 group-hover:-translate-y-1">
            <Rocket className="h-7 w-7" />
          </div>
        )}
        <h2 className="text-3xl font-headline font-extrabold tracking-tight text-slate-800 mb-1">{appName}</h2>
        <p className="text-xs text-slate-500 font-medium">Bienvenido. Ingrese sus credenciales.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Usuario</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Cristobal" 
                    className="glass-input h-11 bg-white/50 border-slate-200/50 text-slate-800 placeholder-slate-400 focus-visible:ring-primary/20 focus-visible:border-primary/40" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-rose-500 text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-600 text-xs font-semibold uppercase tracking-wider">Contraseña</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="glass-input h-11 bg-white/50 border-slate-200/50 text-slate-800 placeholder-slate-400 focus-visible:ring-primary/20 focus-visible:border-primary/40" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage className="text-rose-500 text-xs" />
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            className="w-full h-11 bg-primary hover:bg-primary/95 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform active:scale-95 border-0 mt-2" 
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
