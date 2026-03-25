"use client"

import Link from "next/link"
import { Sidebar } from "@/components/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"

const mockClients = [
  {
    id: "1",
    name: "Maria Silva",
    status: "ativo",
    plan: "Mensal 3x",
    lastSession: "Hoje",
    phone: "(11) 99999-9999",
  },
  {
    id: "2",
    name: "João Santos",
    status: "ativo",
    plan: "Mensal 2x",
    lastSession: "Ontem",
    phone: "(11) 98888-8888",
  },
  {
    id: "3",
    name: "Ana Costa",
    status: "ativo",
    plan: "Trimestral",
    lastSession: "23 Mar",
    phone: "(11) 97777-7777",
  },
  {
    id: "4",
    name: "Pedro Lima",
    status: "pausado",
    plan: "Mensal 3x",
    lastSession: "15 Mar",
    phone: "(11) 96666-6666",
  },
  {
    id: "5",
    name: "Carla Souza",
    status: "ativo",
    plan: "Avulso",
    lastSession: "20 Mar",
    phone: "(11) 95555-5555",
  },
  {
    id: "6",
    name: "Lucas Oliveira",
    status: "inativo",
    plan: "Mensal 2x",
    lastSession: "01 Fev",
    phone: "(11) 94444-4444",
  },
]

const getStatusColor = (status: string) => {
  switch (status) {
    case "ativo":
      return "bg-primary/10 text-primary border-primary/20"
    case "inativo":
      return "bg-muted text-muted-foreground border-muted"
    case "pausado":
      return "bg-accent/20 text-accent-foreground border-accent/30"
    default:
      return "bg-muted text-muted-foreground"
  }
}

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export default function ClientsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="pl-64 transition-all duration-300">
        <div className="mx-auto max-w-5xl px-8 py-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Clientes</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {mockClients.length} clientes cadastrados
              </p>
            </div>
            <Button className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>

          {/* Search & Filters */}
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, telefone ou email..."
                className="pl-10 bg-card border-border"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>

          {/* Client List */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="divide-y divide-border">
              {mockClients.map((client) => (
                <Link
                  key={client.id}
                  href={`/clientes/${client.id}`}
                  className="flex items-center gap-4 p-5 transition-colors hover:bg-muted/50"
                >
                  <Avatar className="h-12 w-12 border border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-foreground">{client.name}</p>
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(client.status)} capitalize text-xs`}
                      >
                        {client.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {client.plan} • {client.phone}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Última sessão</p>
                    <p className="text-sm font-medium text-foreground">{client.lastSession}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
