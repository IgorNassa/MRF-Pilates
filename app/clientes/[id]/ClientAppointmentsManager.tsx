// app/clientes/[id]/ClientAppointmentsManager.tsx
'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarSync, Clock, AlertCircle, Trash2, CheckCircle2, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cancelarAgendamentosLote, validarAgendamentosPreview, efetivarAgendamentos } from '@/lib/actions'
import { useRouter } from 'next/navigation'

export default function ClientAppointmentsManager({ client, appointments }: { client: any, appointments: any[] }) {
  const router = useRouter()
  const futureAppts = appointments.filter(a => a.status === 'AGENDADO' && new Date(a.date).getTime() > new Date().getTime())

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const [showRescheduleModal, setShowRescheduleModal] = useState(false)
  const [newInstructor, setNewInstructor] = useState('Marisa')
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [diasComHorarios, setDiasComHorarios] = useState<Record<string, string>>({})
  
  const [previewData, setPreviewData] = useState<any[]>([])
  const [previewMode, setPreviewMode] = useState(false)
  const horariosDisponiveisBase = ["07:30", "08:30", "09:30", "10:30", "11:30", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"]

  const toggleSelectAll = () => {
    if (selectedIds.length === futureAppts.length) setSelectedIds([])
    else setSelectedIds(futureAppts.map(a => a.id))
  }

  const handleCancelToBalance = async () => {
    if (!confirm(`Deseja cancelar ${selectedIds.length} sessões e converter em saldo?`)) return;
    setIsProcessing(true);
    await cancelarAgendamentosLote(selectedIds, client.id);
    setSelectedIds([]);
    setIsProcessing(false);
    router.refresh();
  }

  const toggleDia = (dia: string) => {
    const novos = { ...diasComHorarios }
    if (novos[dia]) delete novos[dia]
    else novos[dia] = '07:30'
    setDiasComHorarios(novos)
  }

  const generatePreview = async () => {
    if (Object.keys(diasComHorarios).length === 0) return setErrorMsg("Selecione pelo menos um dia na semana.");
    setErrorMsg(""); setIsProcessing(true);

    const res = await validarAgendamentosPreview({
      tipoAgendamento: 'REGULAR', serviceType: 'PILATES', clientId: client.id, instructorId: newInstructor,
      isAgendamentoManual: false, diasComHorarios, startDate, descontarDoPlano: true, comecarHoje: true,
      ignoreApptIds: selectedIds, 
      forceTotalSessions: selectedIds.length 
    });

    setIsProcessing(false);
    if (res.sucesso) {
      setPreviewData(res.sessoes);
      setPreviewMode(true);
    } else {
      setErrorMsg(res.erro || "Erro ao validar conflitos.");
    }
  }

  const confirmReschedule = async () => {
    if (previewData.some(s => s.status !== 'OK')) return setErrorMsg("Existem conflitos na revisão.");
    setIsProcessing(true);

    const res = await efetivarAgendamentos({
      tipoAgendamento: 'REGULAR', serviceType: 'PILATES', clientId: client.id,
      sessoesConfirmadas: previewData, descontarDoPlano: true,
      cancelOldApptIds: selectedIds 
    });

    setIsProcessing(false);
    if (res.sucesso) {
      setShowRescheduleModal(false);
      setPreviewMode(false);
      setSelectedIds([]);
      setDiasComHorarios({});
      router.refresh();
    } else {
      setErrorMsg(res.erro || "Erro crítico ao remanejar.");
    }
  }

  if (futureAppts.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
      <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 flex items-center gap-2"><CalendarSync className="w-5 h-5 text-[#0f5c4e]"/> Aulas Futuras (Em Aberto)</h3>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 animate-in fade-in">
            <Button onClick={handleCancelToBalance} disabled={isProcessing} variant="outline" className="h-9 border-amber-200 text-amber-700 hover:bg-amber-50 font-bold">
              <RefreshCcw className="w-4 h-4 mr-2"/> Converter em Saldo ({selectedIds.length})
            </Button>
            <Button onClick={() => setShowRescheduleModal(true)} disabled={isProcessing} className="h-9 bg-[#0f5c4e] text-white hover:bg-[#0a453a] font-bold shadow-sm">
              <Clock className="w-4 h-4 mr-2"/> Remanejar Horários
            </Button>
          </div>
        )}
      </div>
      
      <div className="max-h-80 overflow-y-auto p-2">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-400 uppercase bg-white sticky top-0 z-10">
            <tr>
              <th className="p-3 w-10"><Checkbox checked={selectedIds.length > 0 && selectedIds.length === futureAppts.length} onCheckedChange={toggleSelectAll} className="rounded" /></th>
              <th className="p-3">Data</th>
              <th className="p-3">Hora</th>
              <th className="p-3">Instrutora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {futureAppts.map(a => {
              const isSelected = selectedIds.includes(a.id)
              return (
                <tr key={a.id} className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-[#0f5c4e]/5' : ''}`}>
                  <td className="p-3"><Checkbox checked={isSelected} onCheckedChange={() => setSelectedIds(prev => isSelected ? prev.filter(id => id !== a.id) : [...prev, a.id])} className="rounded" /></td>
                  <td className="p-3 font-bold text-slate-700">{format(new Date(a.date), 'dd/MM/yyyy')}</td>
                  <td className="p-3 font-black text-[#0f5c4e]">{format(new Date(a.date), 'HH:mm')}</td>
                  <td className="p-3 text-slate-500 font-medium">Dra. {a.instructor}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showRescheduleModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h2 className="text-xl font-black text-[#0f5c4e]">Remanejar {selectedIds.length} Sessão(ões)</h2>
              <button onClick={() => { setShowRescheduleModal(false); setPreviewMode(false); setErrorMsg(""); }} className="text-slate-400 hover:text-slate-800"><Trash2 className="w-5 h-5"/></button>
            </div>

            <div className="p-6 space-y-6">
              {errorMsg && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-bold flex items-center gap-2"><AlertCircle className="w-5 h-5"/> {errorMsg}</div>}
              
              {!previewMode ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase">A partir de</label>
                      <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase">Nova Instrutora</label>
                      <Select value={newInstructor} onValueChange={setNewInstructor}>
                        <SelectTrigger className="mt-1"><SelectValue/></SelectTrigger>
                        <SelectContent className="z-[9999]"><SelectItem value="Marisa">Dra. Marisa</SelectItem><SelectItem value="Loani">Dra. Loani</SelectItem></SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Novos Dias da Semana</label>
                    <div className="flex flex-wrap gap-2">
                      {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => {
                        const isChecked = !!diasComHorarios[dia];
                        return <button type="button" key={dia} onClick={() => toggleDia(dia)} className={`px-4 py-2 rounded-xl text-sm font-bold border ${isChecked ? 'bg-[#0f5c4e] text-white border-[#0f5c4e]' : 'bg-white text-slate-600 border-slate-200'}`}>{dia}</button>
                      })}
                    </div>
                  </div>
                  {Object.keys(diasComHorarios).length > 0 && (
                    <div className="grid grid-cols-2 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      {Object.entries(diasComHorarios).map(([dia, time]) => (
                        <div key={dia} className="flex items-center gap-3">
                          <span className="font-black text-xs uppercase w-8">{dia}</span>
                          <Select value={time} onValueChange={val => setDiasComHorarios({...diasComHorarios, [dia]: val})}>
                            <SelectTrigger className="h-9 bg-white"><SelectValue/></SelectTrigger>
                            <SelectContent className="z-[9999]">{horariosDisponiveisBase.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto p-1">
                  {previewData.map((s, i) => (
                    <div key={i} className={`p-3 border rounded-xl flex justify-between items-center ${s.status === 'OK' ? 'border-emerald-200 bg-emerald-50/30' : 'border-red-300 bg-red-50'}`}>
                      <div className="flex items-center gap-3">
                        {s.status === 'OK' ? <CheckCircle2 className="w-5 h-5 text-emerald-500"/> : <AlertCircle className="w-5 h-5 text-red-500"/>}
                        <div><p className="font-bold text-sm text-slate-800">{s.diaFormatado} às {s.timeStr}</p><p className="text-[10px] text-slate-500 uppercase font-black">Dra. {s.instructor}</p></div>
                      </div>
                      {s.status !== 'OK' && <p className="text-[10px] font-bold text-red-600 text-right max-w-[150px]">{s.errorMsg}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <Button variant="outline" onClick={() => previewMode ? setPreviewMode(false) : setShowRescheduleModal(false)} className="font-bold">Voltar</Button>
              {!previewMode ? (
                <Button onClick={generatePreview} disabled={isProcessing} className="bg-[#0f5c4e] text-white hover:bg-[#0a453a] font-bold">{isProcessing ? 'Verificando...' : 'Revisar Conflitos'}</Button>
              ) : (
                <Button onClick={confirmReschedule} disabled={isProcessing || previewData.some(s => s.status !== 'OK')} className="bg-[#0f5c4e] text-white hover:bg-[#0a453a] font-bold">
                  Confirmar Remanejamento
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}