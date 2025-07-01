"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Feather,
  Home,
  PlusCircle,
  BookOpen,
  Settings,
  Menu,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "../ui/ThemeToggle";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/add", label: "Add Note", icon: PlusCircle },
  { href: "/review", label: "Review", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

function MainNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  return (
    <nav className="grid items-start gap-2 px-2 text-sm font-medium">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
            pathname === item.href && "bg-muted text-primary"
          )}
        >
          <item.icon className="h-4 w-4" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { logout } = useAuth();
  
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* --- Desktop Sidebar --- */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Feather className="h-6 w-6" />
              <span className="">WordNest</span>
            </Link>
          </div>
          <div className="flex-1">
            <MainNav items={navItems} />
          </div>
          <div className="mt-auto p-4 border-t">
              {/* User info can go here */}
              <div className="flex items-center justify-between">
                 <Button onClick={logout} variant="ghost">Logout</Button>
                 <ThemeToggle />
              </div>
          </div>
        </div>
      </div>
       {/* --- Mobile Header & Sidebar --- */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
           <Sheet>
                <SheetTrigger asChild>
                    <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    >
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col">
                    <div className="flex h-14 items-center border-b px-4">
                        <Link href="/" className="flex items-center gap-2 font-semibold">
                            <Feather className="h-6 w-6" />
                            <span className="">WordNest</span>
                        </Link>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <MainNav items={navItems} />
                    </div>
                     <div className="mt-auto p-4 border-t">
                        <div className="flex items-center justify-between">
                            <Button onClick={logout} variant="ghost">Logout</Button>
                            <ThemeToggle />
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
          <div className="w-full flex-1">
            {/* Mobile Header content can go here, e.g., a search bar */}
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}