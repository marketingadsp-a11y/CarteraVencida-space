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
import { Menu, CircleUser, Rocket, Home, Building, LogOut, Settings, ShieldCheck, UsersRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function Header() {
  const { logout, plazas, currentUser } = useContext(AppContext);
  const pathname = usePathname();

  const isUserAdmin = currentUser && 'username' in currentUser && !('plazas' in currentUser);

  const navLinks = [
    { href: "/dashboard", label: "Resumen", icon: Home },
    ...plazas.map((plaza) => ({
      href: `/dashboard/${encodeURIComponent(plaza)}`,
      label: plaza,
      icon: Building,
    })),
  ];
  
  const managementLinks = [
    { href: "/dashboard/management/plazas", label: "Gestionar Plazas", icon: Settings },
    { href: "/dashboard/management/admins", label: "Gestionar Admins", icon: ShieldCheck },
    { href: "/dashboard/management/users", label: "Gestionar Usuarios", icon: UsersRound },
  ];

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="shrink-0 md:hidden">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
             <div className="flex h-16 items-center border-b px-6 mb-4">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold font-headline text-lg">
                    <Rocket className="h-7 w-7 text-accent" />
                    <span>Planet</span>
                </Link>
            </div>
            <div className="p-4">
              <p className="px-3 py-2 text-xs font-semibold text-muted-foreground tracking-wider">CARTERA</p>
              <nav className="grid gap-2 text-lg font-medium">
                  {navLinks.map(({ href, label, icon: Icon }) => {
                      const isActive = pathname === href || pathname.startsWith(href) && href !== "/dashboard";
                      return (
                          <Link
                              key={href}
                              href={href}
                              className={cn("flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground", isActive && "bg-muted text-foreground")}
                          >
                              <Icon className="h-5 w-5" />
                              {label}
                          </Link>
                      )
                  })}
              </nav>
            </div>
            {isUserAdmin && (
              <div className="p-4 pt-0">
                <p className="px-3 py-2 text-xs font-semibold text-muted-foreground tracking-wider">GESTIÓN</p>
                <nav className="grid gap-2 text-lg font-medium">
                  {managementLinks.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname.startsWith(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={cn("flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground", isActive && "bg-muted text-foreground")}
                      >
                        <Icon className="h-5 w-5" />
                        {label}
                      </Link>
                    )
                  })}
                </nav>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </nav>
      <div className="flex w-full items-center justify-end gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <CircleUser className="h-5 w-5" />
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{currentUser?.username}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
