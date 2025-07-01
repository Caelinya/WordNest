"use client"

import * as React from "react"
import { Moon, Sun, Laptop } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [_, startTransition] = React.useTransition()

  const toggleTheme = () => {
    startTransition(() => {
        if (theme === "light") {
            setTheme("dark")
        } else if (theme === "dark") {
            setTheme("system")
        } else {
            setTheme("light")
        }
    })
  }

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
        <Sun className={`h-[1.2rem] w-[1.2rem] transition-all ${theme === 'light' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
        <Moon className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${theme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
        <Laptop className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${theme === 'system' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'}`} />
        <span className="sr-only">Toggle theme</span>
    </Button>
  )
}