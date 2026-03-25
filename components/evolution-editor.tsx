"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Save, Plus } from "lucide-react"

interface EvolutionEditorProps {
  initialContent?: string
  onSave: (content: string) => void
}

export function EvolutionEditor({ initialContent = "", onSave }: EvolutionEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate save delay
    await new Promise((resolve) => setTimeout(resolve, 500))
    onSave(content)
    setIsSaving(false)
  }

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Nova Evolução</h2>
          <p className="text-sm text-muted-foreground capitalize">{today}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setContent("")}
          >
            <Plus className="h-4 w-4" />
            Limpar
          </Button>
          <Button
            size="sm"
            className="gap-2 bg-primary hover:bg-primary/90"
            onClick={handleSave}
            disabled={isSaving || !content.trim()}
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      <div className="p-6">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Descreva a evolução clínica do paciente...

• Observações gerais
• Progressos notados
• Exercícios realizados
• Queixas ou desconfortos
• Orientações para próxima sessão"
          className="min-h-[400px] w-full resize-none rounded-xl border border-border bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all"
        />
      </div>
    </div>
  )
}
