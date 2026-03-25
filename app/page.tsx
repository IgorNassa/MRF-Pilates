"use client"

import { Sidebar } from "@/components/sidebar"
import { StatCard } from "@/components/stat-card"
import { CalendarOverview } from "@/components/calendar-overview"
import { RecentEvolutions } from "@/components/recent-evolutions"
import { CalendarDays, Users, CreditCard } from "lucide-react"

export default function DashboardPage() {
  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Bom dia"
    if (hour < 18) return "Boa tarde"
    return "Boa noite"
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      {/* Main Content */}
      <main className="pl-64 transition-all duration-300">
        <div className="mx-auto max-w-7xl px-8 py-10">
          {/* Header */}
          <header className="mb-10">
            <p className="text-sm font-medium text-primary">{greeting()}</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-foreground">
              Bem-vindo de volta, Marcos.
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
              Aqui está o seu dia no MRF Pilates.
            </p>
          </header>

          {/* Stats Grid */}
          <section className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              title="Aulas Hoje"
              value="6/12"
              subtitle="50% concluídas"
              icon={CalendarDays}
              variant="teal"
            />
            <StatCard
              title="Membros Ativos"
              value="142"
              subtitle="+8 este mês"
              icon={Users}
              variant="blue"
            />
            <StatCard
              title="Pagamentos Pendentes"
              value="R$ 450"
              subtitle="3 clientes"
              icon={CreditCard}
              variant="cream"
            />
          </section>

          {/* Main Content Grid */}
          <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CalendarOverview />
            </div>
            <div className="lg:col-span-1">
              <RecentEvolutions />
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
