"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient, updateClient, deleteClientDocument } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { X, User, Receipt, FileText, UploadCloud, Stethoscope, AlertCircle, Trash2, Heart, Camera } from "lucide-react"

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  clientData?: any 
}

const validarCPF = (cpf: string) => {
  cpf = cpf.replace(/[^\d]+/g, '')
  if (cpf === '' || cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  let add = 0
  for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i)
  let rev = 11 - (add % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(cpf.charAt(9))) return false
  add = 0; for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i)
  rev = 11 - (add % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(cpf.charAt(10))) return false
  return true
}

export function ClientModal({ isOpen, onClose, clientData }: ClientModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("pessoais")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const fileInputRefGeneral = useRef<HTMLInputElement>(null)
  const fileInputRefExams = useRef<HTMLInputElement>(null)
  const fileInputRefPhoto = useRef<HTMLInputElement>(null)

  const [cpfError, setCpfError] = useState("")
  const [cpfValue, setCpfValue] = useState("")
  const [endereco, setEndereco] = useState({ cep: "", logradouro: "", bairro: "", cidade: "Foz do Iguaçu", uf: "PR" })
  const [fotoPerfilBase64, setFotoPerfilBase64] = useState("")

  const [generalFiles, setGeneralFiles] = useState<File[]>([])
  const [examFiles, setExamFiles] = useState<File[]>([])

  useEffect(() => {
    if (clientData && isOpen) {
      setCpfValue(clientData.documento || "")
      setEndereco({ cep: clientData.cep || "", logradouro: clientData.logradouro || "", bairro: clientData.bairro || "", cidade: clientData.cidade || "Foz do Iguaçu", uf: clientData.uf || "PR" })
      setFotoPerfilBase64(clientData.fotoPerfil || "")
      setGeneralFiles([])
      setExamFiles([])
    } else if (!clientData && isOpen) {
      setCpfValue(""); setFotoPerfilBase64(""); setEndereco({ cep: "", logradouro: "", bairro: "", cidade: "Foz do Iguaçu", uf: "PR" }); setGeneralFiles([]); setExamFiles([]);
    }
    setActiveTab("pessoais")
  }, [clientData, isOpen])

  if (!isOpen) return null

  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '')
    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()
        if (!data.erro) setEndereco(prev => ({ ...prev, logradouro: data.logradouro, bairro: data.bairro, cidade: data.localidade, uf: data.uf }))
      } catch (err) {}
    }
  }

  const handleCpfBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (cpfValue.length > 0 && !validarCPF(cpfValue)) setCpfError("CPF inválido.")
    else setCpfError("")
  }

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "").slice(0, 11)
    value = value.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2")
    setCpfValue(value)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'general' | 'exam') => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(file => file.type === 'application/pdf');
      if (type === 'general') setGeneralFiles(prev => [...prev, ...newFiles]);
      else setExamFiles(prev => [...prev, ...newFiles]);
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader(); reader.onloadend = () => setFotoPerfilBase64(reader.result as string); reader.readAsDataURL(file)
    }
  }

  const removeFile = (index: number, type: 'general' | 'exam') => {
    if (type === 'general') setGeneralFiles(prev => prev.filter((_, i) => i !== index));
    else setExamFiles(prev => prev.filter((_, i) => i !== index));
  }

  // ==========================================
  // FUNÇÃO: DELETAR DOCUMENTO DA NUVEM (SUPABASE)
  // ==========================================
  const handleDeleteDoc = async (url: string, type: 'general' | 'exam') => {
    if (!clientData?.id) return
    if (!confirm("Tem certeza que deseja excluir este documento permanentemente?")) return
    
    setIsSubmitting(true)
    try {
      await deleteClientDocument(clientData.id, url, type)
      alert("Documento excluído com sucesso!")
      router.refresh()
      onClose() // Fecha o modal para forçar a atualização visual dos dados
    } catch (error) {
      alert("Erro ao excluir o documento.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (cpfError || (cpfValue.length > 0 && !validarCPF(cpfValue))) { setActiveTab("faturamento"); return; }
    
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    formData.set("documento", cpfValue); formData.set("logradouro", endereco.logradouro); formData.set("bairro", endereco.bairro); formData.set("cidade", endereco.cidade); formData.set("uf", endereco.uf); formData.set("fotoPerfil", fotoPerfilBase64)

    // Adiciona os arquivos reais no FormData
    generalFiles.forEach(file => formData.append("general_docs", file));
    examFiles.forEach(file => formData.append("exam_docs", file));

    try {
      if (clientData?.id) { 
        await updateClient(clientData.id, formData) 
      } else { 
        await createClient(formData) 
      }
      router.refresh()
      onClose()
    } catch (error: any) { 
      console.error("Erro ao salvar:", error) 
      alert("Erro ao salvar no banco de dados! Verifique o console.") 
    }
    finally { setIsSubmitting(false) }
  }

  const FileList = ({ files, type }: { files: File[], type: 'general' | 'exam' }) => (
    <div className="space-y-3 mt-6">
      {files.map((file, index) => (
        <div key={index} className="flex items-center gap-3 bg-muted p-3 rounded-xl border border-border animate-in slide-in-from-bottom-2 duration-200">
          <FileText className="h-6 w-6 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => removeFile(index, type)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in duration-300">
      <div className="flex h-full max-h-[90vh] sm:max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl sm:rounded-3xl bg-card shadow-2xl border border-border overflow-hidden transform transition-all duration-300 animate-in zoom-in-95 scale-95 sm:scale-100">
        
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-4 sm:px-6 sm:py-5">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
              {clientData ? `A Editar: ${clientData.name}` : "Novo Prontuário Digital"}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0">
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
          
          <div className="w-full md:w-52 lg:w-64 border-b md:border-b-0 md:border-r border-border bg-muted/10 p-3 sm:p-4 space-y-1.5 sm:space-y-2 overflow-x-auto md:overflow-y-auto flex md:flex-col shrink-0 flex-row">
            {[
              { id: "pessoais", label: "Pessoais", fullLabel: "Dados Pessoais", icon: User, files: 0, error: "" },
              { id: "saude", label: "Saúde", fullLabel: "Saúde & Anamnese", icon: Heart, files: 0, error: "" },
              { id: "faturamento", label: "Faturamento", fullLabel: "Faturamento", icon: Receipt, files: 0, error: cpfError },
              { id: "documentos", label: "Docs", fullLabel: "Docs Gerais (PDF)", icon: FileText, files: generalFiles.length + (clientData?.generalDocsLinks?.length || 0), error: "" },
              { id: "exames", label: "Exames", fullLabel: "Exames & Laudos", icon: Stethoscope, files: examFiles.length + (clientData?.examDocsLinks?.length || 0), error: "" },
            ].map(tab => (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex w-auto md:w-full items-center justify-center md:justify-start gap-2 sm:gap-3.5 rounded-xl px-4 py-2 sm:py-3 text-sm font-semibold transition-all duration-200 group shrink-0 ${activeTab === tab.id ? "bg-primary text-primary-foreground shadow-md scale-[1.02]" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <tab.icon className={`h-5 w-5 shrink-0 ${activeTab === tab.id ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"} transition-colors`} />
                <span className="md:hidden">{tab.label}</span>
                <span className="hidden md:inline">{tab.fullLabel}</span>
                {tab.files > 0 && <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${activeTab === tab.id ? "bg-primary-foreground text-primary" : "bg-primary/10 text-primary"}`}>{tab.files}</span>}
                {tab.error && <AlertCircle className="h-4 w-4 text-destructive ml-auto shrink-0" />}
              </button>
            ))}
          </div>

          <form key={clientData?.id || 'new'} onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-8 relative flex flex-col h-full">
            <input type="file" ref={fileInputRefGeneral} multiple accept=".pdf" onChange={(e) => handleFileChange(e, 'general')} className="hidden" />
            <input type="file" ref={fileInputRefExams} multiple accept=".pdf" onChange={(e) => handleFileChange(e, 'exam')} className="hidden" />
            <input type="file" ref={fileInputRefPhoto} accept="image/*" onChange={handlePhotoChange} className="hidden" />

            {/* ABA 1: PESSOAIS */}
            <div className={`space-y-6 sm:space-y-8 animate-in fade-in duration-300 ${activeTab !== "pessoais" && "hidden"}`}>
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
                <div onClick={() => fileInputRefPhoto.current?.click()} className="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full border-4 border-muted flex items-center justify-center bg-muted/50 cursor-pointer overflow-hidden group transition-all hover:border-primary/50 hover:shadow-md shrink-0">
                  {fotoPerfilBase64 ? ( <img src={fotoPerfilBase64} alt="Perfil" className="h-full w-full object-cover" /> ) : ( <User className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" /> )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Camera className="h-6 w-6 text-white" /></div>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground">Foto de Perfil</h3>
                  <p className="text-sm text-muted-foreground">Clique no círculo para alterar a fotografia.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2">
                {[ { name: "name", label: "Nome Completo *", defaultValue: clientData?.name, required: true }, { name: "email", label: "E-mail", defaultValue: clientData?.email, type: "email" }, { name: "phone", label: "WhatsApp *", defaultValue: clientData?.phone, required: true }, { name: "dataNascimento", label: "Data Nascimento", defaultValue: clientData?.dataNascimento, type: "date" }, ].map(input => (
                  <div key={input.name} className="space-y-1.5 sm:space-y-2 group">
                    <label className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{input.label}</label>
                    <input {...input} className="w-full rounded-xl h-11 sm:h-12 border border-border bg-card p-3.5 focus:ring-2 focus:ring-primary focus:border-primary/50 outline-none transition-all duration-200 hover:bg-muted/30" />
                  </div>
                ))}
                <div className="sm:col-span-2 space-y-1.5 sm:space-y-2 group">
                  <label className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Plano Atual</label>
                  <select name="plan" defaultValue={clientData?.plan} className="w-full rounded-xl h-11 sm:h-12 border border-border bg-card p-3.5 focus:ring-2 focus:ring-primary focus:border-primary/50 outline-none transition-all duration-200 hover:bg-muted/30 cursor-pointer">
                    <option value="Pilates 2x">Pilates 2x</option>
                    <option value="Pilates 3x">Pilates 3x</option>
                    <option value="Fisioterapia">Fisioterapia</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ABA 2: SAÚDE */}
            <div className={`space-y-5 sm:space-y-6 animate-in fade-in duration-300 ${activeTab !== "saude" && "hidden"}`}>
               <div className="space-y-1.5 sm:space-y-2 group">
                  <label className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Contato de Emergência</label>
                  <input name="contatoEmergencia" defaultValue={clientData?.contatoEmergencia} className="w-full rounded-xl h-11 sm:h-12 border border-border bg-card p-3.5 focus:ring-2 focus:ring-primary outline-none transition-all hover:bg-muted/30" placeholder="Ex: Esposo (João) - (45) 98888-8888" />
                </div>
                <div className="space-y-1.5 sm:space-y-2 group">
                  <label className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Queixa Principal / Motivo</label>
                  <textarea name="queixaPrincipal" defaultValue={clientData?.queixaPrincipal} rows={3} className="w-full rounded-xl border border-border bg-card p-3.5 focus:ring-2 focus:ring-primary outline-none transition-all hover:bg-muted/30 resize-none" />
                </div>
                <div className="space-y-1.5 sm:space-y-2 group">
                  <label className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">Alergias / Condições Médicas</label>
                  <textarea name="condicoesMedicas" defaultValue={clientData?.condicoesMedicas} rows={3} className="w-full rounded-xl border border-border bg-card p-3.5 focus:ring-2 focus:ring-primary outline-none transition-all hover:bg-muted/30 resize-none" />
                </div>
            </div>

            {/* ABA 3: FATURAMENTO */}
            <div className={`space-y-5 sm:space-y-6 animate-in fade-in duration-300 ${activeTab !== "faturamento" && "hidden"}`}>
              <div className="grid grid-cols-1 gap-5 sm:gap-6 sm:grid-cols-2">
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-sm font-semibold text-foreground">CPF *</label>
                  <input name="documento" required value={cpfValue} onChange={handleCpfChange} onBlur={handleCpfBlur} className={`w-full h-11 sm:h-12 rounded-xl border p-3.5 outline-none transition-all duration-200 hover:bg-muted/30 ${cpfError ? "border-destructive focus:ring-2 focus:ring-destructive bg-destructive/5" : "border-border focus:ring-2 focus:ring-primary"}`} maxLength={14} />
                  {cpfError && <p className="text-xs text-destructive mt-1.5 font-medium">{cpfError}</p>}
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-sm font-semibold text-foreground">CEP *</label>
                  <input name="cep" required defaultValue={clientData?.cep} onBlur={handleCepBlur} className="w-full h-11 sm:h-12 rounded-xl border border-border bg-card p-3.5 focus:ring-2 focus:ring-primary outline-none transition-all hover:bg-muted/30" maxLength={9} />
                </div>
                <div className="sm:col-span-2 space-y-1.5 sm:space-y-2">
                  <label className="text-sm font-semibold text-foreground">Logradouro (Rua, Av) *</label>
                  <input name="logradouro" required value={endereco.logradouro} onChange={(e) => setEndereco({...endereco, logradouro: e.target.value})} className="w-full h-11 sm:h-12 rounded-xl border border-border bg-card p-3.5 focus:ring-2 focus:ring-primary outline-none transition-all hover:bg-muted/30" />
                </div>
                {[ 
                  { name: "numero", label: "Nº / Comp. *", defaultValue: clientData?.numero || "", required: true }, 
                  { name: "bairro", label: "Bairro *", value: endereco.bairro, onChange: (v: string) => setEndereco({...endereco, bairro: v}), required: true }, 
                  { name: "cidade", label: "Cidade *", value: endereco.cidade, onChange: (v: string) => setEndereco({...endereco, cidade: v}), required: true }, 
                  { name: "uf", label: "UF *", value: endereco.uf, onChange: (v: string) => setEndereco({...endereco, uf: v}), maxLength: 2, required: true }, 
                ].map(input => (
                  <div key={input.name} className="space-y-1.5 sm:space-y-2">
                    <label className="text-sm font-semibold text-foreground">{input.label}</label>
                    {input.onChange ? (
                      <input name={input.name} value={input.value} required={input.required} onChange={(e) => input.onChange!(e.target.value)} className="w-full h-11 sm:h-12 rounded-xl border border-border bg-card p-3.5 focus:ring-2 focus:ring-primary outline-none transition-all hover:bg-muted/30" />
                    ) : (
                      <input name={input.name} defaultValue={input.defaultValue} required={input.required} className="w-full h-11 sm:h-12 rounded-xl border border-border bg-card p-3.5 focus:ring-2 focus:ring-primary outline-none transition-all hover:bg-muted/30" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* ABA 4: DOCUMENTOS GERAIS */}
            <div className={`animate-in fade-in duration-300 ${activeTab !== "documentos" && "hidden"}`}>
              
              {/* Lista de Documentos Antigos na Nuvem */}
              {clientData?.generalDocsLinks && clientData.generalDocsLinks.length > 0 && (
                <div className="mb-6 space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Documentos Salvos na Nuvem</h4>
                  {clientData.generalDocsLinks.map((doc: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                      <a href={doc.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate max-w-[200px] sm:max-w-[300px]">
                        {doc.name || `Documento ${index + 1}`}
                      </a>
                      <button type="button" onClick={() => handleDeleteDoc(doc.url, 'general')} className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div 
                onClick={() => fileInputRefGeneral.current?.click()} 
                className="rounded-2xl border-2 border-dashed border-border/70 bg-muted/20 p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer group hover:bg-primary/5 hover:border-primary/50 hover:shadow-inner"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted border border-border mb-5 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 group-hover:border-primary/30">
                  <UploadCloud className="h-8 w-8 text-muted-foreground transition-colors duration-300 group-hover:text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">Anexar Documentos Gerais</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto group-hover:text-foreground/80">Arraste arquivos ou clique para buscar. Suporta apenas arquivos PDF.</p>
                <Button type="button" variant="outline" className="mt-6 rounded-xl h-11 transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary">
                  Procurar Ficheiros
                </Button>
              </div>
              <FileList files={generalFiles} type="general" />
            </div>

            {/* ABA 5: EXAMES E LAUDOS */}
            <div className={`animate-in fade-in duration-300 ${activeTab !== "exames" && "hidden"}`}>
              
              {/* Lista de Exames Antigos na Nuvem */}
              {clientData?.examDocsLinks && clientData.examDocsLinks.length > 0 && (
                <div className="mb-6 space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground">Exames Salvos na Nuvem</h4>
                  {clientData.examDocsLinks.map((doc: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                      <a href={doc.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate max-w-[200px] sm:max-w-[300px]">
                        {doc.name || `Exame ${index + 1}`}
                      </a>
                      <button type="button" onClick={() => handleDeleteDoc(doc.url, 'exam')} className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div 
                onClick={() => fileInputRefExams.current?.click()} 
                className="rounded-2xl border-2 border-dashed border-border/70 bg-muted/20 p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer group hover:bg-blue-500/5 hover:border-blue-500/50 hover:shadow-inner"
              >
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted border border-border mb-5 transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-500/20 group-hover:border-blue-500/30">
                  <Stethoscope className="h-8 w-8 text-muted-foreground transition-colors duration-300 group-hover:text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground group-hover:text-blue-600 transition-colors">Anexar Exames & Laudos</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm mx-auto group-hover:text-foreground/80">Adicione Raio-X, Ressonâncias e Encaminhamentos em formato PDF.</p>
                <Button type="button" variant="outline" className="mt-6 rounded-xl h-11 transition-all group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
                  Procurar Exames
                </Button>
              </div>
              <FileList files={examFiles} type="exam" />
            </div>

            <div className="mt-auto pt-5 flex justify-end gap-3.5 border-t border-border bg-card shrink-0 animate-in slide-in-from-bottom-3">
              <Button type="button" variant="outline" onClick={onClose} className="rounded-xl h-12 px-7 transition-all hover:bg-muted font-semibold hover:shadow">Cancelar</Button>
              <Button type="submit" disabled={isSubmitting} className="rounded-xl h-12 px-10 shadow-lg font-bold hover:scale-[1.03] transition-all hover:drop-shadow-xl">
                {isSubmitting ? "A Guardar..." : clientData ? "Salvar Alterações" : "Criar Prontuário"}
              </Button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}