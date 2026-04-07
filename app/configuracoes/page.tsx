// app/configuracoes/page.tsx
'use client'

import { useState } from 'react'
import { Sidebar } from "@/components/sidebar"
import { Building, DollarSign, Users, MessageSquare, Save, Settings2, Clock, Wallet, CalendarHeart, UsersRound, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<'CLINICA' | 'PRECOS' | 'EQUIPE' | 'MENSAGENS'>('CLINICA')

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <main className="flex-1 min-w-0 pt-16 lg:pt-0 lg:pl-64 transition-all duration-300 pb-12">
        <div className="p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
          
          {/* CABEÇALHO */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                <Settings2 className="w-8 h-8 text-[#0f5c4e]" /> Configurações
              </h1>
              <p className="text-slate-500 mt-1 font-medium">Gerencie os parâmetros do sistema e dados do Studio.</p>
            </div>
            <Button className="bg-[#0f5c4e] hover:bg-[#0a453a] text-white font-bold h-11 px-6 rounded-xl shadow-sm gap-2">
              <Save className="w-5 h-5" /> Salvar Alterações
            </Button>
          </div>

          {/* MENU INTERNO DE ABAS */}
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

          {/* CONTEÚDO DAS ABAS */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 sm:p-10 animate-in fade-in duration-300">
            
            {/* ABA: CLÍNICA */}
            {activeTab === 'CLINICA' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-4">Informações Gerais</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700">Nome do Studio</label>
                      <Input defaultValue="MRF Pilates" className="h-11 focus-visible:ring-[#0f5c4e]" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700">CNPJ</label>
                      <Input placeholder="00.000.000/0001-00" className="h-11 focus-visible:ring-[#0f5c4e]" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700">Telefone / WhatsApp</label>
                      <Input defaultValue="(45) 99999-9999" className="h-11 focus-visible:ring-[#0f5c4e]" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2 text-slate-700">E-mail</label>
                      <Input type="email" placeholder="contato@mrfpilates.com" className="h-11 focus-visible:ring-[#0f5c4e]" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold mb-2 text-slate-700">Endereço Completo</label>
                      <Input placeholder="Rua, Número, Bairro, Cidade - UF" className="h-11 focus-visible:ring-[#0f5c4e]" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-[#0f5c4e]"/> Horário e Sessões</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Turno da Manhã</label>
                      <div className="text-sm font-bold text-slate-800">07:30 às 11:30</div>
                      <p className="text-xs text-slate-500 mt-1">4 Sessões</p>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Turno da Tarde</label>
                      <div className="text-sm font-bold text-slate-800">14:00 às 19:00</div>
                      <p className="text-xs text-slate-500 mt-1">5 Sessões</p>
                    </div>
                    <div className="p-4 bg-[#0f5c4e]/5 border border-[#0f5c4e]/20 rounded-xl">
                      <label className="block text-xs font-bold text-[#0f5c4e] uppercase mb-2">Formato da Sessão</label>
                      <div className="text-sm font-bold text-[#0f5c4e]">50 min + 10 min (Pausa)</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ABA: PREÇOS */}
            {activeTab === 'PRECOS' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-4">Sessões Avulsas</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <label className="block text-sm font-bold text-slate-600 mb-2">Fisioterapia</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                        <Input type="number" defaultValue="150.00" className="h-11 pl-9 font-black focus-visible:ring-[#0f5c4e]" />
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <label className="block text-sm font-bold text-slate-600 mb-2">Pilates Avulso</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                        <Input type="number" defaultValue="100.00" className="h-11 pl-9 font-black focus-visible:ring-[#0f5c4e]" />
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <label className="block text-sm font-bold text-slate-600 mb-2">Aula Experimental</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">R$</span>
                        <Input type="number" defaultValue="50.00" className="h-11 pl-9 font-black focus-visible:ring-[#0f5c4e]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                  <h2 className="text-xl font-bold text-slate-800 mb-4">Planos de Pilates (Valores Base)</h2>
                  <p className="text-sm text-slate-500 mb-6">Estes valores aparecerão automaticamente na hora de matricular um aluno.</p>
                  
                  <div className="space-y-4">
                    {['Pilates 1x na Semana', 'Pilates 2x na Semana', 'Pilates 3x na Semana'].map((plano, i) => (
                      <div key={i} className="flex flex-col sm:flex-row gap-4 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                        <div className="flex-1 flex items-center">
                          <h3 className="font-bold text-slate-800">{plano}</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-3 w-full sm:w-auto">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Mensal</label>
                            <Input type="number" placeholder="0.00" className="h-9 focus-visible:ring-[#0f5c4e] font-semibold" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Trimestral</label>
                            <Input type="number" placeholder="0.00" className="h-9 focus-visible:ring-[#0f5c4e] font-semibold" />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Semestral</label>
                            <Input type="number" placeholder="0.00" className="h-9 focus-visible:ring-[#0f5c4e] font-semibold" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ABA: EQUIPE */}
            {activeTab === 'EQUIPE' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">Corpo Clínico / Instrutores</h2>
                    <p className="text-sm text-slate-500 mt-1">Cadastre os profissionais que aparecem na agenda.</p>
                  </div>
                </div>
                
                <div className="grid gap-3">
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#0f5c4e]/10 text-[#0f5c4e] rounded-full flex items-center justify-center font-bold">M</div>
                      <div>
                        <p className="font-bold text-slate-800">Dr(a). Marisa</p>
                        <p className="text-xs text-slate-500">Fisioterapeuta / Pilates</p>
                      </div>
                    </div>
                    <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">Remover</Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#0f5c4e]/10 text-[#0f5c4e] rounded-full flex items-center justify-center font-bold">L</div>
                      <div>
                        <p className="font-bold text-slate-800">Dr(a). Loani</p>
                        <p className="text-xs text-slate-500">Fisioterapeuta / Pilates</p>
                      </div>
                    </div>
                    <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50">Remover</Button>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <Input placeholder="Nome do novo profissional" className="h-11 flex-1 focus-visible:ring-[#0f5c4e]" />
                  <Button className="h-11 bg-slate-800 hover:bg-slate-900 text-white font-bold">Adicionar</Button>
                </div>
              </div>
            )}

            {/* ABA: MENSAGENS (EXPANDIDA) */}
            {activeTab === 'MENSAGENS' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Templates do WhatsApp</h2>
                  <p className="text-sm text-slate-500 mt-1">Personalize os textos dos botões rápidos. O sistema preencherá as variáveis automaticamente no futuro.</p>
                </div>

                {/* Bloco Financeiro */}
                <div className="space-y-6">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-[#0f5c4e] border-b border-slate-100 pb-2">
                    <Wallet className="w-5 h-5" /> Cobranças e Faturas
                  </h3>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Fatura Liberada (Novo ciclo)</label>
                    <Textarea 
                      defaultValue="Olá [NOME], sua fatura da MRF Pilates já está liberada! O vencimento é dia [DATA]." 
                      className="resize-none focus-visible:ring-[#0f5c4e]" 
                      rows={2} 
                    />
                    <p className="text-xs text-slate-400">Usado no botão "Lembrar" na aba de Planos.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Pagamento em Atraso</label>
                    <Textarea 
                      defaultValue="Olá [NOME], tudo bem? Notamos que a sua mensalidade com vencimento em [DATA] ainda está pendente no sistema. Podemos ajudar com algo?" 
                      className="resize-none focus-visible:ring-[#0f5c4e]" 
                      rows={3} 
                    />
                  </div>
                </div>

                {/* Bloco Agenda */}
                <div className="space-y-6 pt-4">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-[#0f5c4e] border-b border-slate-100 pb-2">
                    <CalendarDays className="w-5 h-5" /> Agendamentos
                  </h3>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Confirmação de Horário</label>
                    <Textarea 
                      defaultValue="Olá [NOME], passando para confirmar sua sessão de Pilates amanhã às [HORA]. Por favor, nos avise se houver algum imprevisto!" 
                      className="resize-none focus-visible:ring-[#0f5c4e]" 
                      rows={2} 
                    />
                  </div>
                </div>

                {/* Bloco Relacionamento */}
                <div className="space-y-6 pt-4">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-[#0f5c4e] border-b border-slate-100 pb-2">
                    <UsersRound className="w-5 h-5" /> Relacionamento e Vendas
                  </h3>
                  
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Feliz Aniversário 🎂</label>
                    <Textarea 
                      defaultValue="Parabéns [NOME]! A equipe MRF Pilates te deseja um dia maravilhoso e cheio de energia e muito movimento. Feliz aniversário!" 
                      className="resize-none focus-visible:ring-[#0f5c4e]" 
                      rows={2} 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Prospecção / Aula Experimental</label>
                    <Textarea 
                      defaultValue="Olá [NOME], tudo bem? Vi que você tem interesse em cuidar da sua saúde com a gente. Vamos agendar uma aula experimental sem compromisso?" 
                      className="resize-none focus-visible:ring-[#0f5c4e]" 
                      rows={3} 
                    />
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