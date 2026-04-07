"use client"

import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface StatCardProps {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  variant?: "default" | "teal" | "blue" | "cream"
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:shadow-lg",
        "backdrop-blur-xl border border-border/50",
        variant === "default" && "bg-card/80",
        variant === "teal" && "bg-primary/5 border-primary/10",
        variant === "blue" && "bg-accent/20 border-accent/20",
        variant === "cream" && "bg-secondary border-secondary/50"
      )}
    >
      {/* Glassmorphism effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
              {value}
            </p>
            {subtitle && (
              <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
              variant === "default" && "bg-muted",
              variant === "teal" && "bg-primary/10",
              variant === "blue" && "bg-accent/30",
              variant === "cream" && "bg-secondary"
            )}
          >
            <Icon
              className={cn(
                "h-6 w-6",
                variant === "default" && "text-muted-foreground",
                variant === "teal" && "text-primary",
                variant === "blue" && "text-accent-foreground",
                variant === "cream" && "text-secondary-foreground"
              )}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
