// app/clientes/[id]/ClientFinanceHistory.tsx
'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, ChevronDown, ChevronUp } from 'lucide-react'

export default function ClientFinanceHistory({ transacoesPaciente }: { transacoesPaciente: any[] }) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (transacoesPaciente.length === 0) {
    return <p className="text-sm text-muted-foreground italic text-center py-4 bg-muted/20 rounded-xl border border-dashed border-border">Nenhum pagamento registrado para este paciente.</p>
  }

  // Se não estiver expandido, mostra só os 2 primeiros itens
  const transacoesVisiveis = isExpanded ? transacoesPaciente : transacoesPaciente.slice(0, 2)

  return (
    <div className="space-y-3">
      {transacoesVisiveis.map((t: any) => (
        <div key={t.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/10 hover:bg-muted/30 transition-colors">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-lg ${t.status === 'PAGO' || t.status === 'ISENTO' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              {t.status === 'PAGO' || t.status === 'ISENTO' ? <CheckCircle2 className="w-5 h-5"/> : <Clock className="w-5 h-5"/>}
            </div>
            <div>
              <p className="font-bold text-sm text-foreground">{t.title}</p>
              <p className="text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString('pt-BR')} • {t.paymentMethod?.replace(/_/g, ' ') || 'PIX'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`font-bold ${t.status === 'PAGO' || t.status === 'ISENTO' ? 'text-emerald-600' : 'text-foreground'}`}>
              {t.status === 'ISENTO' ? 'ISENTO' : `R$ ${t.amount.toFixed(2)}`}
            </p>
            {t.status === 'PENDENTE' && <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Pendente</span>}
          </div>
        </div>
      ))}

      {/* Botão de Expandir / Recolher - Aparece se tiver mais de 2 transações */}
      {transacoesPaciente.length > 2 && (
        <button 
          onClick={() => setIsExpanded(!isExpanded)} 
          className="w-full mt-4 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors border border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:bg-slate-100"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="w-4 h-4" /> Recolher histórico
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" /> Mostrar todo o histórico ({transacoesPaciente.length})
            </>
          )}
        </button>
      )}
    </div>
  )
}