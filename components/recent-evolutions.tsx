// components/recent-evolutions.tsx
"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { format, isToday, isYesterday } from "date-fns"
import { ptBR } from "date-fns/locale"

export function RecentEvolutions({ evolutions = [] }: { evolutions?: any[] }) {
  
  // Função Sênior para deixar a data amigável ("Hoje, 09:30")
  const formatarData = (dataStr: string) => {
    const data = new Date(dataStr)
    if (isToday(data)) return `Hoje, ${format(data, 'HH:mm')}`
    if (isYesterday(data)) return `Ontem, ${format(data, 'HH:mm')}`
    return format(data, "dd MMM, HH:mm", { locale: ptBR })
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Evoluções Recentes</h2>
        <Link
          href="/clientes" 
          className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          Ver todas
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {evolutions.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-6 bg-muted/30 rounded-xl">
            Nenhuma evolução registada recentemente.
          </p>
        ) : (
          evolutions.map((evolution) => (
            <Link
              key={evolution.id}
              href={`/clientes/${evolution.clientId}`}
              className="block rounded-xl border border-border p-4 transition-all duration-200 hover:border-primary/30 hover:bg-muted/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 overflow-hidden">
                  <p className="font-semibold text-foreground truncate text-sm">{evolution.client}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {evolution.summary}
                  </p>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap bg-muted/50 px-2 py-1 rounded-md">
                  {formatarData(evolution.date)}
                </span>
              </div>
              <p className="mt-3 text-[11px] font-bold text-primary flex items-center gap-1">
                Dra. {evolution.professional}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}