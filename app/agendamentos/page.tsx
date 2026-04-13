// app/agendamentos/page.tsx
import prisma from '@/lib/prisma'
import AgendaTabs from './AgendaTabs'
import Link from 'next/link'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/components/ui/button' 
import { Plus } from 'lucide-react' 
import { unstable_noStore as noStore } from 'next/cache'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export default async function AgendamentosPage() {
  noStore(); // Mata o cache da Vercel para garantir dados ao vivo

  const appointmentsRaw = await prisma.appointment.findMany({
    include: {
      client: {
        select: {
          id: true,
          name: true,
          plan: true
        }
      }
    },
    orderBy: { date: 'asc' }
  });

  // O segredo está aqui: toISOString() mantém o "Z" (UTC) no final.
  // O navegador (no Brasil) vai ver o "Z" e subtrair 3 horas automaticamente!
  const appointments = appointmentsRaw.map(app => ({
    ...app,
    date: app.date.toISOString(), 
    createdAt: app.createdAt.toISOString(),
    updatedAt: app.updatedAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="flex-1 min-w-0 pt-16 lg:pt-0 lg:pl-64 transition-all duration-300">
        <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 sm:py-10">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Agenda</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gerencie as sessões e avaliações do studio.
              </p>
            </div>
            
            <Button asChild className="gap-2 bg-[#0f5c4e] hover:bg-[#0a453a] text-white w-full sm:w-auto shadow-md">
              <Link href="/agendamentos/novo">
                <Plus className="h-4 w-4" /> Novo Agendamento
              </Link>
            </Button>
          </div>
          
          <AgendaTabs initialAppointments={appointments} />
          
        </div>
      </main>
    </div>
  )
}