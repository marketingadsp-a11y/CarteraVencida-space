"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rocket, Home, Building, Settings, ShieldCheck, UsersRound, Store, Landmark, Warehouse, School, Factory, Castle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useContext } from "react";
import { AppContext } from "@/contexts/AppContext";
import { Separator } from "../ui/separator";

const plazaIcons = [Building, Store, Landmark, Warehouse, School, Factory, Castle, Home];

export default function Sidebar() {
  const pathname = usePathname();
  const { plazas, currentUser, appName } = useContext(AppContext);

  const isUserAdmin = currentUser && 'username' in currentUser && !('plazas' in currentUser);

  const navLinks = [
    { href: "/dashboard", label: "Resumen", icon: Home },
    ...plazas.map((plaza, index) => ({
      href: `/dashboard/${encodeURIComponent(plaza)}`,
      label: plaza,
      icon: plazaIcons[index % plazaIcons.length],
    })),
  ];

  const managementLinks = [
    { href: "/dashboard/management/plazas", label: "Gestionar Plazas", icon: Building },
    { href: "/dashboard/management/admins", label: "Gestionar Admins", icon: ShieldCheck },
    { href: "/dashboard/management/users", label: "Gestionar Usuarios", icon: UsersRound },
    { href: "/dashboard/management/settings", label: "Ajustes", icon: Settings },
  ];

  return (
    <aside className="hidden w-64 flex-col border-r bg-primary-foreground/5 dark:bg-card md:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold font-headline text-lg">
          <Rocket className="h-7 w-7 text-accent" />
          <span>{appName} - Cartera</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-4">
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground tracking-wider">CARTERA</p>
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
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "bg-muted text-primary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
        {isUserAdmin && (
          <>
            <Separator className="mx-4 w-auto" />
            <div className="p-4">
              <p className="px-3 py-2 text-xs font-semibold text-muted-foreground tracking-wider">GESTIÓN</p>
              <nav className="grid items-start gap-1 text-sm font-medium">
                {managementLinks.map(({ href, label, icon: Icon }) => {
                  const isActive = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                        isActive && "bg-muted text-primary"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </>
        )}
      </ScrollArea>
    </aside>
  );
}
