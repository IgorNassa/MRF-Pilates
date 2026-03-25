"use client"

import { cn } from "@/lib/utils"

interface Appointment {
  id: string
  time: string
  client: string
  professional: string
  room: string
  type: string
}

const mockAppointments: Appointment[] = [
  { id: "1", time: "08:00", client: "Maria Silva", professional: "Dr. Marcos", room: "Sala 1", type: "Pilates" },
  { id: "2", time: "09:00", client: "João Santos", professional: "Dra. Ana", room: "Sala 2", type: "Fisioterapia" },
  { id: "3", time: "10:00", client: "Ana Costa", professional: "Dr. Marcos", room: "Sala 1", type: "Pilates" },
  { id: "4", time: "11:00", client: "Pedro Lima", professional: "Dra. Ana", room: "Sala 2", type: "RPG" },
  { id: "5", time: "14:00", client: "Carla Souza", professional: "Dr. Marcos", room: "Sala 1", type: "Pilates" },
  { id: "6", time: "15:00", client: "Lucas Oliveira", professional: "Dra. Ana", room: "Sala 2", type: "Fisioterapia" },
]

const timeSlots = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"]

export function CalendarOverview() {
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Agenda de Hoje</h2>
          <p className="text-sm text-muted-foreground capitalize">{today}</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Dr. Marcos</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-accent" />
            <span className="text-xs text-muted-foreground">Dra. Ana</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {timeSlots.map((time) => {
          const appointments = mockAppointments.filter((apt) => apt.time === time)
          return (
            <div key={time} className="flex gap-4">
              <span className="w-12 flex-shrink-0 text-xs font-medium text-muted-foreground py-3">
                {time}
              </span>
              <div className="flex-1 grid grid-cols-2 gap-3">
                {appointments.length > 0 ? (
                  appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className={cn(
                        "rounded-xl px-4 py-3 transition-all duration-200 hover:shadow-md cursor-pointer",
                        apt.professional === "Dr. Marcos"
                          ? "bg-primary/10 border border-primary/20 hover:bg-primary/15"
                          : "bg-accent/20 border border-accent/30 hover:bg-accent/30"
                      )}
                    >
                      <p className="text-sm font-medium text-foreground">{apt.client}</p>
                      <p className="text-xs text-muted-foreground">
                        {apt.type} • {apt.room}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 rounded-xl border border-dashed border-border py-3 text-center">
                    <span className="text-xs text-muted-foreground/50">Horário disponível</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
