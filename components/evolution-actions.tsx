"use client"

import { useState } from "react"
import { createEvolution } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Printer, Plus, X, UserCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"

export function EvolutionActions({ clientId, professionalName }: { clientId: string, professionalName: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const [availableTags, setAvailableTags] = useState([
    'Cadillac', 'Reformer', 'Step Chair', 'Ladder Barrel', 'Solo', 'Bola', 'TENS'
  ])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag))
    else setSelectedTags([...selectedTags, tag])
  }

  const removeAvailableTag = (e: React.MouseEvent, tagToRemove: string) => {
    e.stopPropagation() 
    setAvailableTags(availableTags.filter(t => t !== tagToRemove))
    setSelectedTags(selectedTags.filter(t => t !== tagToRemove))
  }

  const addNewTag = (e: React.MouseEvent) => {
    e.preventDefault()
    if (newTag.trim() && !availableTags.includes(newTag.trim())) {
      setAvailableTags([...availableTags, newTag.trim()])
      setSelectedTags([...selectedTags, newTag.trim()])
      setNewTag("")
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSaving(true)
    const formData = new FormData(e.currentTarget)
    
    formData.append("tags", selectedTags.join(", "))

    try {
      await createEvolution(clientId, formData)
      setIsOpen(false)
      setSelectedTags([]) 
    } catch (error) {
      alert("Erro ao salvar evolução.")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex gap-3 print:hidden">
      <Button variant="outline" onClick={() => window.print()} className="rounded-xl gap-2 font-bold hover:bg-primary/10 hover:text-primary transition-colors">
        <Printer className="h-4 w-4" /> Relatório PDF
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="rounded-xl font-bold shadow-md">+ Nova Evolução</Button>
        </DialogTrigger>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>Registrar Evolução do Dia</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            
            {/* NOME DO PROFISSIONAL AUTOMÁTICO E TRAVADO */}
            <div className="space-y-2">
              <label className="text-sm font-bold flex items-center gap-2"><UserCircle className="h-4 w-4"/> Profissional Atendente</label>
              <input type="hidden" name="professional" value={professionalName} />
              <div className="w-full rounded-xl border border-border bg-muted/50 p-3 text-sm font-semibold text-muted-foreground cursor-not-allowed flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                {professionalName}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Assinatura automática vinculada ao seu usuário.</p>
            </div>

            <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border">
              <label className="text-sm font-bold">Equipamentos Utilizados</label>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {availableTags.map(tag => {
                  const isSelected = selectedTags.includes(tag)
                  return (
                    <div 
                      key={tag} 
                      onClick={() => toggleTag(tag)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all shadow-sm ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-muted-foreground border-border hover:border-primary/50'}`}
                    >
                      {tag}
                      <button type="button" onClick={(e) => removeAvailableTag(e, tag)} className={`p-0.5 rounded-full hover:bg-destructive/20 ${isSelected ? 'hover:text-red-200' : 'hover:text-destructive'}`}>
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newTag} 
                  onChange={(e) => setNewTag(e.target.value)} 
                  placeholder="Novo equipamento..." 
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-xs outline-none focus:border-primary"
                  onKeyDown={(e) => { if (e.key === 'Enter') addNewTag(e as any) }}
                />
                <Button type="button" onClick={addNewTag} size="sm" variant="secondary" className="rounded-lg h-auto px-3">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold">Relato Clínico Detalhado *</label>
              <textarea name="details" required rows={5} className="w-full rounded-xl border border-border p-3 text-sm focus:ring-2 focus:ring-primary outline-none resize-none" placeholder="Descreva os exercícios, evolução da dor, queixas do paciente..." />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl">Cancelar</Button>
              <Button type="submit" disabled={isSaving} className="rounded-xl font-bold">{isSaving ? 'Salvando...' : 'Salvar Evolução'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}