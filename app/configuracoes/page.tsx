// app/configuracoes/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from "@/components/sidebar"
import { Building, DollarSign, Users, MessageSquare, Save, Settings2, Clock, Wallet, UsersRound, CalendarDays, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getSettings, updateSettings } from "@/lib/actions"
import { useToast } from "@/hooks/use-toast"

export default function ConfiguracoesPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<'CLINICA' | 'PRECOS' | 'EQUIPE' | 'MENSAGENS'>('CLINICA')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Estado para os dados das configurações, incluindo os novos planos
  const [config, setConfig] = useState({
    studioName: '', cnpj: '', phone: '', email: '', address: '',
    openTime: '07:30', closeTime: '19:00',
    priceFisio: 0, pricePilates: 0, priceExp: 0,
    plan1xMensal: 0, plan1xTrimestral: 0, plan1xSemestral: 0,
    plan2xMensal: 0, plan2xTrimestral: 0, plan2xSemestral: 0,
    plan3xMensal: 0, plan3xTrimestral: 0, plan3xSemestral: 0,
    msgFatura: '', msgAtraso: '', msgConfirmacao: '', msgAniversario: '', msgProspeccao: ''
  })

  // Carregar configurações ao montar a página
  useEffect(() => {
    async function loadData() {
      const data = await getSettings()
      if (data) {
        setConfig({
          studioName: data.studioName || '', cnpj: data.cnpj || '', phone: data.phone || '', email: data.email || '', address: data.address || '',
          openTime: data.openTime || '07:30', closeTime: data.closeTime || '19:00',
          priceFisio: data.priceFisio || 0, pricePilates: data.pricePilates || 0, priceExp: data.priceExp || 0,
          plan1xMensal: data.plan1xMensal || 0, plan1xTrimestral: data.plan1xTrimestral || 0, plan1xSemestral: data.plan1xSemestral || 0,
          plan2xMensal: data.plan2xMensal || 0, plan2xTrimestral: data.plan2xTrimestral || 0, plan2xSemestral: data.plan2xSemestral || 0,
          plan3xMensal: data.plan3xMensal || 0, plan3xTrimestral: data.plan3xTrimestral || 0, plan3xSemestral: data.plan3xSemestral || 0,
          msgFatura: data.msgFatura || '', msgAtraso: data.msgAtraso || '', msgConfirmacao: data.msgConfirmacao || '', msgAniversario: data.msgAniversario || '', msgProspeccao: data.msgProspeccao || ''
        })
      }
      setLoading(false)
    }
    loadData()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const res = await updateSettings(config)
    if (res.sucesso) {
      toast({ title: "Sucesso!", description: "Configurações atualizadas." })
    } else {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao salvar." })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-[#0f5c4e]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 min-w-0 pt-16 lg:pt-0 lg:pl-64 transition-all duration-300 pb-12">
        <div className="p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                <Settings2 className="w-8 h-8 text-[#0f5c4e]" /> Configurações
              </h1>
              <p className="text-slate-500 mt-1 font-medium">Gerencie os parâmetros do sistema.</p>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-[#0f5c4e] hover:bg-[#0a453a] text-white font-bold h-11 px-6 rounded-xl shadow-sm gap-2">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Salvar Alterações
            </Button>
          </div>

          <div className="flex gap-2 border-b border-slate-200 pb-px overflow-x-auto no-scrollbar">
            <button onClick={() => setActiveTab('CLINICA')} className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'CLINICA' ? 'border-[#0f5c4e] text-[#0f5c4e]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              <Building className="w-4 h-4" /> Dados do Studio
            </button>
            <button onClick={() => setActiveTab('PRECOS')} className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'PRECOS' ? 'border-[#0f5c4e] text-[#0f5c4e]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              <DollarSign className="w-4 h-4" /> Tabela de Preços
            </button>
            <button onClick={() => setActiveTab('EQUIPE')} className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'EQUIPE' ? 'border-[#0f5c4e] text-[#0f5c4e]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              <Users className="w-4 h-4" /> Equipe
            </button>
            <button onClick={() => setActiveTab('MENSAGENS')} className={`px-4 py-2.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${activeTab === 'MENSAGENS' ? 'border-[#0f5c4e] text-[#0f5c4e]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              <MessageSquare className="w-4 h-4" /> Mensagens
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-10">
            
            {activeTab === 'CLINICA' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700">Nome do Studio</label>
                    <Input value={config.studioName} onChange={e => setConfig({...config, studioName: e.target.value})} className="h-11 focus-visible:ring-[#0f5c4e]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700">CNPJ</label>
                    <Input value={config.cnpj} onChange={e => setConfig({...config, cnpj: e.target.value})} className="h-11 focus-visible:ring-[#0f5c4e]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700">Telefone</label>
                    <Input value={config.phone} onChange={e => setConfig({...config, phone: e.target.value})} className="h-11 focus-visible:ring-[#0f5c4e]" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-slate-700">E-mail</label>
                    <Input type="email" value={config.email} onChange={e => setConfig({...config, email: e.target.value})} className="h-11 focus-visible:ring-[#0f5c4e]" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold mb-2 text-slate-700">Endereço Completo</label>
                    <Input value={config.address} onChange={e => setConfig({...config, address: e.target.value})} className="h-11 focus-visible:ring-[#0f5c4e]" />
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-[#0f5c4e]"/> Horário e Sessões</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Abre às</label>
                      <Input type="time" value={config.openTime} onChange={e => setConfig({...config, openTime: e.target.value})} className="h-11 font-bold" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-500 uppercase">Fecha às</label>
                      <Input type="time" value={config.closeTime} onChange={e => setConfig({...config, closeTime: e.target.value})} className="h-11 font-bold" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'PRECOS' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-4">Sessões Avulsas</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <label className="block text-sm font-bold text-slate-600 mb-2">Fisioterapia</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                        <Input type="number" value={config.priceFisio || ''} onChange={e => setConfig({...config, priceFisio: Number(e.target.value)})} className="h-11 pl-9 font-black focus-visible:ring-[#0f5c4e]" />
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <label className="block text-sm font-bold text-slate-600 mb-2">Pilates Avulso</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                        <Input type="number" value={config.pricePilates || ''} onChange={e => setConfig({...config, pricePilates: Number(e.target.value)})} className="h-11 pl-9 font-black focus-visible:ring-[#0f5c4e]" />
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <label className="block text-sm font-bold text-slate-600 mb-2">Aula Experimental</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                        <Input type="number" value={config.priceExp || ''} onChange={e => setConfig({...config, priceExp: Number(e.target.value)})} className="h-11 pl-9 font-black focus-visible:ring-[#0f5c4e]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h2 className="text-xl font-bold text-slate-800 mb-4">Planos de Pilates (Valores Base)</h2>
                  <p className="text-sm text-slate-500 mb-6">Defina os valores padrão. Eles aparecerão automaticamente na hora de matricular o paciente.</p>
                  
                  <div className="space-y-4">
                    {/* Pilates 1x */}
                    <div className="flex flex-col sm:flex-row gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <div className="flex-1 flex items-center"><h3 className="font-bold text-slate-800">Pilates 1x na Semana</h3></div>
                      <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mensal</label>
                          <Input type="number" value={config.plan1xMensal || ''} onChange={e => setConfig({...config, plan1xMensal: Number(e.target.value)})} className="h-9 font-semibold" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Trimestral</label>
                          <Input type="number" value={config.plan1xTrimestral || ''} onChange={e => setConfig({...config, plan1xTrimestral: Number(e.target.value)})} className="h-9 font-semibold" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Semestral</label>
                          <Input type="number" value={config.plan1xSemestral || ''} onChange={e => setConfig({...config, plan1xSemestral: Number(e.target.value)})} className="h-9 font-semibold" />
                        </div>
                      </div>
                    </div>

                    {/* Pilates 2x */}
                    <div className="flex flex-col sm:flex-row gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <div className="flex-1 flex items-center"><h3 className="font-bold text-slate-800">Pilates 2x na Semana</h3></div>
                      <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mensal</label>
                          <Input type="number" value={config.plan2xMensal || ''} onChange={e => setConfig({...config, plan2xMensal: Number(e.target.value)})} className="h-9 font-semibold" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Trimestral</label>
                          <Input type="number" value={config.plan2xTrimestral || ''} onChange={e => setConfig({...config, plan2xTrimestral: Number(e.target.value)})} className="h-9 font-semibold" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Semestral</label>
                          <Input type="number" value={config.plan2xSemestral || ''} onChange={e => setConfig({...config, plan2xSemestral: Number(e.target.value)})} className="h-9 font-semibold" />
                        </div>
                      </div>
                    </div>

                    {/* Pilates 3x */}
                    <div className="flex flex-col sm:flex-row gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <div className="flex-1 flex items-center"><h3 className="font-bold text-slate-800">Pilates 3x na Semana</h3></div>
                      <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mensal</label>
                          <Input type="number" value={config.plan3xMensal || ''} onChange={e => setConfig({...config, plan3xMensal: Number(e.target.value)})} className="h-9 font-semibold" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Trimestral</label>
                          <Input type="number" value={config.plan3xTrimestral || ''} onChange={e => setConfig({...config, plan3xTrimestral: Number(e.target.value)})} className="h-9 font-semibold" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Semestral</label>
                          <Input type="number" value={config.plan3xSemestral || ''} onChange={e => setConfig({...config, plan3xSemestral: Number(e.target.value)})} className="h-9 font-semibold" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'EQUIPE' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Corpo Clínico / Instrutores</h2>
                  <p className="text-sm text-slate-500 mt-1">Configuração de profissionais (Em breve personalização de agenda).</p>
                </div>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#0f5c4e]/10 text-[#0f5c4e] rounded-full flex items-center justify-center font-bold">M</div>
                      <div><p className="font-bold text-slate-800">Dr(a). Marisa</p><p className="text-xs text-slate-500">Fisioterapeuta / Pilates</p></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#0f5c4e]/10 text-[#0f5c4e] rounded-full flex items-center justify-center font-bold">L</div>
                      <div><p className="font-bold text-slate-800">Dr(a). Loani</p><p className="text-xs text-slate-500">Fisioterapeuta / Pilates</p></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'MENSAGENS' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Templates do WhatsApp</h2>
                  <p className="text-sm text-slate-500 mt-1">Personalize os textos dos botões rápidos.</p>
                </div>

                <div className="space-y-6">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-[#0f5c4e] border-b border-slate-100 pb-2">
                    <Wallet className="w-5 h-5" /> Cobranças e Faturas
                  </h3>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Fatura Liberada (Novo ciclo)</label>
                    <Textarea value={config.msgFatura} onChange={e => setConfig({...config, msgFatura: e.target.value})} className="resize-none focus-visible:ring-[#0f5c4e]" rows={2} />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Pagamento em Atraso</label>
                    <Textarea value={config.msgAtraso} onChange={e => setConfig({...config, msgAtraso: e.target.value})} className="resize-none focus-visible:ring-[#0f5c4e]" rows={3} />
                  </div>
                </div>

                <div className="space-y-6 pt-4">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-[#0f5c4e] border-b border-slate-100 pb-2">
                    <CalendarDays className="w-5 h-5" /> Agendamentos
                  </h3>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Confirmação de Horário</label>
                    <Textarea value={config.msgConfirmacao} onChange={e => setConfig({...config, msgConfirmacao: e.target.value})} className="resize-none focus-visible:ring-[#0f5c4e]" rows={2} />
                  </div>
                </div>

                <div className="space-y-6 pt-4">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-[#0f5c4e] border-b border-slate-100 pb-2">
                    <UsersRound className="w-5 h-5" /> Relacionamento e Vendas
                  </h3>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Feliz Aniversário 🎂</label>
                    <Textarea value={config.msgAniversario} onChange={e => setConfig({...config, msgAniversario: e.target.value})} className="resize-none focus-visible:ring-[#0f5c4e]" rows={2} />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Prospecção / Aula Experimental</label>
                    <Textarea value={config.msgProspeccao} onChange={e => setConfig({...config, msgProspeccao: e.target.value})} className="resize-none focus-visible:ring-[#0f5c4e]" rows={3} />
                  </div>
                </div>

              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  )
}