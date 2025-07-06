"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Rocket, Home, Building } from "lucide-react";
import { PLAZAS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Sidebar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/dashboard", label: "Resumen", icon: Home },
    ...PLAZAS.map((plaza) => ({
      href: `/dashboard/${encodeURIComponent(plaza)}`,
      label: plaza,
      icon: Building,
    })),
  ];

  return (
    <aside className="hidden w-64 flex-col border-r bg-primary-foreground/5 dark:bg-card md:flex">
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold font-headline text-lg">
          <Rocket className="h-7 w-7 text-accent" />
          <span>Planet - Cartera</span>
        </Link>
      </div>
      <ScrollArea className="flex-1">
        <nav className="grid items-start gap-1 p-4 text-sm font-medium">
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
      </ScrollArea>
    </aside>
  );
}
