"use client"

import * as React from "react"
import { Moon, Sun, Laptop } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    // To prevent hydration mismatch, we can return a placeholder or null.
    // A placeholder matching the dimensions can prevent layout shift.
    return <div className="h-10 w-[104px] rounded-full bg-secondary/50" />
  }

  const themes = [
    { name: "light", icon: Sun },
    { name: "dark", icon: Moon },
    { name: "system", icon: Laptop },
  ]

  return (
    <div className="relative flex items-center rounded-full bg-secondary p-1">
      <div
        className={cn(
          "absolute h-8 w-8 rounded-full bg-background shadow-sm transition-transform",
          theme === "light"
            ? "translate-x-0"
            : theme === "dark"
            ? "translate-x-full"
            : "translate-x-[200%]"
        )}
      />
      {themes.map((item) => (
        <Button
          key={item.name}
          variant="ghost"
          size="icon"
          className="z-10 h-8 w-8 rounded-full"
          onClick={() => setTheme(item.name)}
        >
          <item.icon className="h-5 w-5" />
          <span className="sr-only">Toggle to {item.name} theme</span>
        </Button>
      ))}
    </div>
  )
}