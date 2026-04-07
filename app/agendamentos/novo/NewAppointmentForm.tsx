// app/agendamentos/novo/NewAppointmentForm.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox' // <-- AQUI ESTÁ A CORREÇÃO!
import { Clock, CalendarDays, UserSquare2, Plus, Trash2, Info, AlertCircle, Lock, RotateCcw } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { criarAgendamento, checkDailyAvailability } from '@/lib/actions'
import { format } from 'date-fns'

interface Appointment {
  date: Date | string;
  status: string;
}

interface Client {
  id: string
  name: string
  plan?: string | null
  repositionCredits: number
  appointments?: Appointment[]
}

interface FisioSession {
  id: number
  date: string
  timeSlot: string
  duration: number
}

export default function NewAppointmentForm({ clients = [] }: { clients: Client[] }) {
  const router = useRouter()
  
  const [tipoAgendamento, setTipoAgendamento] = useState<'REGULAR' | 'EXPERIMENTAL'>('REGULAR')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [tempName, setTempName] = useState('') 
  const [tempPhone, setTempPhone] = useState('') 
  
  const [serviceType, setServiceType] = useState<'PILATES' | 'FISIOTERAPIA'>('PILATES')
  const [instructorId, setInstructorId] = useState('Marisa')
  
  const [startDatePilates, setStartDatePilates] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  
  const [diasComHorarios, setDiasComHorarios] = useState<Record<string, string>>({})
  const [singleTime, setSingleTime] = useState('08:00') 
  const [duracaoBase, setDuracaoBase] = useState(50) 
  const [maxDias, setMaxDias] = useState(1)
  
  const [hasActivePlanSchedule, setHasActivePlanSchedule] = useState(false)
  const [useReposicao, setUseReposicao] = useState(false)

  const [isFisioRecorrente, setIsFisioRecorrente] = useState(false)
  const [fisioSessions, setFisioSessions] = useState<FisioSession[]>([
    { id: Date.now(), date: format(new Date(), 'yyyy-MM-dd'), timeSlot: '', duration: 50 }
  ])
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('') 

  const [dayStats, setDayStats] = useState<Record<string, any>>({})

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
      } else {
        setMaxDias(1);
      }

      if (selectedClientData.appointments && selectedClientData.appointments.length > 0) {
        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const aulasFuturas = selectedClientData.appointments.filter(app => {
            const d = new Date(app.date);
            return d >= hoje && app.status !== 'CANCELADO';
        });
        
        if (aulasFuturas.length > 2) {
          setHasActivePlanSchedule(true);
          setDiasComHorarios({}); 
        } else {
          setHasActivePlanSchedule(false);
        }
      } else {
        setHasActivePlanSchedule(false);
      }

    } else {
      setMaxDias(1);
      setHasActivePlanSchedule(false);
      setUseReposicao(false);
    }
  }, [selectedClientId, serviceType, tipoAgendamento, selectedClientData])
  
  useEffect(() => {
    if (serviceType === 'PILATES' && startDatePilates.length === 10 && Object.keys(diasComHorarios).length === 0) {
      loadStatsForDate(startDatePilates)
    }
  }, [startDatePilates, instructorId, serviceType, diasComHorarios])

  const toggleDia = (dia: string) => {
    if (hasActivePlanSchedule) return;
    
    const novosDias = { ...diasComHorarios };
    if (novosDias[dia]) {
      delete novosDias[dia];
    } else {
      if (Object.keys(novosDias).length < maxDias) {
        novosDias[dia] = '08:00'; 
      }
    }
    setDiasComHorarios(novosDias);
    setFormError('');
  }

  const addFisioSession = () => setFisioSessions([...fisioSessions, { id: Date.now(), date: '', timeSlot: '', duration: 50 }])
  const removeFisioSession = (id: number) => fisioSessions.length > 1 && setFisioSessions(fisioSessions.filter(s => s.id !== id))
  
  const updateFisioSession = (id: number, field: keyof FisioSession, value: string | number) => {
    setFisioSessions(fisioSessions.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const horariosDisponiveisBase = ["07:00", "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"]

  const isPastDate = (dateString: string) => {
    if (!dateString || dateString.length < 10) return false; 
    const [year, month, day] = dateString.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    return selectedDate < today;
  }

  const getAvailableTimesForDate = (dateString: string) => {
    if (!dateString || dateString.length < 10) {
      return horariosDisponiveisBase.map(time => ({ time, disabled: false }));
    }
    const [year, month, day] = dateString.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day);
    const now = new Date();
    const isToday = selectedDate.getDate() === now.getDate() && selectedDate.getMonth() === now.getMonth() && selectedDate.getFullYear() === now.getFullYear();

    return horariosDisponiveisBase.map(time => {
      if (!isToday) return { time, disabled: false };
      const [hStr, mStr] = time.split(':');
      const hNum = parseInt(hStr, 10);
      const mNum = parseInt(mStr, 10);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      return { time, disabled: hNum < currentHour || (hNum === currentHour && mNum <= currentMinute) };
    });
  }

  const loadStatsForDate = async (dateStr: string) => {
    if (!dateStr || dateStr.length < 10 || dayStats[dateStr]) return;
    const stats = await checkDailyAvailability(dateStr);
    setDayStats(prev => ({ ...prev, [dateStr]: stats }));
  }

  const handleDateChange = (id: number, newDate: string) => {
    setFisioSessions(prev => prev.map(s => {
      if (s.id !== id) return s;
      let updatedSession = { ...s, date: newDate, timeSlot: '' };
      if (newDate.length === 10) loadStatsForDate(newDate);
      return updatedSession;
    }));
  }

  const hasPastFisioSession = fisioSessions.some(s => isPastDate(s.date))
  const isMissingTimeSlot = fisioSessions.some(s => !s.timeSlot)
  
  const isAvulso = serviceType === 'PILATES' && Object.keys(diasComHorarios).length === 0;
  const pilatesStats = isAvulso ? (dayStats[startDatePilates]?.[singleTime] || { total: 0, Marisa: 0, Loani: 0 }) : null;
  const pilatesProfCount = pilatesStats ? (instructorId === 'Marisa' ? pilatesStats.Marisa : pilatesStats.Loani) : 0;
  const isPilatesTimeBlocked = pilatesStats ? (pilatesStats.total >= 4 || pilatesProfCount >= 2) : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return;

    setFormError('') 
    
    if (tipoAgendamento === 'REGULAR' && !selectedClientId) return setFormError("Selecione um aluno!")
    if (tipoAgendamento === 'EXPERIMENTAL' && !tempName) return setFormError("Digite o nome do visitante!")
    if (serviceType === 'FISIOTERAPIA' && (hasPastFisioSession || fisioSessions.some(s => !s.date) || isMissingTimeSlot)) {
      return setFormError("Preencha todas as datas e horários corretamente (não é permitido agendar no passado).")
    }

    if (isAvulso && isPilatesTimeBlocked) {
      return setFormError(`A Dra. ${instructorId} já atingiu o limite de 2 alunos, ou o estúdio já possui 4 alunos às ${singleTime}. Escolha outro horário.`);
    }

    setIsSubmitting(true)

    const dadosParaSalvar = {
      tipoAgendamento,
      serviceType,
      clientId: selectedClientId,
      tempName,
      tempPhone,
      instructorId,
      diasComHorarios,
      singleTime,
      duracao: duracaoBase,
      fisioSessions,
      startDate: startDatePilates,
      isReposicao: useReposicao 
    }

    const resultado = await criarAgendamento(dadosParaSalvar)

    if (resultado.sucesso) {
      router.push('/agendamentos') 
      router.refresh()
    } else {
      setFormError(resultado.erro || "Erro ao salvar o agendamento. Conflito de horários ou falha na base de dados.")
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <div className="flex p-1.5 bg-slate-100 rounded-xl w-fit shadow-inner">
        <button 
          type="button"
          onClick={() => { setTipoAgendamento('REGULAR'); setDiasComHorarios({}); setFormError(''); }}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${tipoAgendamento === 'REGULAR' ? 'bg-white text-[#0f5c4e] shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Aluno Regular
        </button>
        <button 
          type="button"
          onClick={() => { setTipoAgendamento('EXPERIMENTAL'); setDiasComHorarios({}); setServiceType('PILATES'); setUseReposicao(false); setFormError(''); }}
          className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${tipoAgendamento === 'EXPERIMENTAL' ? 'bg-white text-[#0f5c4e] shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Experimental / Rápida
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-8">
        
        <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[#0f5c4e] mb-4">
            <UserSquare2 className="w-5 h-5" /> 1. Identificação
          </h3>
          
          {tipoAgendamento === 'REGULAR' ? (
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Selecionar Aluno</label>
              <Select value={selectedClientId} onValueChange={(v) => { setSelectedClientId(v); setUseReposicao(false); setFormError(''); }}>
                <SelectTrigger className="w-full h-11 bg-white border-slate-200 focus:ring-[#0f5c4e]">
                  <SelectValue placeholder="Selecione um aluno cadastrado..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedClientData && (
                <div className="flex flex-col gap-2 mt-3">
                  
                  {selectedClientData.plan && serviceType === 'PILATES' && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-[#0f5c4e]" />
                      Plano Atual: <strong className="text-[#0f5c4e]">{selectedClientData.plan.replace('_', ' ')}</strong> (Máximo de {maxDias} dias na semana)
                    </p>
                  )}

                  {hasActivePlanSchedule && (
                    <p className="text-[10px] text-amber-600 bg-amber-50 border border-amber-100 px-2 py-1.5 rounded flex items-center gap-1 font-bold w-fit">
                      <Lock className="w-3 h-3" /> Este aluno já tem horários fixos agendados. (Apenas aulas avulsas)
                    </p>
                  )}

                  {(selectedClientData.repositionCredits || 0) > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg mt-1 animate-in fade-in zoom-in-95">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Checkbox 
                          checked={useReposicao}
                          onCheckedChange={(c) => setUseReposicao(c === true)}
                          className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600 rounded"
                        />
                        <span className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                          <RotateCcw className="w-4 h-4" />
                          Gastar crédito de Reposição (Saldo: {selectedClientData.repositionCredits})
                        </span>
                      </label>
                      {useReposicao && <p className="text-[10px] text-emerald-600 font-semibold mt-1 ml-6">Nenhuma cobrança será gerada para esta sessão extra.</p>}
                    </div>
                  )}

                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700">Nome Completo</label>
                <Input type="text" name="tempName" value={tempName} onChange={e => { setTempName(e.target.value); setFormError(''); }} required placeholder="Nome do visitante" className="h-11 bg-white focus-visible:ring-[#0f5c4e]" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700">WhatsApp</label>
                <Input type="text" name="tempPhone" value={tempPhone} onChange={e => setTempPhone(e.target.value)} placeholder="(00) 00000-0000" className="h-11 bg-white focus-visible:ring-[#0f5c4e]" />
              </div>
            </div>
          )}
        </div>

        <div className="p-5 bg-slate-50 rounded-xl border border-slate-100">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[#0f5c4e] mb-4">
            <CalendarDays className="w-5 h-5" /> 2. Serviço
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">Tipo de Atendimento</label>
              <Select value={serviceType} onValueChange={(v) => { setServiceType(v as any); setFormError(''); }}>
                <SelectTrigger className="w-full h-11 bg-white border-slate-200 focus:ring-[#0f5c4e]">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PILATES">Pilates (Avulso ou Plano)</SelectItem>
                  <SelectItem value="FISIOTERAPIA">Fisioterapia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-slate-700">Instrutor Responsável</label>
              <Select value={instructorId} onValueChange={setInstructorId}>
                <SelectTrigger className="w-full h-11 bg-white border-slate-200 focus:ring-[#0f5c4e]">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Marisa">Dra. Marisa</SelectItem>
                  <SelectItem value="Loani">Dra. Loani</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="p-5 bg-[#0f5c4e]/5 rounded-xl border border-[#0f5c4e]/20">
          <h3 className="flex items-center gap-2 text-lg font-bold text-[#0f5c4e] mb-4">
            <Clock className="w-5 h-5" /> 3. Datas e Horários
          </h3>
          
          {serviceType === 'PILATES' ? (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Data de Início / Aula Avulsa</label>
                  <Input 
                    type="date" 
                    value={startDatePilates} 
                    onChange={(e) => setStartDatePilates(e.target.value)} 
                    className="h-11 bg-white focus-visible:ring-[#0f5c4e] font-medium" 
                    required
                  />
                  <p className={`text-[10px] font-bold mt-2 px-2 py-1.5 rounded-md border inline-block ${Object.keys(diasComHorarios).length === 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {Object.keys(diasComHorarios).length === 0 ? (useReposicao ? "✅ Aula de Reposição (Sem cobrança)." : "⚠️ Aula Avulsa: Será gerada fatura financeira.") : "Plano Recorrente: Aulas fixas serão agendadas."}
                  </p>
                </div>

                {Object.keys(diasComHorarios).length === 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex justify-between">
                      Horário da Sessão Avulsa
                    </label>
                    <Select value={singleTime} onValueChange={setSingleTime}>
                      <SelectTrigger className={`w-full h-11 bg-white focus:ring-[#0f5c4e] font-semibold ${isPilatesTimeBlocked ? 'border-red-400 ring-2 ring-red-400/20 text-red-600' : 'border-slate-200 text-slate-700'}`}>
                        <SelectValue placeholder="Hora" />
                      </SelectTrigger>
                      <SelectContent>
                        {getAvailableTimesForDate(startDatePilates).map(({time, disabled}) => {
                          const st = dayStats[startDatePilates]?.[time] || { total: 0, Marisa: 0, Loani: 0 };
                          const profCount = instructorId === 'Marisa' ? st.Marisa : st.Loani;
                          
                          const isBlockedTotal = st.total >= 4;
                          const isBlockedProf = profCount >= 2;
                          const isBlocked = isBlockedTotal || isBlockedProf || disabled;

                          let labelStr = time;
                          if (disabled) labelStr += " (Passado)";
                          else if (isBlockedTotal) labelStr += " (Esgotado 4/4)";
                          else if (isBlockedProf) labelStr += ` (${instructorId} Lotada)`;
                          else if (st.total > 0) labelStr += ` (${st.total}/4 vagas - ${instructorId} ${profCount}/2)`;
                          else labelStr += " (Livre)";

                          return (
                            <SelectItem 
                              key={time} 
                              value={time} 
                              disabled={isBlocked}
                              className={isBlocked ? 'text-slate-400 bg-slate-50 font-medium' : 'text-slate-700 font-bold'}
                            >
                              {labelStr}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    {isPilatesTimeBlocked && (
                      <p className="text-[10px] text-red-600 font-bold mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Limite da clínica ou doutora excedido neste horário.</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="flex items-center justify-between text-sm font-semibold mb-2 text-slate-700">
                  Dias da Semana (Apenas para Planos)
                  <span className="text-xs font-bold text-slate-500 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-sm">Limite do Paciente: {maxDias} {maxDias === 1 ? 'dia' : 'dias'}</span>
                </label>
                <div className="flex flex-wrap gap-2 relative">
                  
                  {hasActivePlanSchedule && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 rounded-xl flex items-center justify-center border border-slate-200 cursor-not-allowed">
                       <span className="text-xs font-black text-slate-600 uppercase tracking-widest bg-white px-3 py-1 rounded shadow-sm flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5" /> PLANO JÁ AGENDADO
                       </span>
                    </div>
                  )}

                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => {
                    const isChecked = !!diasComHorarios[dia];
                    const isDisabled = (!isChecked && Object.keys(diasComHorarios).length >= maxDias) || hasActivePlanSchedule;

                    return (
                      <button
                        key={dia} type="button" onClick={() => toggleDia(dia)} disabled={isDisabled}
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all border shadow-sm ${
                          isChecked ? 'bg-[#0f5c4e] text-white border-[#0f5c4e]' : 
                          isDisabled ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60' : 
                          'bg-white text-slate-700 border-slate-200 hover:border-[#0f5c4e]/50 hover:bg-[#0f5c4e]/5'
                        }`}
                      >
                        {dia}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-slate-500 mt-3 font-medium bg-white p-2.5 rounded-lg border border-slate-100 flex items-start gap-2 leading-tight">
                  <Info className="w-4 h-4 shrink-0 text-[#0f5c4e]"/> 
                  Deixe em branco para marcar Aula Avulsa extra (ou reposição). Clique nos dias para gerar a recorrência do plano.
                </p>
              </div>

              {Object.keys(diasComHorarios).length > 0 && (
                <div className="bg-white p-5 rounded-xl border border-[#0f5c4e]/30 shadow-sm space-y-4 animate-in slide-in-from-top-2">
                  <h4 className="text-sm font-bold text-[#0f5c4e] flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Defina o horário para cada dia da semana
                  </h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(diasComHorarios).map(([dia, time]) => (
                      <div key={dia} className="flex items-center justify-between gap-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="font-black text-slate-700 uppercase text-xs w-12">{dia}</span>
                        <Select value={time} onValueChange={(val) => {
                          setDiasComHorarios({...diasComHorarios, [dia]: val});
                          setFormError('');
                        }}>
                          <SelectTrigger className="w-full h-10 bg-white font-bold text-slate-700">
                            <SelectValue placeholder="Hora" />
                          </SelectTrigger>
                          <SelectContent>
                            {horariosDisponiveisBase.map(h => (
                              <SelectItem key={h} value={h} className="font-bold">{h}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 mt-2">O sistema irá validar se o estúdio possui vagas nestes horários nos próximos meses antes de salvar.</p>
                </div>
              )}

            </div>
          ) : (
            <div className="space-y-4">
              <label className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer w-fit mb-4 select-none bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
                <input 
                  type="checkbox" 
                  checked={isFisioRecorrente} 
                  onChange={(e) => { 
                    setIsFisioRecorrente(e.target.checked); 
                    if (!e.target.checked) setFisioSessions([fisioSessions[0]]) 
                  }} 
                  className="w-4 h-4 rounded accent-[#0f5c4e] cursor-pointer" 
                />
                Marcar pacote com múltiplas sessões
              </label>

              <div className="space-y-3">
                {fisioSessions.map((session) => {
                  const isInvalidDate = isPastDate(session.date)
                  const availableTimesForThisSession = getAvailableTimesForDate(session.date)

                  return (
                    <div key={session.id} className={`flex flex-col sm:flex-row items-end gap-3 p-4 bg-white border rounded-xl shadow-sm transition-colors ${isInvalidDate ? 'border-red-300 bg-red-50/50' : 'border-slate-200'}`}>
                      
                      <div className="w-full sm:w-auto flex-1">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Data da Sessão</label>
                        <Input 
                          type="date" 
                          required 
                          value={session.date} 
                          onChange={(e) => { handleDateChange(session.id, e.target.value); setFormError(''); }} 
                          className={`h-11 focus-visible:ring-[#0f5c4e] font-medium ${isInvalidDate ? 'border-red-400 text-red-700 font-bold' : 'bg-white'}`} 
                        />
                        {isInvalidDate && <span className="text-[10px] text-red-500 font-bold mt-1 block">Data no passado.</span>}
                      </div>
                      
                      <div className="w-full sm:w-auto">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Horário (Lotação)</label>
                        <Select value={session.timeSlot} onValueChange={(val) => { updateFisioSession(session.id, 'timeSlot', val); setFormError(''); }}>
                          <SelectTrigger className={`w-full sm:w-64 h-11 bg-white border-slate-200 focus:ring-[#0f5c4e] font-semibold ${!session.timeSlot && session.date.length === 10 ? 'ring-2 ring-red-400/50 border-red-400' : ''}`}>
                            <SelectValue placeholder="Selecione o horário" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTimesForThisSession.length > 0 ? (
                              availableTimesForThisSession.map(({ time, disabled }) => {
                                const stats = dayStats[session.date]?.[time] || { total: 0, Marisa: 0, Loani: 0 };
                                const profCount = instructorId === 'Marisa' ? stats.Marisa : stats.Loani;
                                
                                const isBlockedTotal = stats.total >= 4;
                                const isBlockedProf = profCount >= 2;
                                const isBlocked = isBlockedTotal || isBlockedProf || disabled;

                                let labelStr = time;
                                if (disabled) labelStr += " (Passou)";
                                else if (isBlockedTotal) labelStr += " (Lotado 4/4)";
                                else if (isBlockedProf) labelStr += ` (${instructorId} Lotada)`;
                                else if (stats.total > 0) labelStr += ` (${stats.total}/4 vagas - ${instructorId} ${profCount}/2)`;
                                else labelStr += " (Livre)";

                                return (
                                  <SelectItem 
                                    key={time} 
                                    value={time} 
                                    disabled={isBlocked}
                                    className={isBlocked ? 'text-slate-400 bg-slate-50 font-medium' : 'font-bold text-slate-700'}
                                  >
                                    {labelStr}
                                  </SelectItem>
                                )
                              })
                            ) : (
                              <SelectItem value="indisponivel" disabled>Sem horários</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="w-full sm:w-auto">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Duração</label>
                        <div className="flex items-center">
                          <Input 
                            type="number" 
                            value={session.duration} 
                            onChange={(e) => updateFisioSession(session.id, 'duration', Number(e.target.value))} 
                            className="w-16 h-11 rounded-r-none border-r-0 focus-visible:ring-[#0f5c4e] text-center font-bold" 
                          />
                          <span className="h-11 px-3 bg-slate-50 border border-slate-200 rounded-r-md text-xs font-bold text-slate-500 flex items-center">min</span>
                        </div>
                      </div>
                      
                      {isFisioRecorrente && fisioSessions.length > 1 && (
                        <div className="flex items-end">
                          <button type="button" onClick={() => removeFisioSession(session.id)} className="h-11 w-11 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {isFisioRecorrente && (
                <button type="button" disabled={hasPastFisioSession} onClick={addFisioSession} className="mt-2 flex items-center gap-2 text-sm font-bold text-[#0f5c4e] hover:text-[#0a453a] bg-[#0f5c4e]/10 hover:bg-[#0f5c4e]/20 disabled:opacity-50 disabled:bg-slate-100 disabled:text-slate-400 px-5 py-3 rounded-xl transition-colors">
                  <Plus className="w-4 h-4" /> Adicionar sessão avulsa
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-4 pt-6 border-t border-slate-200">
          {formError && (
            <div className="w-full flex items-center gap-2 p-4 bg-red-50 text-red-700 font-bold border border-red-200 rounded-xl animate-in slide-in-from-bottom-2">
              <AlertCircle className="w-5 h-5 shrink-0" /> {formError}
            </div>
          )}
          <div className="flex gap-3">
            <Button asChild variant="outline" className="h-12 px-6 rounded-xl font-bold hover:bg-slate-100 border-slate-200 text-slate-600">
              <Link href="/agendamentos">Cancelar</Link>
            </Button>
            <Button 
              type="submit" 
              disabled={
                isSubmitting || 
                (isAvulso && isPilatesTimeBlocked) ||
                (serviceType === 'FISIOTERAPIA' && (hasPastFisioSession || isMissingTimeSlot))
              }
              className="h-12 px-8 bg-[#0f5c4e] hover:bg-[#0a453a] text-white font-bold shadow-lg rounded-xl disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'A Processar e Salvar...' : 'Confirmar Agendamento'}
            </Button>
          </div>
        </div>

      </form>
    </div>
  )
}