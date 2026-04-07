// app/clientes/[id]/EvolutionList.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserCircle, Edit, Trash2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { atualizarEvolucao, deletarEvolucao } from '@/lib/actions'

export default function EvolutionList({ evolutions }: { evolutions: any[] }) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDescription, setEditDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEditClick = (ev: any) => {
    setEditingId(ev.id)
    setEditDescription(ev.description)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditDescription("")
  }

  const handleSave = async (id: string) => {
    if (!editDescription.trim()) return
    setIsSubmitting(true)
    await atualizarEvolucao(id, editDescription)
    setEditingId(null)
    setIsSubmitting(false)
    router.refresh() // Atualiza a tela
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Tem certeza que deseja excluir permanentemente este registro clínico?")) {
      await deletarEvolucao(id)
      router.refresh()
    }
  }

  if (!evolutions || evolutions.length === 0) {
    return (
      <div className="pl-6 pb-4">
        <p className="text-muted-foreground text-sm italic">
          Nenhuma evolução registrada. Elas aparecerão aqui automaticamente quando uma sessão for concluída na Agenda.
        </p>
      </div>
    )
  }

  const sortedEvolutions = [...evolutions].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return (
    <div className="relative border-l-2 border-muted ml-2 sm:ml-4 space-y-6 sm:space-y-8 pb-4">
      {sortedEvolutions.map((ev: any) => (
        <div key={ev.id} className="relative pl-5 sm:pl-8 animate-in slide-in-from-left-2 group">
          
          {/* Bolinha da Timeline */}
          <div className="absolute -left-[11px] top-1.5 h-5 w-5 rounded-full bg-primary ring-[6px] ring-background"></div>
          
          <div className="bg-muted/20 rounded-2xl p-4 sm:p-6 border border-border/60 hover:border-primary/30 transition-all relative">
            
            {/* Botões de Ação (Aparecem no Hover do mouse) */}
            {editingId !== ev.id && (
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEditClick(ev)} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="Editar">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(ev.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors" title="Excluir">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex flex-col xl:flex-row xl:justify-between xl:items-start mb-3 sm:mb-4 gap-3 pr-12">
              <div>
                <span className="text-sm sm:text-base font-bold text-foreground">
                  {new Date(ev.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-1.5 font-medium">
                  <UserCircle className="h-3.5 w-3.5" /> Resp: {ev.instructor || "Sistema"}
                </p>
              </div>
            </div>
            
            {/* MODO EDIÇÃO VS MODO VISUALIZAÇÃO */}
            {editingId === ev.id ? (
              <div className="space-y-3 mt-2">
                <Textarea 
                  value={editDescription} 
                  onChange={(e) => setEditDescription(e.target.value)} 
                  className="min-h-[100px] text-sm sm:text-base focus-visible:ring-[#0f5c4e]"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={handleCancel} disabled={isSubmitting}>
                    <X className="w-4 h-4 mr-1" /> Cancelar
                  </Button>
                  <Button size="sm" onClick={() => handleSave(ev.id)} disabled={isSubmitting} className="bg-[#0f5c4e] hover:bg-[#0a453a] text-white">
                    <Save className="w-4 h-4 mr-1" /> {isSubmitting ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm sm:text-base text-foreground/90 leading-relaxed whitespace-pre-wrap font-medium">
                {ev.description}
              </p>
            )}

          </div>
        </div>
      ))}
    </div>
  )
}