"use client";

import { useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppContext } from "@/contexts/AppContext";
import { LoginForm } from "@/components/LoginForm";
import { Loader2 } from "lucide-react";
import { FirebaseWarning } from "@/components/FirebaseWarning";

export default function LoginPage() {
  const { currentUser, isLoading, isFirebaseConfigured } = useContext(AppContext);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && currentUser && isFirebaseConfigured) {
      router.push("/dashboard");
    }
  }, [currentUser, isLoading, router, isFirebaseConfigured]);

  if (!isFirebaseConfigured) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <FirebaseWarning />
      </main>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (currentUser) {
     return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Redirigiendo al panel de control...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <LoginForm />
    </main>
  );
}
