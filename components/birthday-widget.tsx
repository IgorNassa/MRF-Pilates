import { getClients } from "@/lib/actions"
import { Cake, MessageCircle } from "lucide-react"

export async function BirthdayWidget() {
  const clients = await getClients()
  const today = new Date()
  const currentMonth = today.getMonth() + 1 // JS meses vão de 0 a 11

  // Filtra clientes que fazem aniversário no mês atual
  const birthdayClients = clients.filter(client => {
    if (!client.dataNascimento) return false
    // Assume formato YYYY-MM-DD
    const month = parseInt(client.dataNascimento.split('-')[1]) 
    return month === currentMonth
  })

  if (birthdayClients.length === 0) return null

  return (
    <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4 text-orange-600">
        <Cake className="h-5 w-5" />
        <h3 className="font-bold">Aniversariantes do Mês</h3>
      </div>
      <div className="space-y-3">
        {birthdayClients.map(client => {
          const day = client.dataNascimento!.split('-')[2]
          const zapNumber = client.phone.replace(/\D/g, '')
          const zapLink = `https://wa.me/55${zapNumber}?text=Parabéns%20${encodeURIComponent(client.name.split(' ')[0])}!%20Toda%20a%20equipe%20da%20MRF%20Pilates%20te%20deseja%20um%20feliz%20aniversário%20hoje!%20🎉`

          return (
            <div key={client.id} className="flex items-center justify-between bg-white/60 rounded-lg p-2.5">
              <div>
                <p className="text-sm font-bold text-gray-800">{client.name}</p>
                <p className="text-xs text-gray-500">Dia {day}</p>
              </div>
              <a href={zapLink} target="_blank" rel="noreferrer" title="Mandar parabéns">
                <div className="bg-[#25D366]/10 p-2 rounded-full text-[#25D366] hover:bg-[#25D366] hover:text-white transition-colors">
                  <MessageCircle className="h-4 w-4" />
                </div>
              </a>
            </div>
          )
        })}
      </div>
    </div>
  )
}