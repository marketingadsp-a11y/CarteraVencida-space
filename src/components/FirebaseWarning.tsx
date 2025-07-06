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
            En el editor de código, crea un nuevo archivo llamado <code className="bg-yellow-200 dark:bg-yellow-800/50 p-1 rounded font-mono text-xs">.env.local</code> en la raíz del proyecto (al mismo nivel que `package.json`).
          </li>
          <li>
            Pega el siguiente contenido en el archivo <code className="bg-yellow-200 dark:bg-yellow-800/50 p-1 rounded font-mono text-xs">.env.local</code> y reemplaza los valores de marcador de posición con tus credenciales de Firebase:
            <pre className="mt-2 p-2 rounded bg-yellow-200/50 dark:bg-yellow-800/30 overflow-x-auto text-xs">
{`NEXT_PUBLIC_FIREBASE_API_KEY="TU_API_KEY"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="TU_AUTH_DOMAIN"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="TU_PROJECT_ID"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="TU_STORAGE_BUCKET"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="TU_MESSAGING_SENDER_ID"
NEXT_PUBLIC_FIREBASE_APP_ID="TU_APP_ID"`}
            </pre>
          </li>
        </ol>
        <p className="font-semibold text-center pt-4">
          Una vez que guardes el archivo .env.local, la aplicación se recargará automáticamente.
        </p>
      </CardContent>
    </Card>
  );
}
