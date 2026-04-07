"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Phone, Mail, Calendar } from "lucide-react"
import Link from "next/link"

interface ClientHeaderProps {
  client: {
    name: string
    avatar?: string
    status: "ativo" | "inativo" | "pausado"
    plan: string
    phone: string
    email: string
    memberSince: string
  }
}

export function ClientHeader({ client }: ClientHeaderProps) {
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

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
        {/* Botão de Voltar */}
        <div className="w-full flex sm:w-auto justify-start">
          <Link
            href="/clientes"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </Link>
        </div>

        {/* Avatar */}
        <Avatar className="h-20 w-20 border-2 border-primary/20">
          <AvatarImage src={client.avatar} alt={client.name} />
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
            {getInitials(client.name)}
          </AvatarFallback>
        </Avatar>

        {/* Informações */}
        <div className="flex-1 flex flex-col items-center sm:items-start">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <h1 className="text-2xl font-semibold text-foreground">{client.name}</h1>
            <Badge
              variant="outline"
              className={`${getStatusColor(client.status)} capitalize`}
            >
              {client.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-primary font-medium">{client.plan}</p>
          
          <div className="mt-4 flex flex-col sm:flex-row flex-wrap items-center sm:items-start gap-3 sm:gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {client.phone}
            </span>
            <span className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {client.email}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Membro desde {client.memberSince}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
