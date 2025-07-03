"use client"

import * as React from "react"
import Link from "next/link"
import {
  BookOpen,
  Feather,
  PlusCircle,
  Settings,
  Library,
  LayoutDashboard,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { useAuth } from "@/contexts/AuthContext"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const { user } = useAuth();
    
    if (!user) {
        // You can return a loading state or null here
        return null;
    }

    const navMain = [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: "Add Note",
            url: "/add",
            icon: PlusCircle,
        },
        {
            title: "My Library",
            url: "/library",
            icon: Library,
        },
        {
            title: "Review",
            url: "/review",
            icon: BookOpen,
        },
        {
            title: "Settings",
            url: "/settings",
            icon: Settings,
        },
    ]
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Feather className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">WordNest</span>
                  <span className="truncate text-xs">Your Knowledge Base</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
         <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
