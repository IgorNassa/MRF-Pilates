'use client'

import { useState, useEffect, Fragment } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Clock, DollarSign, ArrowDownRight, ArrowUpRight, TrendingUp, Search, User, Plus, Edit, Trash2, Building, X, Save, Crown, MessageCircle, ChevronLeft, ChevronRight, Calculator } from 'lucide-react'
import { atualizarTransacao, deletarTransacao, criarTransacao, pagarParcelaPlano, desfazerPagamentoPlano, renovarPlanoCiclo, getCommissionsReport } from '@/lib/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function FinanceiroTabs({ initialTransactions, clients }: { initialTransactions: any[], clients: any[] }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'RECEBIDOS' | 'DESPESAS' | 'PLANOS' | 'RESUMO' | 'COMISSOES'>('RECEBIDOS')
  
  const [localTransactions, setLocalTransactions] = useState(initialTransactions)
  useEffect(() => { setLocalTransactions(initialTransactions) }, [initialTransactions])

  const [searchQuery, setSearchQuery] = useState('')
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<any>(null)
  
  const [paymentModalData, setPaymentModalData] = useState<{ clientId: string, valorSugerido: string, nome: string, isento: boolean, isMensal: boolean } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ title: '', amount: '', type: 'RECEITA', category: 'OUTROS', status: 'PENDENTE', paymentMethod: 'PIX' })

  // COMISSÕES STATES
  const [comDateStart, setComDateStart] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'))
  const [comDateEnd, setComDateEnd] = useState(format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'))
  const [comInstructor, setComInstructor] = useState('Loani')
  const [comPercent, setComPercent] = useState('30')
  const [comData, setComData] = useState<any[]>([])
  const [comLoading, setComLoading] = useState(false)
  const [comSearched, setComSearched] = useState(false)

  // === FILTRAGEM INTELIGENTE ===
  const filteredData = localTransactions.filter(item => {
    if (activeTab === 'RECEBIDOS') return item.type === 'RECEITA' && (item.status === 'PAGO' || item.status === 'ISENTO') && isToday(new Date(item.date))
    if (activeTab === 'DESPESAS') return item.type === 'DESPESA'
    if (activeTab === 'RESUMO') {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.client?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const tDate = new Date(item.date);
      const matchDate = tDate.getMonth() === currentMonth.getMonth() && tDate.getFullYear() === currentMonth.getFullYear();
      return matchesSearch && matchDate;
    }
    return false
  })

  // === ORDENAÇÃO ===
  const sortedData = [...filteredData].sort((a, b) => {
    if (a.status === 'PENDENTE' && b.status !== 'PENDENTE') return -1;
    if (b.status === 'PENDENTE' && a.status !== 'PENDENTE') return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const totaisResumo = localTransactions.filter(t => new Date(t.date).getMonth() === currentMonth.getMonth() && new Date(t.date).getFullYear() === currentMonth.getFullYear())
  const totalReceitas = totaisResumo.filter(t => t.type === 'RECEITA' && t.status === 'PAGO').reduce((acc, curr) => acc + curr.amount, 0)
  const totalPendentes = totaisResumo.filter(t => t.type === 'RECEITA' && t.status === 'PENDENTE').reduce((acc, curr) => acc + curr.amount, 0)
  const totalDespesas = totaisResumo.filter(t => t.type === 'DESPESA').reduce((acc, curr) => acc + curr.amount, 0)
  const clientsComPlano = clients.filter(c => c.plan)

  // === AÇÕES ===
  const handleConfirmPayment = async (id: string, method: string) => {
    setLocalTransactions(prev => prev.map(t => t.id === id ? { ...t, status: 'PAGO', paymentMethod: method } : t))
    await atualizarTransacao(id, { status: 'PAGO', paymentMethod: method })
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja apagar esta transação?")) {
      setLocalTransactions(prev => prev.filter(t => t.id !== id))
      await deletarTransacao(id)
      router.refresh()
    }
  }

  const handleSaveEdit = async () => {
    setIsSubmitting(true)
    await atualizarTransacao(editingTransaction.id, {
      title: editingTransaction.title, amount: parseFloat(editingTransaction.amount),
      paymentMethod: editingTransaction.paymentMethod, status: editingTransaction.status
    })
    setEditingTransaction(null)
    setIsSubmitting(false)
    router.refresh()
  }

  const handleCreate = async () => {
    if (!formData.title || !formData.amount) return alert("Preencha título e valor!")
    setIsSubmitting(true)
    await criarTransacao({
      title: formData.title, amount: parseFloat(formData.amount), type: formData.type,
      category: formData.category, status: formData.status, paymentMethod: formData.paymentMethod, date: new Date()
    })
    setIsCreateModalOpen(false)
    setIsSubmitting(false)
    router.refresh()
  }

  const openPaymentModal = (client: any, isMensal: boolean) => {
    const isento = client.planValue === 0
    const defaultValor = isento ? "0.00" : (client.planValue && client.planInstallments) ? (client.planValue / client.planInstallments).toFixed(2) : "0.00"
    setPaymentModalData({ clientId: client.id, nome: client.name, valorSugerido: defaultValor, isento, isMensal })
  }

  const confirmPagarParcela = async () => {
    if(!paymentModalData) return
    setIsSubmitting(true)
    if (paymentModalData.isMensal) {
      await pagarParcelaPlano(paymentModalData.clientId, parseFloat(paymentModalData.valorSugerido || "0"), paymentModalData.isento)
    } else {
      await pagarParcelaPlano(paymentModalData.clientId, parseFloat(paymentModalData.valorSugerido || "0"), paymentModalData.isento)
      await renovarPlanoCiclo(paymentModalData.clientId)
    }
    setPaymentModalData(null)
    setIsSubmitting(false)
    router.refresh()
  }

  const handleDesfazerPagamento = async (clientId: string) => {
    await desfazerPagamentoPlano(clientId)
    router.refresh()
  }

  const handleRenovarPlano = async (clientId: string) => {
    await renovarPlanoCiclo(clientId)
    router.refresh()
  }

  const handleGenerateCommissions = async () => {
    setComLoading(true)
    const res = await getCommissionsReport(comInstructor, comDateStart, comDateEnd)
    if (res.sucesso) { setComData(res.data); setComSearched(true); }
    setComLoading(false)
  }

  let lastDateResumo = '';
  let lastDateGeral = '';

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2 border-b border-slate-200 pb-px overflow-x-auto no-scrollbar w-full sm:w-auto">
          {['RECEBIDOS', 'DESPESAS', 'PLANOS', 'RESUMO', 'COMISSOES'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === tab ? 'border-[#0f5c4e] text-[#0f5c4e]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
              {tab === 'RESUMO' && <TrendingUp className="w-4 h-4" />}
              {tab === 'PLANOS' && <Crown className="w-4 h-4" />}
              {tab === 'DESPESAS' && <Building className="w-4 h-4" />}
              {tab === 'COMISSOES' && <Calculator className="w-4 h-4" />}
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        {activeTab !== 'PLANOS' && activeTab !== 'COMISSOES' && (
          <Button onClick={() => setIsCreateModalOpen(true)} className="bg-[#0f5c4e] hover:bg-[#0a453a] text-white gap-2 rounded-xl shadow-sm">
            <Plus className="w-4 h-4" /> Novo Lançamento
          </Button>
        )}
      </div>

      {activeTab === 'PLANOS' && (
        <div className="grid gap-4 animate-in fade-in">
          {clientsComPlano.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">Nenhum paciente com plano ativo.</div>
          ) : (
            clientsComPlano.map(client => {
              const isMensal = client.plan.toUpperCase().includes('MENSAL')
              const parcelas = client.planInstallments || 1
              const pagas = client.planInstallmentsPaid || 0
              const isento = client.planValue === 0
              const vencimentoDia = client.planDueDate || 10
              const hoje = new Date()

              let mesesDuracao = 1
              if (client.plan.toUpperCase().includes("TRIMESTRAL")) mesesDuracao = 4
              if (client.plan.toUpperCase().includes("SEMESTRAL")) mesesDuracao = 6
              
              const lastPayment = client.planLastPayment ? new Date(client.planLastPayment) : new Date(client.createdAt)
              const dataVencimentoReal = new Date(lastPayment)
              dataVencimentoReal.setMonth(dataVencimentoReal.getMonth() + mesesDuracao)
              dataVencimentoReal.setDate(vencimentoDia)

              const diffTime = dataVencimentoReal.getTime() - hoje.getTime()
              const diasParaVencer = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
              
              const isDueThisPeriod = diasParaVencer <= 5
              const showWhatsApp = isDueThisPeriod && diasParaVencer >= -10

              const quitado = isMensal ? (pagas >= parcelas && (!client.planLastPayment || new Date(client.planLastPayment).getMonth() === hoje.getMonth())) : !isDueThisPeriod

              const zapNumber = client.phone.replace(/\D/g, '')
              const zapMsg = encodeURIComponent(`Olá ${client.name.split(' ')[0]}, a fatura da MRF Pilates já está liberada! O vencimento é dia ${vencimentoDia}.`)

              return (
                <div key={client.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-all group">
                  <div className="flex items-start gap-4">
                    <div className="bg-amber-50 text-amber-600 p-3 rounded-lg border border-amber-100"><Crown className="w-6 h-6"/></div>
                    <div>
                      <Link href={`/clientes/${client.id}`} className="font-bold text-slate-800 hover:text-[#0f5c4e] hover:underline transition-all">
                        {client.name}
                      </Link>
                      <p className="text-sm font-medium text-slate-500 flex items-center gap-2 mt-0.5">
                        {client.plan.replace(/_/g, ' ')} 
                        <span className="text-slate-300">|</span>
                        <span className="text-[#0f5c4e] font-bold">Venc. Dia {vencimentoDia}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {!isDueThisPeriod ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-sm">
                          <CheckCircle2 className="w-4 h-4"/> Plano Ativo (Vence em {diasParaVencer} dias)
                        </div>
                        {isMensal && pagas > 0 && (
                           <button onClick={() => handleDesfazerPagamento(client.id)} className="w-8 h-8 flex items-center justify-center rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100" title="Desfazer Pagamento">
                             <X className="w-4 h-4"/>
                           </button>
                        )}
                      </div>
                    ) : (
                      <>
                        {showWhatsApp && !isento && (
                          <a href={`https://wa.me/55${zapNumber}?text=${zapMsg}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 font-bold rounded-lg transition-colors text-xs border border-green-200">
                            <MessageCircle className="w-4 h-4"/> Lembrar
                          </a>
                        )}
                        <Button disabled={isSubmitting} onClick={() => openPaymentModal(client, isMensal)} className={`gap-2 font-bold w-full sm:w-auto ${diasParaVencer < 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0f5c4e] hover:bg-[#0a453a]'} text-white`}>
                          <DollarSign className="w-4 h-4"/> 
                          {isMensal ? (isento ? 'Renovar Isenção' : `Pagar Mensalidade`) : 'Renovar Plano'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'RESUMO' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-emerald-600 mb-2 font-semibold text-sm flex gap-2"><ArrowUpRight className="w-4 h-4" /> Receitas (Pagas)</div>
              <h2 className="text-3xl font-black text-slate-800">R$ {totalReceitas.toFixed(2)}</h2>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-red-600 mb-2 font-semibold text-sm flex gap-2"><ArrowDownRight className="w-4 h-4" /> Despesas (Pagas)</div>
              <h2 className="text-3xl font-black text-slate-800">R$ {totalDespesas.toFixed(2)}</h2>
            </div>
            <div className={`p-6 rounded-2xl border shadow-sm ${totalReceitas - totalDespesas >= 0 ? 'bg-[#0f5c4e] border-[#0a453a]' : 'bg-red-600 border-red-700'}`}>
              <div className="text-white/80 mb-2 font-semibold text-sm flex gap-2"> Lucro do Mês</div>
              <h2 className="text-3xl font-black text-white">R$ {(totalReceitas - totalDespesas).toFixed(2)}</h2>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-amber-600 mb-2 font-semibold text-sm flex gap-2"><Clock className="w-4 h-4" /> A Receber (Pendentes)</div>
              <h2 className="text-3xl font-black text-slate-800">R$ {totalPendentes.toFixed(2)}</h2>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm items-center justify-between">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 border border-slate-200 transition-colors"><ChevronLeft className="w-5 h-5" /></button>
              <h3 className="font-bold text-lg text-slate-800 capitalize min-w-[140px] text-center">{format(currentMonth, 'MMMM yyyy', { locale: ptBR })}</h3>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 border border-slate-200 transition-colors"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="relative w-full sm:flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar transação no mês..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10 w-full" />
            </div>
          </div>

          <div className="mt-8">
            <div className="grid gap-3">
              {sortedData.length === 0 ? (
                <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">Nenhum registro encontrado para este mês.</div>
              ) : (
                sortedData.map((item) => {
                  const itemDate = format(new Date(item.date), 'dd/MM');
                  const showSeparator = itemDate !== lastDateResumo;
                  lastDateResumo = itemDate;

                  return (
                    <Fragment key={item.id}>
                      {showSeparator && (
                        <div className="flex items-center gap-4 mt-4 mb-2">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">Dia {itemDate.split('/')[0]}</span>
                          <div className="h-px bg-slate-200 flex-1"></div>
                        </div>
                      )}
                      <div className={`flex flex-col p-4 rounded-xl border transition-all bg-white hover:shadow-md group ${item.status === 'PAGO' || item.status === 'ISENTO' ? 'border-[#0f5c4e]/30 shadow-sm bg-slate-50/50' : item.type === 'DESPESA' ? 'border-red-200 bg-red-50/10' : 'border-amber-300 ring-1 ring-amber-300/30'}`}>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className={`flex flex-col items-center justify-center border rounded-lg p-3 min-w-[100px] ${item.status === 'PAGO' || item.status === 'ISENTO' ? 'bg-[#0f5c4e]/5 border-[#0f5c4e]/20 text-[#0f5c4e]' : item.type === 'DESPESA' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-slate-50 border-slate-100 text-slate-800'}`}>
                              <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5">{itemDate}</span>
                              <span className="text-lg font-bold text-nowrap">{item.type === 'DESPESA' ? '- ' : ''}R$ {item.amount.toFixed(2)}</span>
                            </div>
                            <div className="space-y-1 mt-1">
                              <h3 className={`text-base font-bold flex items-center gap-2 ${item.status === 'PAGO' || item.status === 'ISENTO' ? 'text-slate-600' : 'text-slate-900'}`}>
                                {item.title}
                                {item.status === 'PENDENTE' && item.type === 'RECEITA' && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">A COBRAR</span>}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-slate-500 font-medium"><span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {item.client?.name || item.category.replace(/_/g, ' ')}</span></div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 self-start sm:self-center flex-wrap">
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity mr-2">
                              <button onClick={() => setEditingTransaction(item)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"><Edit className="w-4 h-4"/></button>
                              {!item.appointmentId && <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>}
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200 text-xs font-bold"><DollarSign className="w-3.5 h-3.5" /> {item.paymentMethod || 'PIX'}</div>
                            {item.status === 'PAGO' || item.status === 'ISENTO' ? (
                              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-[#0f5c4e]/10 text-[#0f5c4e] border-[#0f5c4e]/20 text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> {item.status === 'ISENTO' ? 'Isento' : 'Pago'}</div>
                            ) : (
                              <button onClick={() => handleConfirmPayment(item.id, item.paymentMethod || 'PIX')} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border bg-[#0f5c4e] hover:bg-[#0a453a] text-white border-[#0f5c4e]/20 text-sm font-bold shadow-sm transition-colors">Confirmar Pagamento</button>
                            )}
                          </div>
                        </div>
                      </div>
                    </Fragment>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABA DE COMISSÕES */}
      {activeTab === 'COMISSOES' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-8 animate-in fade-in">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#0f5c4e]/10 text-[#0f5c4e] rounded-xl flex items-center justify-center"><Calculator className="w-6 h-6" /></div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Painel de Comissões</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Cálculo Exato por Fração de Plano</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl mb-8">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1.5 block">Instrutora</label>
              <Select value={comInstructor} onValueChange={setComInstructor}>
                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Loani">Dra. Loani</SelectItem><SelectItem value="Marisa">Dra. Marisa</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1.5 block">Data Inicial</label>
              <Input type="date" value={comDateStart} onChange={e => setComDateStart(e.target.value)} className="bg-white font-medium" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1.5 block">Data Final</label>
              <Input type="date" value={comDateEnd} onChange={e => setComDateEnd(e.target.value)} className="bg-white font-medium" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 mb-1.5 block">Porcentagem (%)</label>
              <div className="relative">
                <Input type="number" value={comPercent} onChange={e => setComPercent(e.target.value)} className="bg-white font-black text-[#0f5c4e] pr-8" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">%</span>
              </div>
            </div>
            <div className="sm:col-span-4 flex justify-end mt-2">
              <Button onClick={handleGenerateCommissions} disabled={comLoading} className="bg-[#0f5c4e] hover:bg-[#0a453a] text-white font-bold h-11 px-8 shadow-md">
                {comLoading ? 'Calculando...' : 'Gerar Relatório'}
              </Button>
            </div>
          </div>

          {comSearched && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 border rounded-2xl bg-white shadow-sm">
                  <p className="text-xs font-bold text-slate-500 uppercase">Aulas Realizadas</p>
                  <p className="text-3xl font-black text-slate-800 mt-1">{comData.length}</p>
                </div>
                <div className="p-5 border rounded-2xl bg-white shadow-sm">
                  <p className="text-xs font-bold text-slate-500 uppercase">Valor Bruto das Aulas</p>
                  <p className="text-3xl font-black text-slate-800 mt-1">R$ {comData.reduce((acc, curr) => acc + curr.valorAula, 0).toFixed(2)}</p>
                </div>
                <div className="p-5 border-2 border-[#0f5c4e] rounded-2xl bg-[#0f5c4e]/5 shadow-md">
                  <p className="text-xs font-bold text-[#0f5c4e] uppercase flex items-center gap-1"><DollarSign className="w-3 h-3"/> Comissão a Pagar</p>
                  <p className="text-3xl font-black text-[#0a453a] mt-1">R$ {(comData.reduce((acc, curr) => acc + curr.valorAula, 0) * (Number(comPercent) / 100)).toFixed(2)}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                    <tr><th className="px-4 py-3">Data</th><th className="px-4 py-3">Paciente</th><th className="px-4 py-3">Plano / Tipo</th><th className="px-4 py-3 text-right">Valor Base</th><th className="px-4 py-3 text-right text-[#0f5c4e]">Comissão</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {comData.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-medium text-slate-600">{format(new Date(row.date), 'dd/MM/yyyy - HH:mm')}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{row.clientName}</td>
                        <td className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">{row.tipo}</td>
                        <td className="px-4 py-3 text-right font-medium text-slate-600">R$ {row.valorAula.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right font-black text-[#0f5c4e]">R$ {(row.valorAula * (Number(comPercent) / 100)).toFixed(2)}</td>
                      </tr>
                    ))}
                    {comData.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-bold">Nenhuma aula realizada neste período.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABAS COMUNS (Recebidos / Despesas) */}
      {activeTab !== 'PLANOS' && activeTab !== 'RESUMO' && activeTab !== 'COMISSOES' && (
        <div className="grid gap-3 animate-in fade-in">
          {sortedData.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200 border-dashed">Nenhum registro encontrado {activeTab === 'RECEBIDOS' ? 'hoje' : ''}.</div>
          ) : sortedData.map((item) => {
              const itemDate = format(new Date(item.date), 'dd/MM');
              const showSeparator = itemDate !== lastDateGeral;
              lastDateGeral = itemDate;

              return (
                <Fragment key={item.id}>
                  {showSeparator && (
                    <div className="flex items-center gap-4 mt-4 mb-2">
                      <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full">Dia {itemDate.split('/')[0]}</span>
                      <div className="h-px bg-slate-200 flex-1"></div>
                    </div>
                  )}
                  <div className={`flex flex-col p-4 rounded-xl border transition-all bg-white hover:shadow-md group ${item.status === 'PAGO' || item.status === 'ISENTO' ? 'border-[#0f5c4e]/30 shadow-sm bg-slate-50/50' : item.type === 'DESPESA' ? 'border-red-200 bg-red-50/10' : 'border-amber-300 ring-1 ring-amber-300/30'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className={`flex flex-col items-center justify-center border rounded-lg p-3 min-w-[100px] ${item.status === 'PAGO' || item.status === 'ISENTO' ? 'bg-[#0f5c4e]/5 border-[#0f5c4e]/20 text-[#0f5c4e]' : item.type === 'DESPESA' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-slate-50 border-slate-100 text-slate-800'}`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider mb-0.5">{itemDate}</span>
                          <span className="text-lg font-bold text-nowrap">{item.type === 'DESPESA' ? '- ' : ''}R$ {item.amount.toFixed(2)}</span>
                        </div>
                        <div className="space-y-1 mt-1">
                          <h3 className={`text-base font-bold flex items-center gap-2 ${item.status === 'PAGO' || item.status === 'ISENTO' ? 'text-slate-600' : 'text-slate-900'}`}>{item.title}{item.status === 'PENDENTE' && item.type === 'RECEITA' && <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">A COBRAR</span>}</h3>
                          <div className="flex items-center gap-3 text-sm text-slate-500 font-medium"><span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {item.client?.name || item.category.replace(/_/g, ' ')}</span></div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 self-start sm:self-center flex-wrap">
                        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity mr-2">
                          <button onClick={() => setEditingTransaction(item)} className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg"><Edit className="w-4 h-4"/></button>
                          {!item.appointmentId && <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4"/></button>}
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-slate-50 text-slate-600 border-slate-200 text-xs font-bold"><DollarSign className="w-3.5 h-3.5" /> {item.paymentMethod || 'PIX'}</div>
                        {item.status === 'PAGO' || item.status === 'ISENTO' ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border bg-[#0f5c4e]/10 text-[#0f5c4e] border-[#0f5c4e]/20 text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> {item.status === 'ISENTO' ? 'Isento' : 'Pago'}</div>
                        ) : (
                          <button onClick={() => handleConfirmPayment(item.id, item.paymentMethod || 'PIX')} className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border bg-[#0f5c4e] hover:bg-[#0a453a] text-white border-[#0f5c4e]/20 text-sm font-bold shadow-sm transition-colors">Confirmar Pagamento</button>
                        )}
                      </div>
                    </div>
                  </div>
                </Fragment>
              )
          })}
        </div>
      )}

      {/* MODAIS */}
      {paymentModalData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h2 className="text-xl font-bold text-slate-800">
              {paymentModalData.isMensal ? 'Receber Mensalidade' : 'Renovar Plano'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Lançando receita para <strong>{paymentModalData.nome}</strong> no caixa do sistema.
            </p>
            
            <div className="mt-5 mb-6">
              <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wider">Valor Recebido (R$)</label>
              <Input 
                type="number" 
                step="0.01" 
                value={paymentModalData.valorSugerido} 
                onChange={(e) => setPaymentModalData({...paymentModalData, valorSugerido: e.target.value})}
                disabled={paymentModalData.isento}
                className="h-12 font-black text-xl text-slate-800 border-slate-300 focus-visible:ring-[#0f5c4e]" 
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setPaymentModalData(null)} className="flex-1 rounded-xl h-11 font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100">
                Cancelar
              </Button>
              <Button type="button" onClick={confirmPagarParcela} disabled={isSubmitting} className="flex-1 rounded-xl h-11 bg-[#0f5c4e] hover:bg-[#0a453a] text-white font-bold shadow-md gap-2">
                <CheckCircle2 className="w-4 h-4"/> Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {editingTransaction && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 flex items-center justify-center backdrop-blur-sm px-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-50 p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800">Editar Transação</h3>
              <button onClick={() => setEditingTransaction(null)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título</label>
                <Input value={editingTransaction.title} onChange={e => setEditingTransaction({...editingTransaction, title: e.target.value})} className="h-10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valor (R$)</label>
                  <Input type="number" step="0.01" value={editingTransaction.amount} onChange={e => setEditingTransaction({...editingTransaction, amount: e.target.value})} className="h-10 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pagamento</label>
                  <Select value={editingTransaction.paymentMethod} onValueChange={(v) => setEditingTransaction({...editingTransaction, paymentMethod: v})}>
                    <SelectTrigger className="w-full h-10"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="CARTAO_CREDITO">Cartão Crédito</SelectItem>
                      <SelectItem value="CARTAO_DEBITO">Cartão Débito</SelectItem>
                      <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                      <SelectItem value="BOLETO">Boleto</SelectItem>
                      <SelectItem value="ISENTO">Isento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={() => setEditingTransaction(null)} className="flex-1 py-2 font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors">Cancelar</button>
              <button onClick={handleSaveEdit} disabled={isSubmitting} className="flex-1 py-2 font-bold text-white bg-[#0f5c4e] hover:bg-[#0a453a] rounded-lg flex justify-center items-center gap-2"><Save className="w-4 h-4" /> Salvar</button>
            </div>
          </div>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 flex items-center justify-center backdrop-blur-sm px-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-50 p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-[#0f5c4e]/10 text-[#0f5c4e] p-2 rounded-lg"><Plus className="w-5 h-5" /></div>
                <div><h3 className="font-bold text-slate-800">Nova Lançamento</h3></div>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo</label>
                  <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                    <SelectTrigger className="w-full h-10 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="RECEITA">Receita (+)</SelectItem>
                      <SelectItem value="DESPESA">Despesa (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoria</label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger className="w-full h-10 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="CUSTO_FIXO">Custo Fixo (Aluguel/Luz)</SelectItem>
                      <SelectItem value="SALARIO">Salário / Comissão</SelectItem>
                      <SelectItem value="SESSAO_AVULSA">Sessão Avulsa</SelectItem>
                      <SelectItem value="OUTROS">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descrição / Título</label>
                <Input placeholder="Ex: Conta de Luz" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="h-10" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Valor (R$)</label>
                  <Input type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} className="h-10 font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <Select value={formData.status} onValueChange={(v) => setFormData({...formData, status: v})}>
                    <SelectTrigger className="w-full h-10 border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[100]">
                      <SelectItem value="PAGO">Pago / Recebido</SelectItem>
                      <SelectItem value="PENDENTE">Pendente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-2 font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors">Cancelar</button>
              <button onClick={handleCreate} disabled={isSubmitting} className="flex-1 py-2 font-bold text-white bg-[#0f5c4e] hover:bg-[#0a453a] rounded-lg shadow-md transition-colors flex justify-center items-center gap-2"><Save className="w-4 h-4" /> Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}