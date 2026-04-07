// app/clientes/[id]/PlanButtons.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trash2, Save, Crown, AlertTriangle, CheckSquare, Square, CreditCard } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { atualizarPlanoCliente, removerPlanoCliente } from '@/lib/actions'

const TABELA_PRECOS: Record<string, number> = {
  "PILATES_1X MENSAL": 150, "PILATES_1X TRIMESTRAL": 400, "PILATES_1X SEMESTRAL": 750,
  "PILATES_2X MENSAL": 250, "PILATES_2X TRIMESTRAL": 700, "PILATES_2X SEMESTRAL": 1300,
  "PILATES_3X MENSAL": 350, "PILATES_3X TRIMESTRAL": 1000, "PILATES_3X SEMESTRAL": 1800,
  "FISIO_SESSAO MENSAL": 400
}

export default function PlanButtons({ clientId, currentPlan, planValue, planInstallments, planInstallmentsPaid, planDueDate, planPaymentMethod }: any) {
  const router = useRouter()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUnlinkModalOpen, setIsUnlinkModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [selectedPlan, setSelectedPlan] = useState(currentPlan || '')
  const [vencimento, setVencimento] = useState(planDueDate?.toString() || '10')
  const [isento, setIsento] = useState(planValue === 0)
  
  // Controle de Forma de Pagamento
  const [paymentMethod, setPaymentMethod] = useState(planPaymentMethod || 'PIX')
  
  // Controle Inteligente de Parcelas (Trava em 1 se não for crédito)
  const [parcelasInput, setParcelasInput] = useState(planInstallments?.toString() || '1')
  const isCredito = paymentMethod === 'CARTAO_CREDITO'
  const parcelas = isCredito ? parcelasInput : '1'

  const valorCheioNovoPlano = TABELA_PRECOS[selectedPlan] || 0
  const valorJaPago = (currentPlan && planValue && planInstallments) ? (planValue / planInstallments) * (planInstallmentsPaid || 0) : 0
  
  const valorFinal = isento ? 0 : Math.max(0, valorCheioNovoPlano - valorJaPago)
  const divisorParcelas = Math.max(1, parseInt(parcelas || '1'))
  const valorParcelaAtual = (valorFinal / divisorParcelas).toFixed(2)
  const showJurosInfo = isCredito && divisorParcelas >= 3 && !isento

  const handleConfirmRemove = async () => {
    setIsSubmitting(true)
    await removerPlanoCliente(clientId)
    setIsUnlinkModalOpen(false)
    setIsSubmitting(false)
    router.refresh()
  }

  const handleSave = async () => {
    if(!selectedPlan) return
    setIsSubmitting(true)
    await atualizarPlanoCliente(clientId, selectedPlan, divisorParcelas, valorFinal, parseInt(vencimento), isento ? 'ISENTO' : paymentMethod)
    setIsModalOpen(false)
    setIsSubmitting(false)
    router.refresh()
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {currentPlan && (
          <Button onClick={() => setIsUnlinkModalOpen(true)} variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg">
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
        <Button onClick={() => setIsModalOpen(true)} variant="outline" size="sm" className="text-xs font-bold border-[#0f5c4e]/20 text-[#0f5c4e] hover:bg-[#0f5c4e]/5">
          {currentPlan ? 'Upgrade / Editar' : 'Vincular Plano'}
        </Button>
      </div>

      {isUnlinkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-red-100 animate-in zoom-in-95">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-center text-slate-800">Desvincular paciente do plano?</h2>
            <p className="mt-2 text-sm text-center text-slate-500">
              O histórico financeiro dele <strong>não será apagado</strong>, mas a partir de agora ele passará a ser tratado como paciente Avulso.
            </p>
            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={() => setIsUnlinkModalOpen(false)} className="flex-1 rounded-xl h-11 font-semibold text-slate-600 bg-slate-50 border-slate-200 hover:bg-slate-100">
                Cancelar
              </Button>
              <Button onClick={handleConfirmRemove} disabled={isSubmitting} className="flex-1 rounded-xl h-11 bg-red-600 hover:bg-red-700 text-white font-bold shadow-md">
                {isSubmitting ? "Aguarde..." : "Sim, Desvincular"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 flex items-center justify-center backdrop-blur-sm px-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-50 p-5 border-b border-slate-100 flex items-center gap-3">
              <div className="bg-[#0f5c4e]/10 text-[#0f5c4e] p-2 rounded-lg"><Crown className="w-5 h-5" /></div>
              <div>
                <h3 className="font-bold text-slate-800">{currentPlan ? 'Upgrade / Alterar Plano' : 'Vincular Novo Plano'}</h3>
                <p className="text-xs text-slate-500">Configure modalidade e pagamento.</p>
              </div>
            </div>
            
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Modalidade do Plano</label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger className="w-full h-11 border-slate-200 focus:ring-[#0f5c4e]"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent className="z-[100]">
                    <SelectItem value="PILATES_1X MENSAL">Pilates 1x - Mensal</SelectItem>
                    <SelectItem value="PILATES_1X TRIMESTRAL">Pilates 1x - Trimestral</SelectItem>
                    <SelectItem value="PILATES_1X SEMESTRAL">Pilates 1x - Semestral</SelectItem>
                    <SelectItem value="PILATES_2X MENSAL">Pilates 2x - Mensal</SelectItem>
                    <SelectItem value="PILATES_2X TRIMESTRAL">Pilates 2x - Trimestral</SelectItem>
                    <SelectItem value="PILATES_2X SEMESTRAL">Pilates 2x - Semestral</SelectItem>
                    <SelectItem value="PILATES_3X MENSAL">Pilates 3x - Mensal</SelectItem>
                    <SelectItem value="PILATES_3X TRIMESTRAL">Pilates 3x - Trimestral</SelectItem>
                    <SelectItem value="PILATES_3X SEMESTRAL">Pilates 3x - Semestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedPlan && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Forma de Pagamento</label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={isento}>
                        <SelectTrigger className="w-full h-11 border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent className="z-[100]">
                          <SelectItem value="PIX">PIX</SelectItem>
                          <SelectItem value="CARTAO_CREDITO">Cartão de Crédito</SelectItem>
                          <SelectItem value="CARTAO_DEBITO">Cartão de Débito</SelectItem>
                          <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Dia Vencimento</label>
                      <Select value={vencimento} onValueChange={setVencimento}>
                        <SelectTrigger className="w-full h-11 border-slate-200"><SelectValue /></SelectTrigger>
                        <SelectContent className="z-[100]">
                          {[5, 10, 15, 20, 25, 30].map(dia => <SelectItem key={dia} value={dia.toString()}>Dia {dia}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {isCredito && !isento && (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-blue-500"/> Parcelamento (Crédito)
                      </label>
                      <Input 
                        type="number" min="1" max="12" 
                        value={parcelasInput} 
                        onChange={(e) => setParcelasInput(e.target.value)} 
                        className="h-11 font-bold text-slate-800" 
                      />
                    </div>
                  )}

                  <div className="flex items-center mt-2">
                    <button onClick={() => setIsento(!isento)} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-[#0f5c4e] transition-colors">
                      {isento ? <CheckSquare className="w-5 h-5 text-[#0f5c4e]" /> : <Square className="w-5 h-5 text-slate-400" />} Paciente Isento (Cortesia / Bolsista)
                    </button>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-sm">
                    <div className="flex justify-between text-emerald-800 mb-1">
                      <span>Valor Cheio do Plano:</span> <strong>R$ {valorCheioNovoPlano.toFixed(2)}</strong>
                    </div>
                    {valorJaPago > 0 && !isento && (
                      <div className="flex justify-between text-emerald-600 mb-1 border-b border-emerald-200/50 pb-1">
                        <span>Abatimento (Já pago):</span> <strong>- R$ {valorJaPago.toFixed(2)}</strong>
                      </div>
                    )}
                    <div className="flex justify-between text-emerald-900 font-black mt-2 text-base">
                      <span>A Cobrar:</span> <span>{isento ? 'ISENTO' : `R$ ${valorFinal.toFixed(2)}`}</span>
                    </div>
                    {!isento && isCredito && divisorParcelas > 1 && (
                      <div className="text-right text-xs font-bold mt-1 flex flex-col items-end">
                        <span className="text-emerald-700">({divisorParcelas}x de R$ {valorParcelaAtual})</span>
                        {showJurosInfo && <span className="text-amber-600 mt-1 bg-amber-100/50 px-2 py-0.5 rounded">+ juros da máquina</span>}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 font-semibold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg">Cancelar</button>
              <button onClick={handleSave} disabled={isSubmitting || !selectedPlan} className="flex-1 py-2.5 font-bold text-white bg-[#0f5c4e] hover:bg-[#0a453a] rounded-lg shadow-md disabled:opacity-50">
                {isSubmitting ? 'Salvando...' : 'Salvar Plano'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}