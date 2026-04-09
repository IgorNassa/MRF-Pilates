"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

// Recebe os agendamentos reais através de props
export function CalendarOverview({ appointments = [] }: { appointments?: any[] }) {
  const hours = ["07:30", "08:30", "09:30", "10:30", "11:30", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"]
  const hoje = new Date()

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
      
      {/* Cabeçalho da Agenda */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-start mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Agenda de Hoje</h2>
          <p className="text-sm text-slate-500 capitalize mt-1">
            {format(hoje, "EEEE, d 'De' MMMM", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-5 text-sm font-medium text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#0f5c4e]"></div>
            Dra. Marisa
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#7dd3fc]"></div>
            Dra. Loani
          </div>
        </div>
      </div>

      {/* Linha do Tempo e Cartões */}
      <div className="space-y-4">
        {hours.map(hour => {
          // Filtra quem está marcado para esta hora específica
          const apptsInHour = appointments.filter(a => {
            const d = new Date(a.date);
            return format(d, "HH:mm") === hour;
          });

          return (
            <div key={hour} className="flex gap-4 items-start">
              
              {/* Hora do lado esquerdo */}
              <div className="w-12 text-sm font-semibold text-slate-600 pt-3 shrink-0 text-right">
                {hour}
              </div>
              
              {/* Bloco dos cartões */}
              <div className="flex-1 flex flex-col sm:flex-row gap-3">
                {apptsInHour.length === 0 ? (
                  <div className="w-full border border-dashed border-slate-300 rounded-xl p-4 text-center text-sm text-slate-400 font-medium">
                    Horário disponível
                  </div>
                ) : (
                  apptsInHour.map(a => (
                    <div 
                      key={a.id} 
                      // Aplica a cor de fundo com base no nome do instrutor
                      className={`flex-1 p-4 rounded-xl border ${
                        a.instructor === 'Marisa' 
                          ? 'bg-[#eef8f6] border-[#cae8e1]' 
                          : 'bg-[#f0f9ff] border-[#bae6fd]'
                      }`}
                    >
                      <p className="font-bold text-sm text-slate-800 truncate">{a.clientName}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {a.type.replace(/_/g, ' ')} • {a.instructor === 'Marisa' ? 'Sala 1' : 'Sala 2'}
                      </p>
                    </div>
                  ))
                )}
              </div>

            </div>
          )
        })}
      </div>

    </div>
  )
}