"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { ClientHeader } from "@/components/client-header"
import { EvolutionTimeline } from "@/components/evolution-timeline"
import { EvolutionEditor } from "@/components/evolution-editor"
import { ClientInfoSections } from "@/components/client-info-sections"

// Mock data
const mockClient = {
  name: "Maria Silva",
  status: "ativo" as const,
  plan: "Plano Mensal - 3x por semana",
  phone: "(11) 99999-9999",
  email: "maria.silva@email.com",
  memberSince: "Janeiro 2024",
}

const mockEvolutions = [
  {
    id: "1",
    date: "25 Mar 2026",
    time: "09:30",
    professional: "Dr. Marcos Rodrigues",
    summary:
      "Paciente relata melhora significativa nas dores lombares. Realizamos exercícios de fortalecimento do core e alongamento da cadeia posterior.",
    details:
      "Sessão completa com foco em estabilização lombar. Paciente conseguiu realizar todos os exercícios propostos sem queixas de dor durante a execução.",
  },
  {
    id: "2",
    date: "22 Mar 2026",
    time: "09:30",
    professional: "Dr. Marcos Rodrigues",
    summary:
      "Ajuste no protocolo de exercícios. Adicionamos exercícios de mobilidade torácica conforme avaliação.",
    details: "",
  },
  {
    id: "3",
    date: "18 Mar 2026",
    time: "09:30",
    professional: "Dra. Ana Costa",
    summary:
      "Primeira sessão após reavaliação. Paciente apresentou boa resposta aos estímulos proprioceptivos.",
    details: "",
  },
  {
    id: "4",
    date: "15 Mar 2026",
    time: "10:00",
    professional: "Dr. Marcos Rodrigues",
    summary:
      "Reavaliação trimestral. Ganho de 15% na flexibilidade e 20% na força do core comparado à avaliação anterior.",
    details: "",
  },
  {
    id: "5",
    date: "11 Mar 2026",
    time: "09:30",
    professional: "Dr. Marcos Rodrigues",
    summary:
      "Sessão regular com foco em exercícios respiratórios e alinhamento postural.",
    details: "",
  },
]

const mockMedicalHistory = {
  mainComplaint: "Dor lombar crônica há 2 anos, com irradiação para membro inferior esquerdo em momentos de crise.",
  previousConditions: ["Hérnia discal L4-L5", "Escoliose leve", "Tendinite no ombro direito (resolvida)"],
  medications: ["Dorflex (quando necessário)", "Vitamina D"],
  allergies: ["Dipirona"],
  objectives: "Redução da dor lombar, melhora da postura e fortalecimento muscular para prevenção de novas crises.",
}

const mockExams = [
  { id: "1", name: "Ressonância Magnética - Coluna Lombar", date: "10 Jan 2024", type: "pdf" as const },
  { id: "2", name: "Raio-X - Coluna Total", date: "05 Jan 2024", type: "image" as const },
  { id: "3", name: "Laudo Médico - Ortopedista", date: "12 Jan 2024", type: "pdf" as const },
]

const mockAttendance = {
  totalSessions: 24,
  attendedSessions: 21,
  lastAttendance: "25 Mar 2026",
}

export default function ClientProfilePage() {
  const [selectedEvolutionId, setSelectedEvolutionId] = useState(mockEvolutions[0].id)

  const handleSaveEvolution = (content: string) => {
    console.log("Saving evolution:", content)
    // Here you would save to the database
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      {/* Main Content */}
      <main className="pl-64 transition-all duration-300">
        <div className="mx-auto max-w-7xl px-8 py-10">
          {/* Client Header */}
          <ClientHeader client={mockClient} />

          {/* Three Column Layout */}
          <div className="mt-8 grid grid-cols-12 gap-6">
            {/* Left: Timeline */}
            <div className="col-span-12 lg:col-span-3">
              <EvolutionTimeline
                evolutions={mockEvolutions}
                selectedId={selectedEvolutionId}
                onSelect={setSelectedEvolutionId}
              />
            </div>

            {/* Center: Editor */}
            <div className="col-span-12 lg:col-span-5">
              <EvolutionEditor onSave={handleSaveEvolution} />
            </div>

            {/* Right: Info Sections */}
            <div className="col-span-12 lg:col-span-4">
              <ClientInfoSections
                medicalHistory={mockMedicalHistory}
                exams={mockExams}
                attendance={mockAttendance}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
