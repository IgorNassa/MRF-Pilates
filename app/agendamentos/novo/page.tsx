
// app/agendamentos/novo/page.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClients } from "@/lib/actions";
import NewAppointmentForm from "./NewAppointmentForm";

export default async function NovoAgendamentoPage() {
  const clients = await getClients();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <main className="pt-16 lg:pt-0 lg:pl-64 transition-all duration-300">
        <div className="mx-auto max-w-3xl px-4 sm:px-8 py-6 sm:py-10">
          
          <div className="flex items-center gap-4 mb-6">
            <Link href="/agendamentos">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-200 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Novo Agendamento
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Agende sessões regulares, experimentais ou avaliações.
              </p>
            </div>
          </div>

          <Card className="border-border shadow-sm">
            <CardHeader className="bg-slate-50 border-b border-border rounded-t-xl">
              <CardTitle className="text-lg font-medium text-slate-800">
                Informações da Sessão
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <NewAppointmentForm clients={clients} />
            </CardContent>
          </Card>
          
        </div>
      </main>
    </div>
  );
}