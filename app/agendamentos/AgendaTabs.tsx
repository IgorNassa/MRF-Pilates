// app/agendamentos/AgendaTabs.tsx
'use client'

import { useState } from 'react'
import { format, addDays, startOfWeek, subWeeks, addWeeks, isSameDay, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, User, Clock, Activity, Edit, Trash2, 
  UserX, CheckCircle2, Lock, XCircle, RotateCcw, Play, Users, AlertCircle, X as CloseIcon,
  Stethoscope, FileText, MessageCircle, Ticket
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  marcarFaltaAgendamento, deletarAgendamento, concluirSessaoComEvolucao,
  cancelarAgendamento, converterEmReposicao, atualizarAgendamento
} from '@/lib/actions'
import { useRouter } from 'next/navigation'
import { useTimer } from '@/hooks/use-timer'

interface EvolutionData {
  evolucao: string;
  observacao: string;
}

export default function AgendaTabs({ initialAppointments = [], msgConfirmacao = "" }: { initialAppointments: any[], msgConfirmacao?: string }) {
  const router = useRouter()
  const { timerSeconds, isTimerRunning, startClass, timerHour, stopClass, formatTime } = useTimer()

  const [currentDate, setCurrentDate] = useState(new Date())
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 })
  const [activeDayIndex, setActiveDayIndex] = useState(new Date().getDay())
  const selectedDate = addDays(weekStart, activeDayIndex)

  const [activeRoomHour, setActiveRoomHour] = useState<string | null>(null)
  const [presentStudents, setPresentStudents] = useState<string[]>([])
  
  const [confirmDialog, setConfirmDialog] = useState<{ title: string, message: string, action: () => Promise<void> } | null>(null)
  const [errorDialog, setErrorDialog] = useState<{ title: string, message: string } | null>(null)
  const [isActionProcessing, setIsActionProcessing] = useState(false)
  
  const [evolutionDialog, setEvolutionDialog] = useState<{ 
    appts: any[], 
    evolutions: Record<string, EvolutionData>,
    selectedApptId: string | null 
  } | null>(null)

  const [editDialog, setEditDialog] = useState<{ id: string, date: string, time: string, instructor: string, isLocked: boolean } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const toggleStudentPresence = (apptId: string) => {
    setPresentStudents(prev => prev.includes(apptId) ? prev.filter(id => id !== apptId) : [...prev, apptId])
  }

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split('-').map(Number);
    const newDate = new Date(year, month - 1, day);
    setCurrentDate(newDate);
    setActiveDayIndex(newDate.getDay()); 
  }

  const handleAction = (actionFn: (id: string) => Promise<any>, id: string, title: string, message: string) => {
    setConfirmDialog({
      title, 
      message,
      action: async () => {
        setIsActionProcessing(true)
        const res = await actionFn(id)
        setIsActionProcessing(false)
        setConfirmDialog(null)
        if (res && res.sucesso) {
          router.refresh()
        } else if (res && res.erro) {
          setErrorDialog({ title: "Ação Bloqueada", message: res.erro })
        }
      }
    })
  }

  const handleFinishClassRequest = (apptsToFinish: any[]) => {
    if (apptsToFinish.length === 0) return;
    
    if (timerHour === activeRoomHour && timerSeconds > 0) {
      setConfirmDialog({
        title: "Atenção: Aula Incompleta",
        message: `O cronómetro ainda marca ${formatTime(timerSeconds)} restantes. Tem a certeza que deseja finalizar a sessão antes dos 50 minutos?`,
        action: async () => {
          setConfirmDialog(null)
          openEvolutionModal(apptsToFinish)
        }
      })
    } else {
      openEvolutionModal(apptsToFinish)
    }
  }

  const openEvolutionModal = (appts: any[]) => {
    const initialEvolutions: Record<string, EvolutionData> = {}
    appts.forEach(a => initialEvolutions[a.id] = { evolucao: "", observacao: "" })
    setEvolutionDialog({ 
      appts, 
      evolutions: initialEvolutions,
      selectedApptId: appts[0]?.id || null
    })
  }

  const submitEvolutions = async () => {
    if (!evolutionDialog) return
    setIsSubmitting(true)
    
    for (const appt of evolutionDialog.appts) {
      const data = evolutionDialog.evolutions[appt.id]
      let textToSave = "Sessão concluída sem observações."
      if (data.evolucao.trim() !== "" || data.observacao.trim() !== "") {
        textToSave = `[EVOLUÇÃO CLÍNICA]\n${data.evolucao.trim() || 'N/A'}\n\n[OBSERVAÇÕES ADICIONAIS]\n${data.observacao.trim() || 'N/A'}`
      }
      await concluirSessaoComEvolucao(appt.id, appt.clientId, textToSave, appt.instructor)
    }

    setIsSubmitting(false)
    setEvolutionDialog(null)
    setPresentStudents([])
    stopClass()
    setActiveRoomHour(null)
    router.refresh()
  }

  const openEditModal = (appt: any, isLocked: boolean) => {
    const d = new Date(appt.date);
    setEditDialog({
      id: appt.id,
      date: format(d, 'yyyy-MM-dd'),
      time: format(d, 'HH:mm'),
      instructor: appt.instructor,
      isLocked
    })
  }

  const handleEditSubmit = async () => {
    if (!editDialog) return;
    setIsActionProcessing(true);
    
    const novaDataString = `${editDialog.date}T${editDialog.time}:00`;
    const novaData = new Date(novaDataString);
    
    const res = await atualizarAgendamento(editDialog.id, novaData, editDialog.instructor);
    setIsActionProcessing(false);

    if (res.sucesso) {
      setEditDialog(null);
      router.refresh();
    } else {
      setErrorDialog({ title: "Capacidade Excedida", message: res.erro || "Este horário encontra-se lotado. Por favor, selecione outro." });
    }
  }

  const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1))
  const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1))
  const goToToday = () => {
    const hoje = new Date();
    setCurrentDate(hoje);
    setActiveDayIndex(hoje.getDay());
  }

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const date = addDays(weekStart, i)
    return { index: i, date, shortName: format(date, 'EEee', { locale: ptBR }).split('-')[0], dayNumber: format(date, 'dd') }
  })

  const dailyAppointments = initialAppointments.filter(app => isSameDay(new Date(app.date), selectedDate))
  
  const hours = [
    "07:30", "08:30", "09:30", "10:30", "11:30",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"
  ]

  return (
    <>
      {errorDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-8">
              <div className="w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-red-100">
                <XCircle className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3">{errorDialog.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{errorDialog.message}</p>
            </div>
            <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end gap-3 rounded-b-3xl">
              <Button onClick={() => setErrorDialog(null)} className="bg-slate-800 text-white hover:bg-slate-900 font-bold h-12 px-8 shadow-md">Ok, entendi</Button>
            </div>
          </div>
        </div>
      )}

      {editDialog && (() => {
        const apptsOnEditDate = initialAppointments.filter(app => {
          if (app.status === 'CANCELADO' || app.status === 'FALTA' || app.id === editDialog.id) return false;
          return format(new Date(app.date), 'yyyy-MM-dd') === editDialog.date;
        });

        const apptsOnEditTime = apptsOnEditDate.filter(app => 
          format(new Date(app.date), 'HH:mm') === editDialog.time
        );

        const isTimeFull = apptsOnEditTime.length >= 4;
        const isInstructorFull = apptsOnEditTime.filter(app => app.instructor === editDialog.instructor).length >= 2;

        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="text-xl font-black text-[#0f5c4e] flex items-center gap-2">
                  <Edit className="w-5 h-5" /> Editar Sessão
                </h3>
                <button onClick={() => setEditDialog(null)} className="text-slate-400 hover:text-slate-800">
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-6 overflow-visible">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nova Data</label>
                  <input 
                    type="date" 
                    disabled={editDialog.isLocked}
                    value={editDialog.date} 
                    onChange={(e) => setEditDialog({...editDialog, date: e.target.value})}
                    className={`w-full mt-1.5 p-3 border rounded-xl focus:outline-none font-medium ${editDialog.isLocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'bg-white border-slate-200 focus:ring-2 focus:ring-[#0f5c4e] text-slate-800'}`}
                  />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex justify-between items-end">
                    Novo Horário
                  </label>
                  <select 
                    disabled={editDialog.isLocked}
                    value={editDialog.time}
                    onChange={(e) => setEditDialog({...editDialog, time: e.target.value})}
                    className={`w-full mt-1.5 p-3 border rounded-xl focus:outline-none font-medium ${editDialog.isLocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : isTimeFull ? 'border-red-300 focus:ring-red-400 text-red-600 bg-white' : 'border-slate-200 focus:ring-[#0f5c4e] text-slate-800 bg-white'}`}
                  >
                    {hours.map(h => {
                      const count = apptsOnEditDate.filter(a => format(new Date(a.date), 'HH:mm') === h).length;
                      const isFull = count >= 4;
                      return (
                        <option key={h} value={h} disabled={isFull} className={isFull ? 'text-slate-400 bg-slate-100 font-bold' : 'text-slate-800'}>
                          {h} {isFull ? '(LOTADO - 4 Alunos)' : `(${4 - count} vagas livres)`}
                        </option>
                      )
                    })}
                  </select>
                  {isTimeFull && !editDialog.isLocked && <p className="text-[10px] text-red-500 mt-2 font-bold flex items-center gap-1.5 bg-red-50 p-2 rounded-lg border border-red-100"><AlertCircle className="w-3.5 h-3.5"/> Horário com capacidade máxima (4 alunos).</p>}
                </div>

                <div>
                  <div className="flex justify-between items-end mb-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Instrutor(a)</label>
                    {isInstructorFull && <span className="text-[10px] font-black text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Limite da Doutora</span>}
                  </div>
                  <select 
                    value={editDialog.instructor}
                    onChange={(e) => setEditDialog({...editDialog, instructor: e.target.value})}
                    className={`w-full p-3 border rounded-xl focus:ring-2 focus:outline-none bg-white font-medium ${isInstructorFull ? 'border-red-300 focus:ring-red-400 text-red-600 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-slate-200 focus:ring-[#0f5c4e] text-slate-800'}`}
                  >
                    <option value="Marisa">Dra. Marisa</option>
                    <option value="Loani">Dra. Loani</option>
                  </select>
                  {editDialog.isLocked && <p className="text-[10px] text-orange-600 mt-2 font-bold bg-orange-50 p-2 rounded-lg border border-orange-100">Menos de 24h para a sessão. Apenas a troca de instrutora é permitida.</p>}
                  {isInstructorFull && (
                    <p className="text-[10px] text-red-500 mt-2 font-medium bg-red-50 p-2 rounded-lg border border-red-100">
                      A Dra. <b>{editDialog.instructor}</b> já possui o limite de 2 alunos neste horário. Por favor, escolha a outra instrutora ou altere o horário.
                    </p>
                  )}
                </div>
              </div>
              <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end gap-3 rounded-b-3xl">
                <Button variant="outline" onClick={() => setEditDialog(null)} disabled={isActionProcessing} className="font-bold h-12 px-6">Cancelar</Button>
                <Button 
                  onClick={handleEditSubmit} 
                  disabled={isActionProcessing || isInstructorFull || (!editDialog.isLocked && isTimeFull)} 
                  className={`text-white font-bold h-12 px-8 shadow-md transition-all ${(isActionProcessing || isInstructorFull || (!editDialog.isLocked && isTimeFull)) ? 'bg-slate-300 cursor-not-allowed text-slate-500' : 'bg-[#0f5c4e] hover:bg-[#0a453a]'}`}
                >
                  {isActionProcessing ? 'A Salvar...' : 'Salvar Alteração'}
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {confirmDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="p-8">
              <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-amber-100">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-3">{confirmDialog.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{confirmDialog.message}</p>
            </div>
            <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-end gap-3 rounded-b-3xl">
              <Button variant="outline" onClick={() => !isActionProcessing && setConfirmDialog(null)} disabled={isActionProcessing} className="font-bold h-12 px-6 border-slate-200">
                Cancelar
              </Button>
              <Button onClick={confirmDialog.action} disabled={isActionProcessing} className={`text-white font-bold h-12 px-8 shadow-md transition-all ${isActionProcessing ? 'bg-slate-400' : 'bg-[#0f5c4e] hover:bg-[#0a453a]'}`}>
                {isActionProcessing ? 'A Processar...' : 'Confirmar Ação'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {evolutionDialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl h-[85vh] sm:h-[80vh] flex flex-col animate-in zoom-in-95 duration-200 border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
                  <Stethoscope className="w-6 h-6 text-[#0f5c4e]" /> Registo de Prontuário
                </h3>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Sessão Finalizada</p>
              </div>
              <button onClick={() => setEvolutionDialog(null)} className="w-10 h-10 flex items-center justify-center bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-full transition-colors">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="w-full md:w-80 bg-slate-50/50 border-r border-slate-100 flex flex-col overflow-y-auto no-scrollbar p-4 gap-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-2">Alunos da Sessão</p>
                {evolutionDialog.appts.map(appt => {
                  const isSelected = evolutionDialog.selectedApptId === appt.id
                  const hasData = evolutionDialog.evolutions[appt.id].evolucao.trim() !== "" || evolutionDialog.evolutions[appt.id].observacao.trim() !== ""

                  return (
                    <button 
                      key={appt.id}
                      onClick={() => setEvolutionDialog(prev => ({ ...prev!, selectedApptId: appt.id }))}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-3 ${isSelected ? 'bg-white border-[#0f5c4e] shadow-md ring-1 ring-[#0f5c4e]/20' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'}`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0 transition-colors ${isSelected ? 'bg-[#0f5c4e] text-white' : 'bg-slate-100 text-slate-500'}`}>
                        {(appt.client?.name || appt.tempName).charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>{appt.client?.name || appt.tempName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{appt.type.replace(/_/g, ' ')}</p>
                      </div>
                      {hasData && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" title="Prontuário preenchido" />}
                    </button>
                  )
                })}
              </div>

              <div className="flex-1 bg-white p-6 sm:p-8 overflow-y-auto no-scrollbar">
                {evolutionDialog.selectedApptId ? (
                  <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
                    <div className="flex items-center gap-3 mb-8">
                      <div className="w-12 h-12 rounded-full bg-[#0f5c4e]/10 text-[#0f5c4e] flex items-center justify-center font-black text-xl">
                        {(evolutionDialog.appts.find(a => a.id === evolutionDialog.selectedApptId)?.client?.name || 'A').charAt(0)}
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-slate-800">
                          {evolutionDialog.appts.find(a => a.id === evolutionDialog.selectedApptId)?.client?.name || 'Visitante'}
                        </h4>
                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                          <Activity className="w-3 h-3" /> Registar evolução clínica desta sessão
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                        <FileText className="w-4 h-4 text-[#0f5c4e]" /> Evolução
                      </label>
                      <p className="text-[11px] text-slate-500 font-medium mb-2">Descreva os exercícios realizados, aparelhos utilizados, carga e desempenho físico.</p>
                      <textarea
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-[#0f5c4e] focus:bg-white transition-all outline-none min-h-[140px] resize-none placeholder:text-slate-300 shadow-inner"
                        placeholder="Ex: Foram realizados alongamentos no Cadilac, exercícios de fortalecimento no Reformer (molas vermelhas)..."
                        value={evolutionDialog.evolutions[evolutionDialog.selectedApptId]?.evolucao || ''}
                        onChange={e => setEvolutionDialog(prev => ({
                          ...prev!,
                          evolutions: {
                            ...prev!.evolutions,
                            [prev!.selectedApptId!]: { ...prev!.evolutions[prev!.selectedApptId!], evolucao: e.target.value }
                          }
                        }))}
                      />
                    </div>

                    <div className="space-y-2 pt-4">
                      <label className="flex items-center gap-2 text-sm font-black text-slate-700">
                        <AlertCircle className="w-4 h-4 text-amber-500" /> Observações / Queixas
                      </label>
                      <p className="text-[11px] text-slate-500 font-medium mb-2">Registe dores, limitações, humor ou observações importantes para a próxima sessão.</p>
                      <textarea
                        className="w-full bg-amber-50/30 border border-amber-200/50 rounded-2xl p-4 text-sm font-medium focus:ring-2 focus:ring-amber-400 focus:bg-amber-50/50 transition-all outline-none min-h-[100px] resize-none placeholder:text-amber-700/30 shadow-inner"
                        placeholder="Ex: Paciente relatou dor lombar moderada ao iniciar a sessão. Evitar excesso de carga na próxima aula."
                        value={evolutionDialog.evolutions[evolutionDialog.selectedApptId]?.observacao || ''}
                        onChange={e => setEvolutionDialog(prev => ({
                          ...prev!,
                          evolutions: {
                            ...prev!.evolutions,
                            [prev!.selectedApptId!]: { ...prev!.evolutions[prev!.selectedApptId!], observacao: e.target.value }
                          }
                        }))}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
                    <Users className="w-16 h-16 text-slate-400 mb-4" />
                    <p className="text-slate-500 font-bold">Selecione um paciente na lista ao lado.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-5 border-t border-slate-100 flex justify-end gap-3 shrink-0 rounded-b-[2rem]">
              <Button variant="outline" onClick={() => setEvolutionDialog(null)} className="font-bold px-8 h-12 border-slate-200 hover:bg-slate-50 text-slate-600">Cancelar</Button>
              <Button onClick={submitEvolutions} disabled={isSubmitting} className="bg-[#0f5c4e] text-white hover:bg-[#0a453a] font-bold px-8 h-12 shadow-lg">
                {isSubmitting ? 'A Gravar...' : 'Salvar Prontuários e Concluir Sessão'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 animate-in fade-in duration-300 relative pb-32">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <Button variant="outline" size="icon" onClick={prevWeek} className="h-10 w-10 shrink-0 border-slate-200"><ChevronLeft className="h-5 w-5" /></Button>
            <div className="text-center flex-1 sm:min-w-[200px]">
              <h2 className="text-lg font-black text-slate-800 capitalize">{format(weekStart, 'MMMM yyyy', { locale: ptBR })}</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Semana: {format(weekStart, 'dd/MM')} - {format(addDays(weekStart, 6), 'dd/MM')}</p>
            </div>
            <Button variant="outline" size="icon" onClick={nextWeek} className="h-10 w-10 shrink-0 border-slate-200"><ChevronRight className="h-5 w-5" /></Button>
          </div>
          
          <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end">
            <div className="relative">
              <Button variant="outline" className="font-bold bg-white border-slate-200 text-slate-700 h-9 relative overflow-hidden group hover:border-[#0f5c4e] hover:text-[#0f5c4e]">
                <CalendarIcon className="w-4 h-4 mr-2 text-[#0f5c4e] group-hover:scale-110 transition-transform" />
                Escolher Data
                <input type="date" onChange={handleDateSelect} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" title="Pular para uma data específica" />
              </Button>
            </div>
            <Button onClick={goToToday} variant="secondary" className="font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 h-9">
              Hoje
            </Button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {weekDays.map((day) => {
            const isActive = activeDayIndex === day.index
            const isCurrentToday = isToday(day.date)
            return (
              <button key={day.index} onClick={() => setActiveDayIndex(day.index)} className={`flex flex-col items-center justify-center flex-1 min-w-[65px] py-3 rounded-2xl border transition-all ${isActive ? 'bg-[#0f5c4e] border-[#0f5c4e] text-white shadow-md scale-105' : isCurrentToday ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isActive ? 'text-emerald-100' : ''}`}>{day.shortName}</span>
                <span className="text-xl font-black">{day.dayNumber}</span>
              </button>
            )
          })}
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-4 sm:p-8">
            <div className="space-y-6 sm:space-y-8 relative">
              {hours.map(hour => {
                const rawApptsInSlot = dailyAppointments.filter(app => format(new Date(app.date), 'HH:mm') === hour)
                
                // Mapeia e injeta as variáveis isLastSession
                const apptsInSlot = rawApptsInSlot.map(appt => {
                  let isLastSession = false;
                  let sessionBadge = "";
                  if (appt.type.includes('PILATES_') && appt.client?.plan) {
                      const cycleStart = appt.client.planLastPayment ? new Date(appt.client.planLastPayment).getTime() : 0;
                      const clientAppts = initialAppointments.filter(a => 
                          a.clientId === appt.clientId && 
                          a.type.includes('PILATES_') && 
                          a.status !== 'CANCELADO' &&
                          new Date(a.date).getTime() >= cycleStart
                      ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                      
                      const idx = clientAppts.findIndex(a => a.id === appt.id);
                      if (idx !== -1 && appt.client.totalSessions) {
                          sessionBadge = ` (${idx + 1}/${appt.client.totalSessions})`;
                          if (idx + 1 === appt.client.totalSessions) {
                              isLastSession = true;
                          }
                      }
                  }
                  return { ...appt, _isLastSession: isLastSession, _sessionBadge: sessionBadge };
                });

                const isRoomActive = activeRoomHour === hour
                const pendingAppts = apptsInSlot.filter(a => a.status !== 'CANCELADO' && a.status !== 'REALIZADO')

                return (
                  <div key={hour} className="flex flex-col gap-2 relative group/row">
                    
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 relative">
                      <div 
                        className={`w-24 shrink-0 flex flex-col items-center sm:items-end pt-1 relative z-10 bg-white sm:pr-4 transition-all ${apptsInSlot.length > 0 ? 'cursor-pointer hover:scale-105 origin-right' : ''}`}
                        onClick={() => apptsInSlot.length > 0 && setActiveRoomHour(isRoomActive ? null : hour)}
                      >
                        <span className={`text-xl font-black transition-colors ${isRoomActive ? 'text-[#0f5c4e]' : 'text-slate-800'}`}>{hour}</span>
                        
                        <span className={`text-[9px] font-black uppercase ${apptsInSlot.length > 4 ? 'text-red-500' : 'text-slate-400'}`}>
                          {apptsInSlot.length}/4 Vagas
                        </span>
                        
                        {apptsInSlot.length > 0 && !isRoomActive && (
                          <div className="mt-2 opacity-0 group-hover/row:opacity-100 transition-all bg-[#0f5c4e] text-white text-[10px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap hidden sm:flex items-center gap-1 z-30">
                            <Users className="w-3 h-3" /> Gerir Turma
                          </div>
                        )}
                      </div>

                      <div className="hidden sm:block absolute left-[96px] top-0 bottom-[-32px] w-px bg-slate-100 group-hover/row:bg-[#0f5c4e]/20 transition-colors z-0"></div>

                      {!isRoomActive && (
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-[60px] pl-0 sm:pl-2 animate-in fade-in duration-300">
                          {apptsInSlot.length === 0 ? (
                            <div className="flex items-center justify-center sm:justify-start text-sm text-slate-300 font-bold italic py-4">Nenhum paciente marcado</div>
                          ) : (
                            apptsInSlot.map((appt) => {
                              const isCancelado = appt.status === 'CANCELADO'
                              const isRealizado = appt.status === 'REALIZADO'
                              const isFalta = appt.status === 'FALTA'

                              const diffHoras = (new Date(appt.date).getTime() - new Date().getTime()) / (1000 * 60 * 60)
                              const isLocked = diffHoras < 24 && diffHoras > -1 

                              const phoneRaw = appt.client?.phone || appt.tempPhone;
                              const cleanPhone = phoneRaw ? phoneRaw.replace(/\D/g, '') : null;
                              const clientFirstName = (appt.client?.name || appt.tempName || 'Paciente').split(' ')[0];
                              const apptTime = format(new Date(appt.date), 'HH:mm');
                              const apptDate = format(new Date(appt.date), 'dd/MM/yyyy');
                              
                              let wppMsg = msgConfirmacao
                                .replace(/\[NOME\]/g, clientFirstName)
                                .replace(/\[HORA\]/g, apptTime)
                                .replace(/\[DATA\]/g, apptDate);
                                
                              const wppUrl = cleanPhone ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(wppMsg)}` : '#';

                              return (
                                <div key={appt.id} className={`group relative p-4 rounded-xl border transition-all ${isCancelado ? 'bg-red-50/40 border-red-100 opacity-50' : isRealizado ? 'bg-emerald-50 border-emerald-100 shadow-sm' : isFalta ? 'bg-slate-100 border-slate-200' : 'bg-white border-slate-200 hover:shadow-md'}`}>
                                  
                                  {appt._isLastSession && !isRealizado && !isCancelado && (
                                    <div className="absolute top-0 right-12 translate-y-[-50%] bg-orange-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm z-30 flex items-center gap-1 border border-white">
                                      <Ticket className="w-2.5 h-2.5"/> Última do Pacote
                                    </div>
                                  )}

                                  <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all bg-white border border-slate-200 p-1.5 rounded-lg shadow-xl z-20 scale-90 group-hover:scale-100">
                                    
                                    {cleanPhone && !isRealizado && !isCancelado && !isFalta && (
                                        <span title="Enviar Lembrete por WhatsApp">
                                          <a href={wppUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 flex text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors border border-transparent hover:border-emerald-100">
                                            <MessageCircle className="w-4 h-4" />
                                          </a>
                                        </span>
                                    )}

                                    {!isRealizado && !isCancelado && (
                                      <span title="Concluir e Evoluir">
                                          <button onClick={() => setConfirmDialog({ title: 'Atenção', message: 'Use o botão de Gerir Turma (à esquerda) para preencher a evolução completa.', action: async () => setConfirmDialog(null) })} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors border border-transparent hover:border-emerald-100"><CheckCircle2 className="w-4 h-4" /></button>
                                      </span>
                                    )}
                                    
                                    <span title={isLocked ? "Edição de Data bloqueada (<24h). Troca de instrutora permitida." : "Editar"}>
                                        <button onClick={() => openEditModal(appt, isLocked)} disabled={isRealizado || isCancelado || isFalta} className={`p-1.5 rounded-md transition-colors ${isRealizado || isCancelado || isFalta ? 'text-slate-300 cursor-not-allowed opacity-50' : 'text-slate-600 hover:bg-slate-100'}`}>
                                          {isLocked ? <User className="w-4 h-4 text-orange-500" /> : <Edit className="w-4 h-4" />}
                                        </button>
                                    </span>

                                    {!isRealizado && !isFalta && !isCancelado && (
                                      <span title="Marcar Falta">
                                          <button onClick={() => handleAction(marcarFaltaAgendamento, appt.id, "Confirmar Falta", "Tem a certeza que o paciente não compareceu e deseja marcar como Falta?")} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"><UserX className="w-4 h-4" /></button>
                                      </span>
                                    )}

                                    {!isRealizado && !isCancelado && (
                                      <span title="Gerar Reposição">
                                        <button onClick={() => handleAction(converterEmReposicao, appt.id, "Gerar Reposição", "O aluno avisou com antecedência? Isso irá adicionar um crédito de reposição e liberar a vaga.")} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded-md transition-colors">
                                          <RotateCcw className="w-4 h-4" />
                                        </button>
                                      </span>
                                    )}

                                    <span title="Cancelar">
                                        <button onClick={() => handleAction(cancelarAgendamento, appt.id, "Cancelar Sessão", "Deseja cancelar a aula?")} className="p-1.5 text-red-400 hover:bg-red-50 rounded-md"><XCircle className="w-4 h-4" /></button>
                                    </span>

                                    <span title="Excluir Permanentemente">
                                        <button onClick={() => handleAction(deletarAgendamento, appt.id, "Excluir Agendamento", "Atenção: Esta ação apagará permanentemente o registo do banco de dados. Deseja continuar?")} className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </span>
                                  </div>

                                  <div className="flex justify-between items-start mb-2.5 gap-2 pr-10">
                                    <h4 className={`font-bold text-sm truncate ${isCancelado || isFalta ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                      {appt.client?.name || appt.tempName}
                                    </h4>
                                    <div className="flex gap-1 shrink-0 items-center">
                                      {isLocked && !isRealizado && !isCancelado && <span title="Bloqueado para alterações de Data (Regra 24h)"><Lock className="w-3 h-3 text-slate-300" /></span>}
                                      {isFalta && <span className="text-[8px] font-black bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full uppercase">Falta</span>}
                                      {isRealizado && <span className="text-[8px] font-black bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full uppercase">Concluído</span>}
                                      {isCancelado && <span className="text-[8px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase">Cancelado</span>}
                                    </div>
                                  </div>
                                  
                                  <div className="flex flex-col gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-500">
                                    <span className="flex items-center gap-1.5 bg-slate-50 w-fit px-2 py-0.5 rounded-md border border-slate-100">
                                      <Activity className="w-3 h-3 text-[#0f5c4e]" />
                                      {appt.type.replace(/_/g, ' ')}
                                      {appt._sessionBadge && <span className="text-[#0f5c4e] font-black">{appt._sessionBadge}</span>}
                                    </span>
                                    <span className="flex items-center gap-1.5 px-2 italic">
                                      <User className="w-3 h-3 opacity-60" />
                                      Dr(a). {appt.instructor}
                                    </span>
                                  </div>
                                </div>
                              )
                            })
                          )}
                        </div>
                      )}

                      {isRoomActive && apptsInSlot.length > 0 && (
                        <div className="flex-1 bg-white border-2 border-[#0f5c4e] rounded-2xl p-5 sm:p-7 shadow-[0_10px_30px_rgba(15,92,78,0.15)] animate-in slide-in-from-right-4 duration-300 relative z-20 ml-0 sm:ml-2">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                            <div>
                              <h4 className="font-black text-xl text-[#0f5c4e] flex items-center gap-2"><Users className="w-6 h-6" /> Sala Virtual - {hour}</h4>
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Check-in de Pacientes</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setActiveRoomHour(null)} className="h-9 font-bold text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg">
                              <CloseIcon className="w-4 h-4 mr-1.5" /> Fechar
                            </Button>
                          </div>

                          <div className="space-y-3 mb-6">
                            {pendingAppts.map(appt => (
                              <label key={appt.id} className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${presentStudents.includes(appt.id) ? 'bg-emerald-50/50 border-[#0f5c4e]/40 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}>
                                <Checkbox 
                                  checked={presentStudents.includes(appt.id)} 
                                  onCheckedChange={() => toggleStudentPresence(appt.id)} 
                                  className="data-[state=checked]:bg-[#0f5c4e] data-[state=checked]:border-[#0f5c4e] w-6 h-6 rounded-md mt-1"
                                />
                                <div className="flex-1">
                                  <p className={`text-base font-black ${presentStudents.includes(appt.id) ? 'text-[#0f5c4e]' : 'text-slate-700'}`}>{appt.client?.name || appt.tempName}</p>
                                  <p className="text-xs text-slate-500 font-medium mt-0.5">Instrutor(a): {appt.instructor}</p>
                                  {appt._isLastSession && (
                                    <p className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100 w-fit mt-1.5 flex items-center gap-1.5">
                                      <AlertCircle className="w-3.5 h-3.5" /> Atenção: Esta é a última aula do pacote atual.
                                    </p>
                                  )}
                                </div>
                                {presentStudents.includes(appt.id) && <span className="text-[10px] font-black text-[#0f5c4e] bg-[#0f5c4e]/10 px-3 py-1.5 rounded-lg uppercase tracking-widest animate-in zoom-in-50">Presente</span>}
                              </label>
                            ))}
                            {pendingAppts.length === 0 && (
                              <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100">
                                <CheckCircle2 className="w-8 h-8 text-[#0f5c4e]/40 mx-auto mb-2" />
                                <p className="text-sm font-bold text-slate-500">Todos os alunos desta turma já foram concluídos.</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3 pt-5 border-t border-slate-100">
                            {timerHour !== hour ? (
                              <Button onClick={() => startClass(hour)} disabled={isTimerRunning || pendingAppts.length === 0} className="bg-slate-900 hover:bg-slate-800 text-white flex-1 font-bold h-14 rounded-xl shadow-md text-sm">
                                <Play className="w-5 h-5 mr-2" /> Iniciar Sessão e Cronómetro
                              </Button>
                            ) : (
                              <div className="flex-1 flex gap-3">
                                <Button onClick={() => handleFinishClassRequest(apptsInSlot.filter(a => presentStudents.includes(a.id)))} disabled={presentStudents.length === 0} className="bg-[#0f5c4e] hover:bg-[#0a453a] text-white flex-1 font-bold h-14 rounded-xl shadow-lg text-sm">
                                  <CheckCircle2 className="w-5 h-5 mr-2" /> Finalizar Sessão
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}