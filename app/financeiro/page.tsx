// app/financeiro/page.tsx
import FinanceiroTabs from "./FinanceiroTabs"
import { Wallet } from "lucide-react"
import { getTransactions, getClients } from "@/lib/actions"
import { Sidebar } from "@/components/sidebar" 

export default async function FinanceiroPage() {
  const transactions = await getTransactions()
  const clients = await getClients() // Buscamos os clientes aqui!

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pt-16 lg:pt-0 lg:pl-64 transition-all duration-300">
        <div className="mx-auto max-w-5xl px-4 sm:px-8 py-6 sm:py-10">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4 sm:gap-0">
            <div className="flex items-center gap-4">
              <div className="bg-[#0f5c4e]/10 p-3 rounded-xl">
                <Wallet className="w-6 h-6 text-[#0f5c4e]" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Gestão Financeira</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Controle de receitas, despesas, planos e fluxo de caixa
                </p>
              </div>
            </div>
          </div>

          <FinanceiroTabs initialTransactions={transactions} clients={clients} />

        </div>
      </main>
    </div>
  )
}