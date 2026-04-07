"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import {
  ChevronDown,
  FileText,
  FileImage,
  Stethoscope,
  Activity,
  Heart,
  AlertCircle,
  Calendar,
} from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

function CollapsibleSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </div>
          <span className="font-medium text-foreground">{title}</span>
        </div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="border-t border-border px-5 py-4">{children}</div>
      </div>
    </div>
  )
}

interface MedicalHistoryData {
  mainComplaint: string
  previousConditions: string[]
  medications: string[]
  allergies: string[]
  objectives: string
}

interface ExamData {
  id: string
  name: string
  date: string
  type: "pdf" | "image"
}

interface AttendanceData {
  totalSessions: number
  attendedSessions: number
  lastAttendance: string
}

interface ClientInfoSectionsProps {
  medicalHistory: MedicalHistoryData
  exams: ExamData[]
  attendance: AttendanceData
}

export function ClientInfoSections({
  medicalHistory,
  exams,
  attendance,
}: ClientInfoSectionsProps) {
  const attendanceRate = Math.round(
    (attendance.attendedSessions / attendance.totalSessions) * 100
  )

  return (
    <div className="space-y-3">
      {/* Medical History */}
      <CollapsibleSection
        title="Anamnese"
        icon={<Stethoscope className="h-5 w-5" />}
        defaultOpen={true}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Queixa Principal
            </label>
            <p className="mt-1 text-sm text-foreground">{medicalHistory.mainComplaint}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Condições Prévias
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {medicalHistory.previousConditions.map((condition, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-foreground"
                >
                  <Heart className="h-3 w-3 text-primary" />
                  {condition}
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Medicamentos em Uso
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {medicalHistory.medications.map((med, i) => (
                <span
                  key={i}
                  className="rounded-full bg-accent/20 px-3 py-1 text-xs text-accent-foreground"
                >
                  {med}
                </span>
              ))}
            </div>
          </div>

          {medicalHistory.allergies.length > 0 && (
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Alergias
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {medicalHistory.allergies.map((allergy, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-3 py-1 text-xs text-destructive"
                  >
                    <AlertCircle className="h-3 w-3" />
                    {allergy}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Objetivos do Tratamento
            </label>
            <p className="mt-1 text-sm text-foreground">{medicalHistory.objectives}</p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Attached Exams */}
      <CollapsibleSection
        title="Exames Anexados"
        icon={<FileText className="h-5 w-5" />}
      >
        <div className="space-y-2">
          {exams.map((exam) => (
            <button
              key={exam.id}
              className="flex w-full items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg",
                  exam.type === "pdf" ? "bg-destructive/10" : "bg-accent/20"
                )}
              >
                {exam.type === "pdf" ? (
                  <FileText className="h-5 w-5 text-destructive" />
                ) : (
                  <FileImage className="h-5 w-5 text-accent-foreground" />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">{exam.name}</p>
                <p className="text-xs text-muted-foreground">{exam.date}</p>
              </div>
            </button>
          ))}
        </div>
      </CollapsibleSection>

      {/* Attendance Rate */}
      <CollapsibleSection
        title="Taxa de Presença"
        icon={<Activity className="h-5 w-5" />}
        defaultOpen={true}
      >
        <div className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-3xl font-semibold text-foreground">{attendanceRate}%</p>
              <p className="text-sm text-muted-foreground">
                {attendance.attendedSessions} de {attendance.totalSessions} sessões
              </p>
            </div>
            <div
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                attendanceRate >= 80
                  ? "bg-primary/10 text-primary"
                  : attendanceRate >= 60
                  ? "bg-accent/20 text-accent-foreground"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {attendanceRate >= 80
                ? "Excelente"
                : attendanceRate >= 60
                ? "Regular"
                : "Atenção"}
            </div>
          </div>

          <Progress value={attendanceRate} className="h-2" />

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Última presença: {attendance.lastAttendance}
          </div>
        </div>
      </CollapsibleSection>
    </div>
  )
}
