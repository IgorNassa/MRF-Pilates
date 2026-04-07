"use client"

import { cn } from "@/lib/utils"
import { FileText, ChevronRight } from "lucide-react"

interface Evolution {
  id: string
  date: string
  time: string
  professional: string
  summary: string
  details?: string
}

interface EvolutionTimelineProps {
  evolutions: Evolution[]
  selectedId?: string
  onSelect: (id: string) => void
}

export function EvolutionTimeline({
  evolutions,
  selectedId,
  onSelect,
}: EvolutionTimelineProps) {
  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground">Evoluções Clínicas</h2>
        <p className="text-sm text-muted-foreground">{evolutions.length} registros</p>
      </div>

      <div className="max-h-[600px] overflow-y-auto">
        <div className="relative px-5 py-4">
          {/* Timeline Line */}
          <div className="absolute left-9 top-4 bottom-4 w-px bg-border" />

          <div className="space-y-3">
            {evolutions.map((evolution, index) => (
              <button
                key={evolution.id}
                onClick={() => onSelect(evolution.id)}
                className={cn(
                  "relative w-full rounded-xl border p-4 text-left transition-all duration-200",
                  selectedId === evolution.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card hover:border-primary/30 hover:bg-muted/50"
                )}
              >
                {/* Timeline Dot */}
                <div
                  className={cn(
                    "absolute -left-[26px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2",
                    selectedId === evolution.id
                      ? "border-primary bg-primary"
                      : "border-border bg-card"
                  )}
                />

                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                      selectedId === evolution.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <FileText className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {evolution.date}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {evolution.time}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {evolution.summary}
                    </p>
                    <p className="mt-2 text-xs text-primary">{evolution.professional}</p>
                  </div>

                  <ChevronRight
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors",
                      selectedId === evolution.id
                        ? "text-primary"
                        : "text-muted-foreground/50"
                    )}
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
