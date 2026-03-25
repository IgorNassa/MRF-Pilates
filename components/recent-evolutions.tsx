"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface Evolution {
  id: string
  client: string
  date: string
  summary: string
  professional: string
}

const mockEvolutions: Evolution[] = [
  {
    id: "1",
    client: "Maria Silva",
    date: "Hoje, 09:30",
    summary: "Progresso significativo na mobilidade lombar",
    professional: "Dr. Marcos",
  },
  {
    id: "2",
    client: "João Santos",
    date: "Hoje, 08:15",
    summary: "Ajuste de exercícios para região cervical",
    professional: "Dra. Ana",
  },
  {
    id: "3",
    client: "Ana Costa",
    date: "Ontem, 16:45",
    summary: "Início do protocolo de fortalecimento",
    professional: "Dr. Marcos",
  },
  {
    id: "4",
    client: "Pedro Lima",
    date: "Ontem, 14:00",
    summary: "Avaliação de dor pós-sessão positiva",
    professional: "Dra. Ana",
  },
]

export function RecentEvolutions() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Evoluções Recentes</h2>
        <Link
          href="/evolucoes"
          className="flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          Ver todas
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="space-y-3">
        {mockEvolutions.map((evolution) => (
          <Link
            key={evolution.id}
            href={`/clientes/${evolution.id}`}
            className="block rounded-xl border border-border p-4 transition-all duration-200 hover:border-primary/30 hover:bg-muted/50"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="font-medium text-foreground">{evolution.client}</p>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {evolution.summary}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                {evolution.date}
              </span>
            </div>
            <p className="mt-2 text-xs text-primary">{evolution.professional}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
