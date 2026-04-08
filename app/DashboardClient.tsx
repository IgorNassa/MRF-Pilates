// app/DashboardClient.tsx
"use client"

import { Sidebar } from "@/components/sidebar"
import { StatCard } from "@/components/stat-card"
import { CalendarOverview } from "@/components/calendar-overview"
import { RecentEvolutions } from "@/components/recent-evolutions"
import { CalendarDays, Users, CreditCard, Gift, MessageCircle } from "lucide-react"

export default function DashboardClient({ data }: { data: any }) {
  
  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Bom dia"
    if (hour < 18) return "Boa tarde"
    return "Boa noite"
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 min-w-0 pt-16 lg:pt-0 lg:pl-64 transition-all duration-300 pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-in fade-in duration-500">
          
          <header className="mb-8 lg:mb-10">
            <p className="text-sm font-bold text-primary uppercase tracking-wider">{greeting()}</p>
            <h1 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-foreground">
              Bem-vinda de volta, {data.firstName}.
            </h1>
            <p className="mt-2 text-sm lg:text-base text-muted-foreground font-medium">
              Aqui está o seu dia no MRF Studio.
            </p>
          </header>

          <section className="mb-8 lg:mb-10 grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 md:grid-cols-3">
            <StatCard 
              title="Aulas Hoje" 
              value={`${data.aulasRealizadas}/${data.totalAulasHoje}`} 
              subtitle={`${data.pctAulas}% concluídas`} 
              icon={CalendarDays} 
              variant="teal" 
            />
            <StatCard 
              title="Membros Ativos" 
              value={data.totalAlunosAtivos.toString()} 
              subtitle={`+${data.clientesCriadosEsteMes} este mês`} 
              icon={Users} 
              variant="blue" 
            />
            <StatCard 
              title="Pagamentos" 
              value={data.receitaFormatada} 
              subtitle={`${data.receitasPendentes} pendente(s)`} 
              icon={CreditCard} 
              variant="cream" 
            />
          </section>

          <section className="grid grid-cols-1 gap-6 lg:gap-8 xl:grid-cols-3">
            <div className="xl:col-span-2 space-y-6">
              
              {/* Passamos as aulas reais de hoje para o componente */}
              <CalendarOverview appointments={data.agendaRealDeHoje} />
              
              <div className="bg-card rounded-2xl border border-border shadow-sm p-5 sm:p-6">
                 <h3 className="text-lg font-bold flex items-center gap-2 mb-4 text-foreground">
                  <Gift className="w-5 h-5 text-amber-500" /> Aniversariantes do Dia
                </h3>
                
                <div className="space-y-3">
                  {data.aniversariantes.length === 0 ? (
                    <div className="bg-muted/30 border border-border/50 rounded-xl p-6 text-center">
                      <p className="text-sm text-muted-foreground font-medium">Nenhum aluno faz anos hoje.</p>
                    </div>
                  ) : (
                    data.aniversariantes.map((cliente: any) => {
                      const msgPersonalizada = data.msgAniversarioBase.replace(/\[NOME\]/g, cliente.name)
                      const numeroLimpo = cliente.phone.replace(/\D/g, '')
                      const linkWhatsApp = `https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(msgPersonalizada)}`

                      return (
                        <div key={cliente.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20 hover:bg-muted/50 transition-colors p-4 rounded-xl border border-border">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-foreground truncate">{cliente.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{cliente.phone || 'Sem número registado'}</p>
                          </div>
                          <a 
                            href={linkWhatsApp} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center justify-center sm:justify-start gap-2 text-xs font-bold bg-[#25D366] hover:bg-[#1DA851] text-white px-4 py-2 sm:py-1.5 rounded-lg shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 w-full sm:w-auto shrink-0"
                          >
                            <MessageCircle className="w-4 h-4" /> Enviar Parabéns
                          </a>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

            </div>
            
            <div className="xl:col-span-1">
              <RecentEvolutions evolutions={data.ultimasEvolucoes} />
            </div>
          </section>

        </div>
      </main>
    </div>
  )
}