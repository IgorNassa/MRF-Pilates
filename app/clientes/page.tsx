"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Sidebar } from "@/components/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter, Trash2, Edit, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ClientModal } from "@/components/client-modal"
import { getClients, deleteClient } from "@/lib/actions"

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case "ativo": return "bg-primary/10 text-primary border-primary/20"
    case "inativo": return "bg-muted text-muted-foreground border-muted"
    case "pausado": return "bg-accent/20 text-accent-foreground border-accent/30"
    default: return "bg-muted text-muted-foreground"
  }
}

const getInitials = (name: string) => name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "??"

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Estados para Filtro e Busca
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("todos")

  // Estados para Exclusão (Dupla Verificação)
  const [clientToDelete, setClientToDelete] = useState<any | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Estado para Edição (Próximo passo)
  const [clientToEdit, setClientToEdit] = useState<any | null>(null)

  const loadClients = async () => {
    setIsLoading(true)
    try {
      const data = await getClients()
      setClients(data)
    } catch (error) {
      console.error("Erro ao buscar clientes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadClients() }, [])

  const handleModalClose = () => {
    setIsModalOpen(false)
    setClientToEdit(null)
    loadClients() 
  }

  // Função que apaga de verdade após confirmação
  const confirmDelete = async () => {
    if (!clientToDelete) return
    setIsDeleting(true)
    await deleteClient(clientToDelete.id)
    setClientToDelete(null)
    setIsDeleting(false)
    loadClients()
  }

  // MOTOR DE BUSCA E FILTRO EM TEMPO REAL
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          client.phone.includes(searchQuery) || 
                          (client.documento && client.documento.includes(searchQuery))
    
    const matchesFilter = statusFilter === "todos" || client.status.toLowerCase() === statusFilter

    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="pt-16 lg:pt-0 lg:pl-64 transition-all duration-300">
        <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 sm:py-10">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Pacientes & Alunos</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isLoading ? "A carregar..." : `${filteredClients.length} encontrados`}
              </p>
            </div>
            
            <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 w-full sm:w-auto shadow-md">
              <Plus className="h-4 w-4" /> Novo Cadastro
            </Button>
          </div>

          {/* RADAR DE EVASÃO (CHURN) */}
          {filteredClients.filter(c => c.status === "pausado" || c.status === "inativo").length > 0 && (
            <div className="mb-8 p-5 rounded-2xl bg-orange-500/10 border border-orange-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/20">
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-orange-700 dark:text-orange-400">Radar de Evasão</h3>
                  <p className="text-sm text-orange-600/80 dark:text-orange-300/80">Estes alunos estão ausentes. Um "Oi" agora pode resgatá-los!</p>
                </div>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-orange-500/20">
                {filteredClients.filter(c => c.status === "pausado" || c.status === "inativo").map(atRisk => {
                  // Prepara o link do WhatsApp com mensagem pronta
                  const number = atRisk.phone.replace(/\D/g, '');
                  const message = encodeURIComponent(`Olá ${atRisk.name.split(' ')[0]}, aqui é da MRF Pilates! Sentimos a sua falta esta semana. Está tudo bem com você?`);
                  const waLink = `https://wa.me/55${number}?text=${message}`;

                  return (
                    <div key={`radar-${atRisk.id}`} className="min-w-[280px] bg-card border border-orange-500/20 p-4 rounded-xl flex flex-col gap-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-orange-500/30">
                          {atRisk.fotoPerfil ? <img src={atRisk.fotoPerfil} /> : <AvatarFallback className="bg-orange-500/10 text-orange-600">{getInitials(atRisk.name)}</AvatarFallback>}
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm truncate">{atRisk.name}</p>
                          <p className="text-xs text-muted-foreground">Status: {atRisk.status}</p>
                        </div>
                      </div>
                      <a href={waLink} target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                        Mandar Mensagem
                      </a>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* BARRA DE PESQUISA E FILTROS */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CPF ou telefone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border w-full shadow-sm"
              />
            </div>
            
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-card px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring shadow-sm cursor-pointer"
            >
              <option value="todos">Todos os Status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
              <option value="pausado">Pausados</option>
            </select>
          </div>

          {/* LISTA DE CLIENTES */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="p-10 text-center text-muted-foreground animate-pulse">A sincronizar prontuários...</div>
              ) : filteredClients.length === 0 ? (
                <div className="p-10 text-center text-muted-foreground">Nenhum paciente encontrado com estes filtros.</div>
              ) : (
                filteredClients.map((client) => (
                  <div key={client.id} className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-5 transition-colors hover:bg-muted/30">
                    
                    {/* Área Clicável (Leva para o perfil) */}
                    <Link href={`/clientes/${client.id}`} className="flex items-center gap-4 w-full sm:w-auto flex-1 cursor-pointer">
                      <Avatar className="h-12 w-12 border border-primary/20 shrink-0">
                        {client.fotoPerfil ? (
                           <img src={client.fotoPerfil} alt={client.name} className="h-full w-full object-cover" />
                        ) : (
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {getInitials(client.name)}
                          </AvatarFallback>
                        )}
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">{client.name}</p>
                          <Badge variant="outline" className={`${getStatusColor(client.status)} capitalize text-[10px] sm:text-xs shrink-0 font-bold tracking-wide`}>
                            {client.status}
                          </Badge>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate font-medium">
                          {client.plan} • {client.phone}
                        </p>
                      </div>
                    </Link>

                    {/* Botões de Ação Rápida (Aparecem no Hover ou são fixos no mobile) */}
                    <div className="flex items-center gap-2 justify-end sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          setClientToEdit(client)
                          setIsModalOpen(true)
                        }}
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full h-9 w-9"
                        title="Editar Ficha"
                      >
                        <Edit className="h-4.5 w-4.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setClientToDelete(client)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full h-9 w-9"
                        title="Excluir Paciente"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </Button>
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* MODAL DE DUPLA VERIFICAÇÃO (EXCLUSÃO) */}
      {clientToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl border border-destructive/30 animate-in zoom-in-95">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold text-center text-foreground">Excluir Prontuário?</h2>
            <p className="mt-2 text-sm text-center text-muted-foreground">
              Você está prestes a excluir permanentemente a ficha de <strong className="text-foreground">{clientToDelete.name}</strong>. Esta ação não pode ser desfeita e apagará todas as evoluções e PDFs anexados.
            </p>
            <div className="flex gap-3 mt-8">
              <Button type="button" variant="outline" onClick={() => setClientToDelete(null)} className="flex-1 rounded-xl h-11 font-semibold">
                Cancelar
              </Button>
              <Button type="button" onClick={confirmDelete} disabled={isDeleting} className="flex-1 rounded-xl h-11 bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold shadow-md">
                {isDeleting ? "A excluir..." : "Sim, Excluir"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      <ClientModal 
        isOpen={isModalOpen} 
        onClose={handleModalClose} 
        clientData={clientToEdit} // Preparado para o próximo passo!
      />
    </div>
  )
}