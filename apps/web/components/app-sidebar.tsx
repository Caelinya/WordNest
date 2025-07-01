"use client"

import * as React from "react"
import {
  BookOpen,
  Feather,
  Home,
  PlusCircle,
  Settings,
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
    const { logout } = useAuth();
    // This will be replaced with actual user data
    const user = {
        name: "User",
        email: "user@wordnest.com",
        avatar: "",
    }

    const navMain = [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: Home,
            isActive: true, // This will need to be dynamic based on route
        },
        {
            title: "Add Note",
            url: "/dashboard/add",
            icon: PlusCircle,
        },
        {
            title: "Review",
            url: "/dashboard/review",
            icon: BookOpen,
        },
        {
            title: "Settings",
            url: "/dashboard/settings",
            icon: Settings,
        },
    ]
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Feather className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">WordNest</span>
                  <span className="truncate text-xs">Your Knowledge Base</span>
                </div>
              </a>
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
