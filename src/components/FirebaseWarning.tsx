import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export function FirebaseWarning() {
  return (
    <Card className="w-full max-w-2xl bg-yellow-50 border-yellow-300 dark:bg-yellow-900/20 dark:border-yellow-700">
      <CardHeader className="text-center">
        <div className="mx-auto bg-yellow-100 text-yellow-600 p-3 rounded-full mb-4 dark:bg-yellow-800/30 dark:text-yellow-400">
            <AlertTriangle className="h-8 w-8" />
        </div>
        <CardTitle className="text-2xl text-yellow-800 dark:text-yellow-200">Acción Requerida: Configura Firebase</CardTitle>
        <CardDescription className="text-yellow-700 dark:text-yellow-300">
          Tu aplicación no puede conectarse a la base de datos porque Firebase no está configurado.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-yellow-800 dark:text-yellow-300 space-y-4">
        <p>
          Para solucionar esto, sigue estos pasos:
        </p>
        <ol className="list-decimal list-inside space-y-2">
          <li>Ve a la consola de <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="underline font-semibold">Firebase</a> y crea un nuevo proyecto (o selecciona uno existente).</li>
          <li>Dentro de tu proyecto, ve a la configuración del proyecto (ícono de engrane).</li>
          <li>En la sección "Tus apps", crea una nueva "App web" si no tienes una.</li>
          <li>Copia el objeto de configuración de Firebase (firebaseConfig).</li>
          <li>
            Abre el archivo <code className="bg-yellow-200 dark:bg-yellow-800/50 p-1 rounded font-mono text-xs">src/lib/firebase.ts</code> en el editor.
          </li>
          <li>Pega el objeto de configuración que copiaste para reemplazar los valores de marcador de posición.</li>
        </ol>
        <p className="font-semibold text-center pt-4">
          Una vez que guardes los cambios en el archivo, la aplicación se recargará automáticamente.
        </p>
      </CardContent>
    </Card>
  );
}
