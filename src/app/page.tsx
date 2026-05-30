"use client";

import { useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppContext } from "@/contexts/AppContext";
import { LoginForm } from "@/components/LoginForm";
import { Loader2 } from "lucide-react";
import { FirebaseWarning } from "@/components/FirebaseWarning";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];

    const particleCount = Math.min(75, Math.floor((width * height) / 18000));

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 3 + 2.5,
      });
    }

    let mouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Background gradient
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#f8fafc"); // Slate 50
      grad.addColorStop(1, "#e0e7ff"); // Indigo 50
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Draw particles as dollar signs ($)
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.fillStyle = "rgba(79, 70, 229, 0.55)"; // Much more visible indigo
        ctx.font = `bold ${p.radius * 3.5}px system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("$", p.x, p.y);
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(79, 70, 229, ${0.3 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      // Draw connections to mouse
      if (mouse.x > -1000) {
        particles.forEach((p) => {
          const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
          if (dist < 200) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.strokeStyle = `rgba(79, 70, 229, ${0.5 * (1 - dist / 200)})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        });
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none" />;
}

export default function LoginPage() {
  const { currentUser, isLoading, isFirebaseConfigured } = useContext(AppContext);
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <div className="flex min-h-screen items-center justify-center bg-transparent">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (currentUser) {
     return (
      <div className="flex min-h-screen items-center justify-center bg-transparent text-slate-700">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg font-medium">Redirigiendo al panel de control...</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 relative overflow-hidden bg-transparent">
      <ParticleBackground />
      <LoginForm />
      <footer className="absolute bottom-4 left-0 right-0 w-full text-center z-10">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center transition-all hover:scale-105 active:scale-95 duration-200"
        >
          <img 
            src="https://i.ibb.co/BKGcZ4Hw/studio-spane-SVapp.png" 
            alt="Studio .space logo" 
            className="h-5 object-contain opacity-50 hover:opacity-80 transition-opacity" 
          />
        </button>
      </footer>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[360px] bg-white border border-slate-200 text-slate-800 p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center">
          <DialogTitle className="sr-only">Información de Studio .space</DialogTitle>
          <center className="w-full space-y-3">
            <img 
              src="https://i.ibb.co/kb58VbG/space-saluda-1.jpg" 
              alt="space" 
              className="max-h-48 rounded-xl object-contain mx-auto border border-slate-100 bg-slate-50 p-0.5"
            />
            <div className="text-base font-bold text-slate-900 mt-2">Studio .space</div>
            <div className="text-sm text-indigo-600 font-semibold">hola@coorporativo.online</div>
            <div className="text-sm text-slate-500 font-medium">3411975639</div>
          </center>
        </DialogContent>
      </Dialog>
    </main>
  );
}
