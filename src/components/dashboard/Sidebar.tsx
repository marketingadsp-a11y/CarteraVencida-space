"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rocket, Home, Building, Store, Landmark, Warehouse, School, Factory, Castle, Settings, ShieldCheck, UsersRound, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContext } from "react";
import { AppContext } from "@/contexts/AppContext";

const plazaIcons = [Building, Store, Landmark, Warehouse, School, Factory, Castle, Home];

export default function Sidebar() {
  const pathname = usePathname();
  const { userPlazas, appName, currentUser, logoUrl } = useContext(AppContext);

  const isUserAdmin = currentUser && 'username' in currentUser && !('plazas' in currentUser);

  const navLinks = [
    { href: "/dashboard", label: "Resumen", icon: Home },
    ...userPlazas.map((plaza, index) => ({
      href: `/dashboard/${encodeURIComponent(plaza)}`,
      label: plaza,
      icon: plazaIcons[index % plazaIcons.length],
    })),
  ];

  const managementLinks = [
    { href: "/dashboard/management/plazas", label: "Gestionar Plazas", icon: Building },
    { href: "/dashboard/management/admins", label: "Gestionar Admins", icon: ShieldCheck },
    { href: "/dashboard/management/users", label: "Gestionar Usuarios", icon: UsersRound },
    { href: "/dashboard/management/history", label: "Historial", icon: History },
    { href: "/dashboard/management/settings", label: "Ajustes", icon: Settings },
  ];

  return (
    <aside className="hidden w-64 flex-col bg-white rounded-xl border border-slate-200 shadow-sm md:flex h-full overflow-hidden shrink-0">
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold font-headline text-lg text-slate-800">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={appName} 
              className="h-8 max-w-[80px] object-contain rounded-md border border-slate-100 bg-white p-0.5"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="bg-primary p-1.5 rounded-lg text-white shadow-sm">
              <Rocket className="h-4 w-4" />
            </div>
          )}
          <span>{appName}</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">CARTERA</p>
          <nav className="grid items-start gap-1 text-sm font-medium">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/dashboard"
                  ? pathname === href
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-205",
                    isActive 
                      ? "bg-indigo-50/70 text-primary font-semibold border-l-2 border-primary" 
                      : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                  )}
                >
                  <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-slate-400")} />
                  {label}
                </Link>
              );
            })}
          </nav>

          {isUserAdmin && (
            <>
              <p className="px-3 py-2 mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">GESTIÓN</p>
              <nav className="grid items-start gap-1 text-sm font-medium">
                {managementLinks.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-205",
                        isActive 
                          ? "bg-indigo-50/70 text-primary font-semibold border-l-2 border-primary" 
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-slate-400")} />
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </>
          )}

        </div>
      </ScrollArea>
    </aside>
  );
}
