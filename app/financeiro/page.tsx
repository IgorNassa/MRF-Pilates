import FinanceiroTabs from './FinanceiroTabs'
import { Sidebar } from '@/components/sidebar'
import { getTransactions, getClients } from '@/lib/actions' // <-- Importado getClients

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'
export const revalidate = 0

export default async function FinanceiroPage() {
  const transactionsRaw = await getTransactions()
  const clientsRaw = await getClients() // <-- Busca os clientes

  const transactions = transactionsRaw.map(tx => ({
    ...tx,
    date: tx.date.toISOString(),
    amount: Number(tx.amount)
  }))

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 min-w-0 pt-16 lg:pt-0 lg:pl-64 transition-all duration-300">
        <div className="mx-auto max-w-6xl px-4 sm:px-8 py-6 sm:py-10">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl font-semibold text-foreground">Financeiro</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Painel de receitas, despesas e comissões do estúdio.
            </p>
          </div>
          {/* Passa os transactions E os clients para as abas */}
          <FinanceiroTabs initialTransactions={transactions} clients={clientsRaw || []} />
        </div>
      </main>
    </div>
  )
}