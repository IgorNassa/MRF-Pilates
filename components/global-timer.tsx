// components/global-timer.tsx
'use client'

import { useTimer } from '@/hooks/use-timer'
import { Play, Pause, Square, Minimize2 } from 'lucide-react'
import { Button } from './ui/button'

export function GlobalTimer() {
  const { timerSeconds, isTimerRunning, timerHour, isTimerMinimized, setIsTimerMinimized, stopClass, toggleTimer, formatTime } = useTimer()

  if (!timerHour) return null

  // ==========================================
  // ESTADO RECOLHIDO: "A Pílula Flutuante" (Minimalista)
  // ==========================================
  if (isTimerMinimized) {
    return (
      <div
        onClick={() => setIsTimerMinimized(false)}
        className="fixed z-[9999] bottom-6 right-6 md:bottom-8 md:right-8 bg-white h-14 pl-2 pr-5 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200 flex items-center gap-3 cursor-pointer hover:scale-105 hover:shadow-[0_8px_30px_rgb(15,92,78,0.15)] transition-all duration-300 group"
      >
        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center p-1.5 border border-slate-100">
           {/* Usa a logo do sistema */}
           <img src="/logo.png" alt="MRF Pilates" className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isTimerRunning ? 'bg-[#0f5c4e] animate-pulse' : 'bg-amber-400'}`}></div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Turma {timerHour}</span>
          </div>
          <span className="text-sm font-black text-slate-800 tabular-nums leading-none tracking-tight mt-0.5">
            {formatTime(timerSeconds)}
          </span>
        </div>
      </div>
    )
  }

  // ==========================================
  // ESTADO EXPANDIDO: Card Limpo e sem bloquear a tela
  // ==========================================
  return (
    <div className="fixed z-[9999] bottom-6 right-6 md:bottom-8 md:right-8 bg-white border border-slate-200 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] w-80 overflow-hidden animate-in slide-in-from-bottom-8 duration-300">
      
      {/* Cabeçalho do Card */}
      <div className="px-6 py-5 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo MRF" className="w-8 h-8 object-contain" />
          <div>
            <h3 className="text-slate-800 font-black text-sm leading-tight">Sessão Ativa</h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isTimerRunning ? 'bg-[#0f5c4e] animate-pulse' : 'bg-amber-400'}`}></span>
              Turma das {timerHour}
            </p>
          </div>
        </div>
        <button 
          onClick={() => setIsTimerMinimized(true)} 
          className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-full transition-colors shadow-sm"
          title="Minimizar Cronómetro"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Relógio Central */}
      <div className="px-6 py-10 flex flex-col items-center justify-center bg-white relative">
        {/* Círculos decorativos minimalistas no fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[#0f5c4e]/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className={`relative z-10 text-6xl font-black font-mono tabular-nums tracking-tighter leading-none ${timerSeconds <= 300 ? 'text-red-500 animate-pulse' : 'text-slate-800'}`}>
          {formatTime(timerSeconds)}
        </div>
        <p className="relative z-10 text-slate-400 font-bold mt-4 tracking-widest uppercase text-[10px]">
          Tempo Restante
        </p>
      </div>

      {/* Botões de Ação */}
      <div className="p-5 bg-slate-50/80 border-t border-slate-100 flex gap-3">
        <Button 
          onClick={toggleTimer} 
          className={`flex-1 h-12 text-sm font-black rounded-xl border-none transition-all shadow-sm ${isTimerRunning ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-[#0f5c4e] text-white hover:bg-[#0a453a]'}`}
        >
          {isTimerRunning ? <><Pause className="w-4 h-4 mr-2 fill-current" /> Pausar</> : <><Play className="w-4 h-4 mr-2 fill-current" /> Retomar</>}
        </Button>
        <Button 
          variant="outline" 
          onClick={stopClass} 
          title="Encerrar Cronómetro" 
          className="w-12 h-12 rounded-xl border-slate-200 text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors shadow-sm"
        >
          <Square className="w-4 h-4 fill-current" />
        </Button>
      </div>
    </div>
  )
}