"use client";

import { useContext } from "react";
import Link from "next/link";
import { AppContext } from "@/contexts/AppContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, CircleUser, Rocket, Home, Building, LogOut, Settings, ShieldCheck, UsersRound, Store, Landmark, Warehouse, School, Factory, Castle, ArrowLeft, History } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const plazaIcons = [Building, Store, Landmark, Warehouse, School, Factory, Castle, Home];

export default function Header() {
  const { logout, userPlazas, currentUser, appName, logoUrl } = useContext(AppContext);
  const pathname = usePathname();
  const router = useRouter();

  const isUserAdmin = currentUser && 'username' in currentUser && !('plazas' in currentUser);
  const isOnPlazaPage = /^\/dashboard\/[^/]+$/.test(pathname);

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
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 bg-white rounded-xl border border-slate-200 px-6 shadow-sm">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="shrink-0 md:hidden bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 rounded-lg">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 bg-white border-y-0 border-l-0 border-r border-slate-200 shadow-sm w-72">
           <div className="flex h-16 items-center border-b border-slate-200 px-6 mb-4">
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
          <div className="p-4">
            <p className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">CARTERA</p>
            <nav className="grid gap-1.5 text-sm font-medium">
                {navLinks.map(({ href, label, icon: Icon }) => {
                    const isActive = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 transition-all", 
                              isActive 
                                ? "bg-indigo-50/70 text-primary font-semibold border-l-2 border-primary" 
                                : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                            )}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                        </Link>
                    )
                })}
            </nav>

            {isUserAdmin && (
              <>
                <p className="px-3 py-2 mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">GESTIÓN</p>
                <nav className="grid gap-1.5 text-sm font-medium">
                  {managementLinks.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname.startsWith(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all", 
                          isActive 
                            ? "bg-indigo-50/70 text-primary font-semibold border-l-2 border-primary" 
                            : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    );
                  })}
                </nav>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
      {isOnPlazaPage && (
        <Link href="/dashboard" className="md:hidden">
          <Button variant="ghost" size="icon" className="text-slate-700 hover:bg-slate-100/60">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Volver a Resumen</span>
          </Button>
        </Link>
      )}
      <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm">
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border border-slate-200 text-slate-800 shadow-md w-56">
            <DropdownMenuLabel className="font-semibold text-slate-900">{currentUser?.username}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-250/60" />
             {isUserAdmin && (
              <>
                {managementLinks.map(({ href, label, icon: Icon }) => (
                  <DropdownMenuItem key={href} onClick={() => router.push(href)} className="cursor-pointer hover:bg-slate-50 focus:bg-slate-50 text-slate-750 hover:text-slate-900 focus:text-slate-900">
                    <Icon className="mr-2 h-4 w-4 text-slate-400" />
                    {label}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-slate-250/60" />
              </>
             )}
            <DropdownMenuItem onClick={logout} className="cursor-pointer text-rose-600 hover:bg-rose-50 focus:bg-rose-50 hover:text-rose-700 focus:text-rose-700">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
