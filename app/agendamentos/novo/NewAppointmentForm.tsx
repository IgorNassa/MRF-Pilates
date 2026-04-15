'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Clock, CalendarDays, UserSquare2, AlertCircle, Plus, Trash2, CalendarSync, CheckCircle2, XCircle } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { validarAgendamentosPreview, checkDailyAvailability, efetivarAgendamentos } from '@/lib/actions'
import { format } from 'date-fns'

interface Appointment { date: Date | string; status: string; }
interface Client { id: string; name: string; plan?: string | null; repositionCredits: number; remainingSessions: number; appointments?: Appointment[] }
interface ManualSession { id: number; date: string; timeSlot: string; duration: number }

type PreviewSession = {
  id: string;
  dateStr: string;
  timeStr: string;
  instructor: string;
  status: 'OK' | 'LOTADO' | 'INSTRUTOR_LOTADO' | 'BLOQUEADO' | 'DUPLICADO';
  errorMsg: string;
  diaFormatado: string;
}

export default function NewAppointmentForm({ clients = [] }: { clients: Client[] }) {
  const router = useRouter()
  
  const [tipoAgendamento, setTipoAgendamento] = useState<'REGULAR' | 'EXPERIMENTAL'>('REGULAR')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [tempName, setTempName] = useState('') 
  const [tempPhone, setTempPhone] = useState('') 
  
  const [serviceType, setServiceType] = useState<'PILATES' | 'FISIOTERAPIA'>('PILATES')
  const [instructorId, setInstructorId] = useState('Marisa')
  
  const [valorPersonalizado, setValorPersonalizado] = useState('')
  
  const [isAgendamentoManual, setIsAgendamentoManual] = useState(false)
  const [manualSessions, setManualSessions] = useState<ManualSession[]>([{ id: Date.now(), date: format(new Date(), 'yyyy-MM-dd'), timeSlot: '', duration: 50 }])
  
  const [startDatePilates, setStartDatePilates] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [diasComHorarios, setDiasComHorarios] = useState<Record<string, string>>({})
  const [maxDias, setMaxDias] = useState(1)
  
  const [recorrenciaPeriodo, setRecorrenciaPeriodo] = useState<'SEMANA' | 'MES' | 'TUDO'>('SEMANA')
  
  const [useReposicao, setUseReposicao] = useState(false)
  const [descontarDoPlano, setDescontarDoPlano] = useState(false)
  const [comecarHoje, setComecarHoje] = useState(false)
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('') 
  const [dayStats, setDayStats] = useState<Record<string, any>>({})

  // Modal States
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewSession[]>([]);
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(null);
  const [editSessionData, setEditSessionData] = useState({ dateStr: '', timeStr: '' });
  const [isCheckingSlot, setIsCheckingSlot] = useState(false);
  const [originalDadosSalvar, setOriginalDadosSalvar] = useState<any>(null);

  const selectedClientData = clients.find(c => c.id === selectedClientId)

  useEffect(() => {
    if (tipoAgendamento === 'REGULAR' && selectedClientData) {
      if (serviceType === 'PILATES' && selectedClientData.plan) {
        const p = selectedClientData.plan.toUpperCase();
        let limit = 1;
        if (p.includes('2X')) limit = 2;
        if (p.includes('3X')) limit = 3;
        if (p.includes('4X')) limit = 4;
        if (p.includes('5X')) limit = 5;
        setMaxDias(limit);

        if (selectedClientData.remainingSessions > 0 && !isAgendamentoManual) {
          setDescontarDoPlano(true);
          setUseReposicao(false);
        } else {
          setDescontarDoPlano(false);
        }
      } else {
        setMaxDias(1);
        setDescontarDoPlano(false);
        setUseReposicao(false);
      }
    } else {
      setMaxDias(1);
      setDescontarDoPlano(false);
      setUseReposicao(false);
    }
  }, [selectedClientId, serviceType, tipoAgendamento, selectedClientData, isAgendamentoManual])
  
  useEffect(() => {
    if (serviceType === 'FISIOTERAPIA') setIsAgendamentoManual(true);
  }, [serviceType]);

  const loadStatsForDate = async (dateStr: string) => {
    if (!dateStr || dateStr.length < 10 || dayStats[dateStr]) return;
    const stats = await checkDailyAvailability(dateStr);
    setDayStats(prev => ({ ...prev, [dateStr]: stats }));
  }

  const updateManualSession = (id: number, field: keyof ManualSession, value: string | number) => {
    setManualSessions(manualSessions.map(s => s.id === id ? { ...s, [field]: value } : s))
  }
  const handleDateChange = (id: number, newDate: string) => {
    setManualSessions(prev => prev.map(s => {
      if (s.id !== id) return s;
      let updatedSession = { ...s, date: newDate, timeSlot: '' };
      if (newDate.length === 10) loadStatsForDate(newDate);
      return updatedSession;
    }));
  }
  const addManualSession = () => setManualSessions([...manualSessions, { id: Date.now(), date: '', timeSlot: '', duration: 50 }]);
  const removeManualSession = (id: number) => manualSessions.length > 1 && setManualSessions(manualSessions.filter(s => s.id !== id));

  const horariosDisponiveisBase = ["07:30", "08:30", "09:30", "10:30", "11:30", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"]

  const getAvailableTimesForDate = (dateString: string) => {
    if (!dateString || dateString.length < 10) return horariosDisponiveisBase.map(time => ({ time, disabled: false }));
    const [year, month, day] = dateString.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const now = new Date();
    const isToday = selectedDate.getDate() === now.getDate() && selectedDate.getMonth() === now.getMonth() && selectedDate.getFullYear() === now.getFullYear();

    return horariosDisponiveisBase.map(time => {
      if (!isToday) return { time, disabled: false };
      const [hStr, mStr] = time.split(':');
      const hNum = parseInt(hStr, 10);
      const mNum = parseInt(mStr, 10);
      return { time, disabled: hNum < now.getHours() || (hNum === now.getHours() && mNum <= now.getMinutes()) };
    });
  }

  const toggleDia = (dia: string) => {
    const novosDias = { ...diasComHorarios };
    if (novosDias[dia]) delete novosDias[dia];
    else if (Object.keys(novosDias).length < maxDias) novosDias[dia] = '07:30';
    setDiasComHorarios(novosDias);
  }

  const isMissingTimeSlot = isAgendamentoManual && manualSessions.some(s => !s.timeSlot || !s.date)

  const handleSubmitPreview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return;

    setFormError('') 
    if (tipoAgendamento === 'REGULAR' && !selectedClientId) return setFormError("Selecione um aluno!")
    if (tipoAgendamento === 'EXPERIMENTAL' && !tempName) return setFormError("Digite o nome do visitante!")
    if (isAgendamentoManual && isMissingTimeSlot) return setFormError("Preencha todas as datas e horários da escala/lista.")

    setIsSubmitting(true)

    const dadosParaSalvar = {
      tipoAgendamento, serviceType, clientId: selectedClientId, tempName, tempPhone, instructorId,
      isAgendamentoManual, manualSessions, diasComHorarios, recorrenciaPeriodo, startDate: startDatePilates, 
      useReposicao, descontarDoPlano, comecarHoje, valorPersonalizado: valorPersonalizado ? Number(valorPersonalizado) : undefined
    }

    const resultado = await validarAgendamentosPreview(dadosParaSalvar)

    setIsSubmitting(false)

    if (resultado.sucesso) {
      setPreviewData(resultado.sessoes)
      setOriginalDadosSalvar(dadosParaSalvar)
      setPreviewModalOpen(true)
      setExpandedCardIndex(null)
    } else {
      setFormError(resultado.erro || "Conflito de horários ou erro no servidor.")
    }
  }

  const handleRemovePreview = (index: number) => {
    setPreviewData(prev => prev.filter((_, i) => i !== index));
    setExpandedCardIndex(null);
  }

  const handleSwapInstructor = async (index: number) => {
    const session = previewData[index];
    const newInst = session.instructor === 'Marisa' ? 'Loani' : 'Marisa';
    
    setIsCheckingSlot(true);
    let stats = dayStats[session.dateStr];
    if (!stats) {
        stats = await checkDailyAvailability(session.dateStr);
        setDayStats(prev => ({...prev, [session.dateStr]: stats}));
    }
    setIsCheckingSlot(false);

    const timeStats = stats[session.timeStr] || { total: 0, Marisa: 0, Loani: 0, MarisaBlocked: false, LoaniBlocked: false };

    let newStatus = 'OK';
    let errorMsg = '';
    if (timeStats[`${newInst}Blocked`]) { newStatus = 'BLOQUEADO'; errorMsg = `A Dra. ${newInst} também está indisponível.`; }
    else if (timeStats.total >= 4) { newStatus = 'LOTADO'; errorMsg = 'O estúdio está lotado neste horário (4 alunos).'; }
    else if ((newInst === 'Marisa' ? timeStats.Marisa : timeStats.Loani) >= 2) { newStatus = 'INSTRUTOR_LOTADO'; errorMsg = `A Dra. ${newInst} já tem 2 alunos marcados.`; }

    const newData = [...previewData];
    newData[index] = { ...session, instructor: newInst, status: newStatus as any, errorMsg };
    setPreviewData(newData);
  }

  const handleApplyNewDateTime = async (index: number) => {
    const session = previewData[index];
    const newDate = editSessionData.dateStr;
    const newTime = editSessionData.timeStr;
    if (!newDate || !newTime) return;

    setIsCheckingSlot(true);
    let stats = dayStats[newDate];
    if (!stats) {
        stats = await checkDailyAvailability(newDate);
        setDayStats(prev => ({...prev, [newDate]: stats}));
    }
    setIsCheckingSlot(false);

    const timeStats = stats[newTime] || { total: 0, Marisa: 0, Loani: 0, MarisaBlocked: false, LoaniBlocked: false };

    let newStatus = 'OK';
    let errorMsg = '';
    if (timeStats[`${session.instructor}Blocked`]) { newStatus = 'BLOQUEADO'; errorMsg = `Indisponível neste novo horário.`; }
    else if (timeStats.total >= 4) { newStatus = 'LOTADO'; errorMsg = 'Este novo horário está lotado.'; }
    else if ((session.instructor === 'Marisa' ? timeStats.Marisa : timeStats.Loani) >= 2) { newStatus = 'INSTRUTOR_LOTADO'; errorMsg = `A instrutora está lotada neste novo horário.`; }

    const [y, m, d] = newDate.split('-');
    const newData = [...previewData];
    newData[index] = { ...session, dateStr: newDate, timeStr: newTime, status: newStatus as any, errorMsg, diaFormatado: `${d}/${m}/${y}` };
    setPreviewData(newData);
    
    if (newStatus === 'OK') setExpandedCardIndex(null);
  }

  const handleConfirmFinal = async () => {
    if (previewData.some(s => s.status !== 'OK')) return;
    setIsSubmitting(true);
    const res = await efetivarAgendamentos({
      ...originalDadosSalvar,
      sessoesConfirmadas: previewData
    });
    setIsSubmitting(false);

    if (res.sucesso) {
      setPreviewModalOpen(false);
      router.push('/agendamentos'); 
      router.refresh();
    } else {
      setFormError(res.erro || "Falha final ao agendar.");
      setPreviewModalOpen(false);
    }
  }

  const freqSelecionada = Object.keys(diasComHorarios).length;
  const saldoAtual = selectedClientData?.remainingSessions || 0;
  const qtdSemana = Math.min(freqSelecionada, saldoAtual);
  const qtdMes = Math.min(freqSelecionada * 4, saldoAtual);

  const hasConflicts = previewData.some(s => s.status !== 'OK');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {previewModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-[#0f5c4e]">Revisão de Agendamentos</h2>
                <p className="text-xs text-slate-500 font-bold mt-1">Verifique os conflitos antes de salvar no sistema.</p>
              </div>
              <button onClick={() => setPreviewModalOpen(false)} className="text-slate-400 hover:text-slate-700 bg-slate-200 hover:bg-slate-300 w-8 h-8 rounded-full flex items-center justify-center transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/50">
              {hasConflicts && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex gap-3 text-sm font-bold shadow-sm">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p>Existem horários com conflito (ex: Instrutor ou Estúdio Lotado). Clique neles para resolver os problemas ou escolha "Remover Sessão" para ignorá-las e guardar o saldo.</p>
                </div>
              )}

              {previewData.map((session, idx) => {
                const isExpanded = expandedCardIndex === idx;
                const isOk = session.status === 'OK';
                
                return (
                  <div key={session.id} className={`bg-white border rounded-xl overflow-hidden transition-all shadow-sm ${isOk ? 'border-emerald-200' : 'border-red-300'}`}>
                    <div 
                      className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${isOk ? '' : 'bg-red-50/30'}`}
                      onClick={() => {
                        if (!isOk) {
                          if (isExpanded) setExpandedCardIndex(null);
                          else {
                            setExpandedCardIndex(idx);
                            setEditSessionData({ dateStr: session.dateStr, timeStr: session.timeStr });
                          }
                        }
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isOk ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                          {isOk ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="font-black text-slate-800">{session.diaFormatado} <span className="text-slate-400 font-medium">às</span> {session.timeStr}</p>
                          <p className="text-xs font-bold text-slate-500">Dra. {session.instructor}</p>
                        </div>
                      </div>
                      
                      {!isOk && (
                        <div className="text-right">
                          <p className="text-xs font-black text-red-600 uppercase tracking-widest">{session.status.replace('_', ' ')}</p>
                          <p className="text-[10px] text-red-500 font-medium mt-0.5">{session.errorMsg}</p>
                        </div>
                      )}
                    </div>

                    {isExpanded && !isOk && (
                      <div className="p-5 border-t border-red-100 bg-red-50/10 space-y-5 animate-in slide-in-from-top-2">
                        
                        {/* Trocar Instrutor */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3">Opção 1: Trocar de Instrutora</h5>
                          <Button 
                            type="button"
                            disabled={session.status === 'LOTADO' || isCheckingSlot} 
                            onClick={() => handleSwapInstructor(idx)}
                            className="w-full bg-[#0f5c4e] hover:bg-[#0a453a] text-white font-bold h-10 disabled:bg-slate-300"
                          >
                            Trocar para Dra. {session.instructor === 'Marisa' ? 'Loani' : 'Marisa'}
                          </Button>
                          {session.status === 'LOTADO' && <p className="text-[10px] text-slate-400 mt-2 font-bold text-center">Inativo porque a clínica (4 alunos) já está lotada neste horário.</p>}
                        </div>

                        {/* Trocar Data/Hora */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <h5 className="text-xs font-bold text-slate-700 uppercase tracking-widest mb-3">Opção 2: Escolher Nova Data/Hora</h5>
                          <div className="flex gap-3 relative">
                            <div className="flex-1">
                              <Input type="date" value={editSessionData.dateStr} onChange={e => setEditSessionData({...editSessionData, dateStr: e.target.value})} className="h-10 bg-slate-50" />
                            </div>
                            <div className="flex-1">
                              <Select value={editSessionData.timeStr} onValueChange={v => setEditSessionData({...editSessionData, timeStr: v})}>
                                <SelectTrigger className="h-10 bg-slate-50 font-bold"><SelectValue placeholder="Hora" /></SelectTrigger>
                                {/* Z-INDEX 9999 ADICIONADO AQUI PARA NÃO FICAR ATRÁS DO MODAL */}
                                <SelectContent className="z-[9999]">
                                  {horariosDisponiveisBase.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </div>
                            {/* COR DO BOTÃO APLICAR CORRIGIDA AQUI */}
                            <Button type="button" onClick={() => handleApplyNewDateTime(idx)} disabled={!editSessionData.dateStr || !editSessionData.timeStr || isCheckingSlot} className="h-10 px-6 font-bold bg-[#0f5c4e] hover:bg-[#0a453a] text-white shadow-sm">
                              Aplicar
                            </Button>
                          </div>
                        </div>

                        {/* Remover */}
                        <div className="text-center pt-2">
                          <button type="button" onClick={() => handleRemovePreview(idx)} className="text-xs font-bold text-slate-500 hover:text-red-600 underline underline-offset-2">
                            Apenas Remover Sessão (Guardar saldo na conta)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
              
              {previewData.length === 0 && (
                <div className="text-center py-10">
                  <p className="text-slate-500 font-bold">Todas as sessões foram removidas. Feche esta janela ou cancele o agendamento.</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setPreviewModalOpen(false)} className="font-bold px-6 h-12">Corrigir Formulário</Button>
              <Button type="button" onClick={handleConfirmFinal} disabled={hasConflicts || isSubmitting || previewData.length === 0} className="bg-[#0f5c4e] hover:bg-[#0a453a] text-white font-bold px-8 h-12 shadow-lg disabled:opacity-50">
                {isSubmitting ? 'Salvando Definitivo...' : `Confirmar (${previewData.length} sessões)`}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex p-1.5 bg-slate-100 rounded-xl w-fit shadow-inner">
        <button type="button" onClick={() => { setTipoAgendamento('REGULAR'); setValorPersonalizado(''); }} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${tipoAgendamento === 'REGULAR' ? 'bg-white text-[#0f5c4e] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Aluno Regular</button>
        <button type="button" onClick={() => { setTipoAgendamento('EXPERIMENTAL'); setServiceType('PILATES'); setValorPersonalizado(''); }} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${tipoAgendamento === 'EXPERIMENTAL' ? 'bg-white text-[#0f5c4e] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Experimental / Rápida</button>
      </div>

      <form onSubmit={handleSubmitPreview} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-8">
        
        <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[#0f5c4e] mb-4"><UserSquare2 className="w-5 h-5" /> 1. Identificação</h3>
          
          {tipoAgendamento === 'REGULAR' ? (
            <div className="space-y-2">
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger className="w-full h-11 bg-white focus:ring-[#0f5c4e]"><SelectValue placeholder="Selecione um aluno..." /></SelectTrigger>
                <SelectContent>{clients.map(c => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
              </Select>
              
              {selectedClientData && (
                <div className="flex flex-col gap-2 mt-3">
                  {!isAgendamentoManual && selectedClientData.plan && serviceType === 'PILATES' && (
                    <div className="bg-[#0f5c4e]/5 border border-[#0f5c4e]/20 p-4 rounded-xl mt-2 animate-in fade-in">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Checkbox checked={descontarDoPlano} onCheckedChange={(c) => { setDescontarDoPlano(c === true); if (c === true) setUseReposicao(false); }} className="w-5 h-5 text-[#0f5c4e] data-[state=checked]:bg-[#0f5c4e] rounded" />
                          <span className="text-sm font-bold text-[#0f5c4e]">Descontar Aula(s) do Plano</span>
                        </div>
                        <span className="text-xs font-black bg-white text-[#0f5c4e] border border-[#0f5c4e]/20 px-3 py-1.5 rounded-lg shadow-sm">Saldo: {selectedClientData.remainingSessions} aulas</span>
                      </label>
                      <p className="text-[11px] text-[#0f5c4e]/70 mt-2 ml-8 font-medium">As sessões marcadas abaixo serão subtraídas direto do pacote do paciente.</p>
                    </div>
                  )}

                  {(selectedClientData.repositionCredits || 0) > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl mt-2 animate-in fade-in">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div className="flex items-center gap-3">
                          <Checkbox checked={useReposicao} onCheckedChange={(c) => { setUseReposicao(c === true); if (c === true) setDescontarDoPlano(false); }} className="w-5 h-5 data-[state=checked]:bg-emerald-600 rounded" />
                          <span className="text-sm font-bold text-emerald-800">Usar Crédito de Reposição</span>
                        </div>
                        <span className="text-xs font-black bg-emerald-200 text-emerald-900 px-3 py-1.5 rounded-lg shadow-sm">Saldo: {selectedClientData.repositionCredits} crédito(s)</span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input type="text" value={tempName} onChange={e => setTempName(e.target.value)} required placeholder="Nome do visitante" className="h-11 bg-white" />
              <Input type="text" value={tempPhone} onChange={e => setTempPhone(e.target.value)} placeholder="(00) 00000-0000" className="h-11 bg-white" />
            </div>
          )}
        </div>

        <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[#0f5c4e] mb-4"><CalendarDays className="w-5 h-5" /> 2. Serviço</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Select value={serviceType} onValueChange={(v) => setServiceType(v as any)}>
              <SelectTrigger className="h-11 bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent><SelectItem value="PILATES">Pilates</SelectItem><SelectItem value="FISIOTERAPIA">Fisioterapia</SelectItem></SelectContent>
            </Select>
            <Select value={instructorId} onValueChange={setInstructorId}>
              <SelectTrigger className="h-11 bg-white"><SelectValue placeholder="Instrutor" /></SelectTrigger>
              <SelectContent><SelectItem value="Marisa">Dra. Marisa</SelectItem><SelectItem value="Loani">Dra. Loani</SelectItem></SelectContent>
            </Select>
          </div>
        </div>

        <div className="p-5 bg-[#0f5c4e]/5 rounded-xl border border-[#0f5c4e]/20">
          <h3 className="flex items-center justify-between text-lg font-bold text-[#0f5c4e] mb-4">
            <span className="flex items-center gap-2"><Clock className="w-5 h-5" /> 3. Datas e Horários</span>
            {(tipoAgendamento === 'EXPERIMENTAL' || isAgendamentoManual) && (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm animate-in fade-in">
                <span className="text-xs font-bold text-slate-500">Valor Cobrado: R$</span>
                <input 
                  type="number" placeholder="Padrão"
                  value={valorPersonalizado} 
                  onChange={e => setValorPersonalizado(e.target.value)}
                  className="w-16 text-sm font-bold text-[#0f5c4e] outline-none bg-transparent placeholder:text-slate-300"
                />
              </div>
            )}
          </h3>
          
          <div className="space-y-6">
            
            {serviceType === 'PILATES' && (
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
                <label className="flex items-center gap-3 cursor-pointer font-bold text-slate-700">
                  <Checkbox checked={isAgendamentoManual} onCheckedChange={(c) => {
                    setIsAgendamentoManual(c === true);
                    if (c === true) {
                      setDescontarDoPlano(false);
                      setUseReposicao(false);
                    } else {
                      if (selectedClientData?.remainingSessions > 0) setDescontarDoPlano(true);
                      setValorPersonalizado('');
                    }
                  }} className="w-5 h-5 text-[#0f5c4e] data-[state=checked]:bg-[#0f5c4e] border-slate-300 rounded" />
                  Agendar Aula(s) Avulsa(s) / Extra (Gerar Cobrança)
                </label>
              </div>
            )}

            {isAgendamentoManual ? (
              <div className="space-y-3 bg-white p-5 rounded-xl border shadow-sm animate-in fade-in">
                <h4 className="text-sm font-bold text-[#0f5c4e] mb-4 flex items-center gap-2"><CalendarSync className="w-4 h-4"/> Selecione as Aulas Avulsas</h4>
                {manualSessions.map((session, index) => {
                  const availableTimes = getAvailableTimesForDate(session.date);
                  return (
                    <div key={session.id} className="flex flex-col sm:flex-row items-end gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Sessão {index + 1} - Data</label>
                        <Input type="date" required value={session.date} onChange={(e) => handleDateChange(session.id, e.target.value)} className="h-11 bg-white" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 uppercase">Horário</label>
                        <Select value={session.timeSlot} onValueChange={(val) => updateManualSession(session.id, 'timeSlot', val)}>
                          <SelectTrigger className="h-11 bg-white font-bold"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                          <SelectContent>
                            {availableTimes.map(({ time, disabled }) => {
                              const st = dayStats[session.date]?.[time] || { total: 0, Marisa: 0, Loani: 0 };
                              const isBlocked = st.total >= 4 || (instructorId === 'Marisa' ? st.Marisa : st.Loani) >= 2 || st[`${instructorId}Blocked`] || disabled;
                              return <SelectItem key={time} value={time} disabled={isBlocked} className={isBlocked ? 'text-slate-400' : 'font-bold'}>{time}</SelectItem>
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      {manualSessions.length > 1 && (
                        <button type="button" onClick={() => removeManualSession(session.id)} className="h-11 w-11 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 shrink-0">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  )
                })}
                <div className="pt-2">
                  <Button type="button" variant="outline" onClick={addManualSession} className="w-full sm:w-auto gap-2 font-bold text-[#0f5c4e] border-[#0f5c4e]/30 hover:bg-[#0f5c4e]/10">
                    <Plus className="w-4 h-4"/> Adicionar nova linha
                  </Button>
                </div>
              </div>

            ) : (
              
              <div className="animate-in fade-in space-y-6">
                <div className="grid grid-cols-1 gap-6 p-5 bg-white rounded-xl border shadow-sm">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">A Partir de Qual Data</label>
                    <Input type="date" value={startDatePilates} onChange={(e) => setStartDatePilates(e.target.value)} className="h-11 font-medium bg-white sm:max-w-[50%]" required />
                    
                    {Object.keys(diasComHorarios).length > 0 && selectedClientData?.plan && (
                      <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg animate-in fade-in flex items-center gap-2 w-fit">
                        <Checkbox checked={comecarHoje} onCheckedChange={(c) => setComecarHoje(c === true)} className="rounded" />
                        <span className="text-xs font-bold text-emerald-800">A primeira aula já é HOJE!</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="flex items-center justify-between text-sm font-semibold mb-2 text-slate-700">Dias da Semana <span className="text-xs bg-white px-2 py-1 border rounded shadow-sm">Plano permite: Até {maxDias} dias</span></label>
                  <div className="flex flex-wrap gap-2">
                    {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => {
                      const isChecked = !!diasComHorarios[dia];
                      const isDisabled = !isChecked && Object.keys(diasComHorarios).length >= maxDias;
                      return (
                        <button key={dia} type="button" onClick={() => toggleDia(dia)} disabled={isDisabled} className={`px-5 py-2.5 rounded-xl text-sm font-bold border ${isChecked ? 'bg-[#0f5c4e] text-white' : 'bg-white text-slate-700 disabled:opacity-50'}`}>{dia}</button>
                      )
                    })}
                  </div>
                </div>

                {Object.keys(diasComHorarios).length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-5 rounded-xl border animate-in slide-in-from-top-2">
                    {Object.entries(diasComHorarios).map(([dia, time]) => (
                      <div key={dia} className="flex items-center gap-4">
                        <span className="font-black text-xs uppercase w-8">{dia}</span>
                        <Select value={time} onValueChange={(val) => setDiasComHorarios({...diasComHorarios, [dia]: val})}>
                          <SelectTrigger className="h-11 bg-slate-50 font-bold"><SelectValue placeholder="Hora" /></SelectTrigger>
                          <SelectContent>{horariosDisponiveisBase.map(h => (<SelectItem key={h} value={h}>{h}</SelectItem>))}</SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                )}

                {Object.keys(diasComHorarios).length > 0 && tipoAgendamento === 'REGULAR' && selectedClientData?.plan && (
                  <div className="bg-[#0f5c4e]/5 border border-[#0f5c4e]/20 p-5 rounded-xl mt-4 animate-in fade-in">
                    <h4 className="text-sm font-bold text-[#0f5c4e] mb-4 flex items-center gap-2"><CalendarSync className="w-4 h-4"/> Para quando deseja agendar estas aulas?</h4>
                    <RadioGroup value={recorrenciaPeriodo} onValueChange={(val: any) => setRecorrenciaPeriodo(val)} className="space-y-3">
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${recorrenciaPeriodo === 'SEMANA' ? 'bg-white border-[#0f5c4e]/40 shadow-sm' : 'border-transparent hover:bg-white/50'}`}>
                        <RadioGroupItem value="SEMANA" id="r1" className="text-[#0f5c4e] border-[#0f5c4e]/50" />
                        <span className="text-sm font-bold text-slate-800">Agendar apenas 1 Semana <span className="text-[#0f5c4e] font-semibold text-xs ml-1">({qtdSemana} aulas)</span></span>
                      </label>
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${recorrenciaPeriodo === 'MES' ? 'bg-white border-[#0f5c4e]/40 shadow-sm' : 'border-transparent hover:bg-white/50'}`}>
                        <RadioGroupItem value="MES" id="r2" className="text-[#0f5c4e] border-[#0f5c4e]/50" />
                        <span className="text-sm font-bold text-slate-800">Agendar 1 Mês Completo <span className="text-[#0f5c4e] font-semibold text-xs ml-1">({qtdMes} aulas)</span></span>
                      </label>
                      <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${recorrenciaPeriodo === 'TUDO' ? 'bg-white border-[#0f5c4e]/40 shadow-sm' : 'border-transparent hover:bg-white/50'}`}>
                        <RadioGroupItem value="TUDO" id="r3" className="text-[#0f5c4e] border-[#0f5c4e]/50" />
                        <span className="text-sm font-bold text-slate-800">Agendar Tudo <span className="text-[#0f5c4e] font-semibold text-xs ml-1">(Todas as {saldoAtual} aulas restantes)</span></span>
                      </label>
                    </RadioGroup>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-4 pt-6 border-t border-slate-200">
          {formError && <div className="w-full flex items-center gap-2 p-4 bg-red-50 text-red-700 font-bold border border-red-200 rounded-xl"><AlertCircle className="w-5 h-5 shrink-0" /> {formError}</div>}
          <div className="flex gap-3">
            <Button asChild variant="outline" className="h-12 px-6 rounded-xl font-bold"><Link href="/agendamentos">Cancelar</Link></Button>
            <Button type="submit" disabled={isSubmitting || (isAgendamentoManual && isMissingTimeSlot) || (!isAgendamentoManual && Object.keys(diasComHorarios).length === 0)} className="h-12 px-8 bg-[#0f5c4e] hover:bg-[#0a453a] text-white font-bold rounded-xl shadow-lg">{isSubmitting ? 'A Processar...' : 'Testar e Validar Agendamento'}</Button>
          </div>
        </div>

      </form>
    </div>
  )
}