// app/clientes/[id]/page.tsx
import { getClientById, getSettings } from "@/lib/actions"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Phone, Mail, MapPin, Calendar, HeartPulse, FileText, Stethoscope, MessageCircle, AlertCircle, Crown, Zap, DollarSign, Ticket, CalendarClock, CheckCircle2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/sidebar"
import PlanButtons from "./PlanButtons"
import EvolutionList from "./EvolutionList"
import ClientFinanceHistory from "./ClientFinanceHistory"
import ClientAppointmentsManager from "./ClientAppointmentsManager"

export default async function ClientProfilePage({ params }: { params: { id: string } }) {
  const client = await getClientById(params.id)
  const settings = await getSettings()

  if (!client) {
    notFound()
  }

  const zapNumber = client.phone.replace(/\D/g, '')
  const zapLink = `https://wa.me/55${zapNumber}?text=Olá%20${encodeURIComponent(client.name.split(' ')[0])},%20tudo%20bem?%20Aqui%20é%20da%20clínica%20MRF%20Pilates.`

  // =========================================================
  // MOTOR DE CÁLCULO DE PACOTES (À PROVA DE FALHAS)
  // =========================================================
  const totalComprado = client.totalSessions || 0
  
  // 1. Usamos a data da última venda do pacote como "Ponto de Partida" para não contar aulas antigas de pacotes passados
  const cycleStart = client.planLastPayment ? new Date(client.planLastPayment).getTime() : new Date(client.createdAt).getTime()
  
  // 2. Pegar todas as aulas (que não foram canceladas) a partir da compra do pacote atual
  const aulasValidasDoCiclo = (client.appointments || []).filter((a: any) => 
    a.type?.includes('PILATES_') && 
    a.status !== 'CANCELADO' && 
    new Date(a.date).getTime() >= cycleStart
  )

  // 3. Faltas contam como consumidas! (FALTA ou REALIZADO)
  const aulasConcluidas = aulasValidasDoCiclo.filter((a: any) => a.status === 'REALIZADO' || a.status === 'FALTA').length
  
  // 4. Aulas que estão na agenda pro futuro
  const aulasFuturasNaAgenda = aulasValidasDoCiclo.filter((a: any) => a.status === 'AGENDADO').length
  
  // 5. Saldo Livre (Ignora a coluna do banco e calcula a matemática real na hora)
  const saldoLivreParaAgendar = Math.max(0, totalComprado - (aulasConcluidas + aulasFuturasNaAgenda))
  
  // 6. Barra de Progresso
  const progressPercentage = totalComprado > 0 ? Math.min((aulasConcluidas / totalComprado) * 100, 100) : 0

  const generalDocs = Array.isArray(client.generalDocsLinks) ? client.generalDocsLinks : []
  const examDocs = Array.isArray(client.examDocsLinks) ? client.examDocsLinks : []
  const transacoesPaciente = client.transactions?.filter(t => t.type === 'RECEITA') || []

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 min-w-0 pt-16 lg:pt-0 lg:pl-64 transition-all duration-300 pb-12 overflow-y-auto">
        <div className="bg-card border-b border-border sticky top-0 z-10 print:hidden">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center gap-3 sm:gap-4">
            <Link href="/clientes">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted shrink-0"><ArrowLeft className="h-5 w-5" /></Button>
            </Link>
            <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">Prontuário de {client.name.split(' ')[0]}</h1>
            <span className="ml-auto px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold bg-primary/10 text-primary uppercase tracking-wider shrink-0">
              {client.status}
            </span>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 print:block print:mt-0 print:mx-4">
          
          <div className="lg:col-span-4 space-y-6 print:hidden">
            
            <div className="bg-card rounded-2xl sm:rounded-3xl border border-border shadow-sm p-6 sm:p-8 flex flex-col items-center text-center transition-all hover:shadow-md">
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-full border-4 border-muted overflow-hidden bg-muted mb-4 sm:mb-5 shadow-inner shrink-0 relative">
                {client.fotoPerfil ? (
                  <img src={client.fotoPerfil} alt={client.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-primary/5 text-primary text-3xl font-bold">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground break-words w-full">{client.name}</h2>
              <p className="text-sm sm:text-base text-muted-foreground font-medium mb-6 flex items-center gap-1.5 justify-center">
                {client.plan ? <><Crown className="w-4 h-4 text-amber-500" /> {client.plan.replace(/_/g, ' ')}</> : "Sem pacote ativo"}
              </p>
              
              <a href={zapLink} target="_blank" rel="noreferrer" className="w-full">
                <Button className="w-full h-11 sm:h-12 rounded-xl gap-2 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm hover:shadow-md transition-all">
                  <MessageCircle className="h-5 w-5 shrink-0" />
                  WhatsApp Rápido
                </Button>
              </a>
            </div>

            <div className="bg-card rounded-2xl sm:rounded-3xl border border-border shadow-sm overflow-hidden">
              <div className="bg-muted/30 border-b border-border p-5 sm:p-6 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> Pacote de Sessões</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Gestão de pacote e aulas</p>
                </div>
                <PlanButtons 
                  clientId={client.id} 
                  currentPlan={client.plan} 
                  planValue={client.planValue}
                  settings={settings} 
                />
              </div>
              
              <div className="p-5 sm:p-6 space-y-6">
                {client.plan ? (
                  <>
                    <div>
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aulas Concluídas</span>
                        <span className="text-xl font-black text-primary">
                          {aulasConcluidas}<span className="text-sm text-muted-foreground font-semibold">/{totalComprado}</span>
                        </span>
                      </div>
                      <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden shadow-inner">
                        <div className="bg-primary h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercentage}%` }}></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                        <Ticket className="w-4 h-4 text-slate-400 mb-1" />
                        <p className="text-[9px] font-bold text-slate-500 uppercase">Compradas</p>
                        <p className="font-black text-lg text-slate-800">{totalComprado}</p>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-1" />
                        <p className="text-[9px] font-bold text-emerald-600 uppercase">Concluídas</p>
                        <p className="font-black text-lg text-emerald-700">{aulasConcluidas}</p>
                      </div>
                      <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl flex flex-col items-center justify-center text-center">
                        <CalendarClock className="w-4 h-4 text-indigo-500 mb-1" />
                        <p className="text-[9px] font-bold text-indigo-600 uppercase">Marcadas</p>
                        <p className="font-black text-lg text-indigo-700">{aulasFuturasNaAgenda}</p>
                      </div>
                      <div className={`p-3 rounded-xl flex flex-col items-center justify-center text-center border ${saldoLivreParaAgendar > 0 ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                        <Zap className={`w-4 h-4 mb-1 ${saldoLivreParaAgendar > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
                        <p className={`text-[9px] font-bold uppercase ${saldoLivreParaAgendar > 0 ? 'text-amber-600' : 'text-slate-500'}`}>Saldo Livre</p>
                        <p className={`font-black text-lg ${saldoLivreParaAgendar > 0 ? 'text-amber-600' : 'text-slate-700'}`}>{saldoLivreParaAgendar}</p>
                      </div>
                    </div>

                    {client.repositionCredits > 0 && (
                      <div className="bg-orange-50 border border-orange-200 p-3 rounded-xl flex items-center gap-4 mt-3">
                        <div className="bg-orange-100 p-2 rounded-lg text-orange-500"><RotateCcw className="w-5 h-5"/></div>
                        <div>
                          <p className="text-[10px] font-bold text-orange-600 uppercase">Reposições Disponíveis</p>
                          <p className="font-black text-xl text-orange-700">{client.repositionCredits} <span className="text-sm font-bold text-orange-500">Saldos Livres</span></p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-muted/30 border border-border p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Valor do Pacote</p>
                        <p className="font-bold text-foreground mt-0.5">{client.planValue === 0 ? 'ISENTO' : `R$ ${client.planValue?.toFixed(2) || '0.00'}`}</p>
                      </div>
                      <div className="bg-muted/30 border border-border p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Forma de Pagamento</p>
                        <p className="font-bold text-foreground mt-0.5">{(client as any).planPaymentMethod?.replace(/_/g, ' ') || 'PIX'}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4 bg-muted/30 rounded-xl border border-dashed border-border">
                    <p className="text-sm text-muted-foreground">O paciente não possui um pacote ativo. As sessões estão sendo tratadas como avulsas.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card rounded-2xl sm:rounded-3xl border border-border shadow-sm p-6 sm:p-8 space-y-5">
              <h3 className="font-bold text-base sm:text-lg border-b pb-3">Informações Pessoais</h3>
              <div className="space-y-4 sm:space-y-5">
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0"><p className="text-xs sm:text-sm font-semibold">Telefone</p><p className="text-sm text-muted-foreground truncate">{client.phone}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0"><p className="text-xs sm:text-sm font-semibold">E-mail</p><p className="text-sm text-muted-foreground truncate">{client.email || "Não informado"}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0"><p className="text-xs sm:text-sm font-semibold">Nascimento</p><p className="text-sm text-muted-foreground truncate">{client.dataNascimento ? new Date(client.dataNascimento).toLocaleDateString('pt-BR') : "Não informado"}</p></div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0"><p className="text-xs sm:text-sm font-semibold">Endereço</p><p className="text-sm text-muted-foreground break-words">{client.logradouro}, {client.numero} - {client.cidade}/{client.uf}</p></div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6 sm:space-y-8 print:space-y-6">

            <ClientAppointmentsManager client={client} appointments={(client as any).appointments || []} />
            
            <div className="bg-card rounded-2xl sm:rounded-3xl border border-border shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4 sm:mb-6 border-b border-border pb-4">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600" />
                <h3 className="text-lg sm:text-xl font-bold">Histórico Financeiro</h3>
              </div>
              
              <ClientFinanceHistory transacoesPaciente={transacoesPaciente} />
            </div>

            {client.condicoesMedicas && (
              <div className="bg-destructive/5 border border-destructive/20 rounded-2xl sm:rounded-3xl p-5 sm:p-6 flex items-start gap-3 sm:gap-4">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-destructive shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-destructive text-sm sm:text-base">Atenção Médica / Alergias</h4>
                  <p className="text-xs sm:text-sm text-destructive/80 mt-1 leading-relaxed">{client.condicoesMedicas}</p>
                </div>
              </div>
            )}

            <div className="bg-card rounded-2xl sm:rounded-3xl border border-border shadow-sm p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <HeartPulse className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <h3 className="text-lg sm:text-xl font-bold">Queixa Principal / Avaliação Inicial</h3>
              </div>
              <div className="bg-muted/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-border/50">
                <p className="text-sm sm:text-base text-foreground leading-relaxed whitespace-pre-wrap font-medium">
                  {client.queixaPrincipal || "Nenhuma queixa registrada no momento da avaliação."}
                </p>
              </div>
            </div>

            <div className="bg-card rounded-2xl sm:rounded-3xl border border-border shadow-sm p-6 sm:p-8 print:hidden">
              <h3 className="text-lg sm:text-xl font-bold mb-5 sm:mb-6 flex items-center gap-2">Nuvem de Arquivos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground flex items-center gap-2 uppercase tracking-wider"><Stethoscope className="h-4 w-4" /> Exames & Laudos</h4>
                  {examDocs.length > 0 ? (
                    <div className="space-y-2">
                      {examDocs.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group">
                          <div className="bg-blue-500/10 p-2 rounded-lg text-blue-600 shrink-0"><FileText className="h-5 w-5" /></div>
                          <span className="text-xs sm:text-sm font-medium truncate group-hover:text-blue-600">Laudo_{i+1}.pdf</span>
                        </a>
                      ))}
                    </div>
                  ) : <p className="text-xs sm:text-sm text-muted-foreground italic">Nenhum exame anexado.</p>}
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-xs sm:text-sm text-muted-foreground flex items-center gap-2 uppercase tracking-wider"><FileText className="h-4 w-4" /> Docs Gerais</h4>
                  {generalDocs.length > 0 ? (
                    <div className="space-y-2">
                      {generalDocs.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group">
                          <div className="bg-primary/10 p-2 rounded-lg text-primary shrink-0"><FileText className="h-5 w-5" /></div>
                          <span className="text-xs sm:text-sm font-medium truncate group-hover:text-primary">Documento_{i+1}.pdf</span>
                        </a>
                      ))}
                    </div>
                  ) : <p className="text-xs sm:text-sm text-muted-foreground italic">Nenhum documento anexado.</p>}
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl sm:rounded-3xl border border-border shadow-sm p-4 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 sm:mb-8 gap-4 border-b border-border pb-4">
                <h3 className="text-lg sm:text-xl font-bold">Histórico de Tratamento (Evoluções)</h3>
              </div>
              <EvolutionList evolutions={client.evolutions} />
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}