'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Clock, CalendarDays, UserSquare2, AlertCircle, Plus, Trash2, CalendarSync } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { criarAgendamento, checkDailyAvailability } from '@/lib/actions'
import { format } from 'date-fns'

interface Appointment { date: Date | string; status: string; }
interface Client { id: string; name: string; plan?: string | null; repositionCredits: number; remainingSessions: number; appointments?: Appointment[] }
interface ManualSession { id: number; date: string; timeSlot: string; duration: number }

export default function NewAppointmentForm({ clients = [] }: { clients: Client[] }) {
  const router = useRouter()
  
  const [tipoAgendamento, setTipoAgendamento] = useState<'REGULAR' | 'EXPERIMENTAL'>('REGULAR')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [tempName, setTempName] = useState('') 
  const [tempPhone, setTempPhone] = useState('') 
  
  const [serviceType, setServiceType] = useState<'PILATES' | 'FISIOTERAPIA'>('PILATES')
  const [instructorId, setInstructorId] = useState('Marisa')
  
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      useReposicao, descontarDoPlano, comecarHoje 
    }

    const resultado = await criarAgendamento(dadosParaSalvar)

    if (resultado.sucesso) {
      router.push('/agendamentos'); router.refresh()
    } else {
      setFormError(resultado.erro || "Conflito de horários ou erro no servidor.")
      setIsSubmitting(false)
    }
  }

  const freqSelecionada = Object.keys(diasComHorarios).length;
  const saldoAtual = selectedClientData?.remainingSessions || 0;
  const qtdSemana = Math.min(freqSelecionada, saldoAtual);
  const qtdMes = Math.min(freqSelecionada * 4, saldoAtual);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      <div className="flex p-1.5 bg-slate-100 rounded-xl w-fit shadow-inner">
        <button type="button" onClick={() => setTipoAgendamento('REGULAR')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${tipoAgendamento === 'REGULAR' ? 'bg-white text-[#0f5c4e] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Aluno Regular</button>
        <button type="button" onClick={() => { setTipoAgendamento('EXPERIMENTAL'); setServiceType('PILATES'); }} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${tipoAgendamento === 'EXPERIMENTAL' ? 'bg-white text-[#0f5c4e] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Experimental / Rápida</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-8">
        
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
                  
                  {/* Se a opção de Aula Avulsa for ativada, escondemos a caixa de descontar do plano para deixar claro que é uma aula extra paga! */}
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
          <h3 className="flex items-center gap-2 text-lg font-bold text-[#0f5c4e] mb-4"><Clock className="w-5 h-5" /> 3. Datas e Horários</h3>
          
          <div className="space-y-6">
            
            {serviceType === 'PILATES' && (
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border shadow-sm">
                <label className="flex items-center gap-3 cursor-pointer font-bold text-slate-700">
                  <Checkbox checked={isAgendamentoManual} onCheckedChange={(c) => {
                    setIsAgendamentoManual(c === true);
                    if (c === true) {
                      setDescontarDoPlano(false);
                      setUseReposicao(false); // Desmarca tudo para garantir que vai gerar cobrança, a menos que ele marque propositalmente de novo
                    } else {
                      if (selectedClientData?.remainingSessions > 0) setDescontarDoPlano(true);
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
            <Button type="submit" disabled={isSubmitting || (isAgendamentoManual && isMissingTimeSlot) || (!isAgendamentoManual && Object.keys(diasComHorarios).length === 0)} className="h-12 px-8 bg-[#0f5c4e] hover:bg-[#0a453a] text-white font-bold rounded-xl shadow-lg">{isSubmitting ? 'A Processar e Salvar...' : 'Confirmar Agendamento'}</Button>
          </div>
        </div>

      </form>
    </div>
  )
}