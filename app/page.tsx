// app/page.tsx
import prisma from "@/lib/prisma"
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'
import { getServerSession } from "next-auth/next"
import DashboardClient from "./DashboardClient"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const session = await getServerSession()
  const firstName = session?.user?.name?.split(" ")[0] || "Doutora"

  const hoje = new Date()
  const inicioDia = startOfDay(hoje)
  const fimDia = endOfDay(hoje)
  const inicioMes = startOfMonth(hoje)
  const fimMes = endOfMonth(hoje)

  // ADICIONADO: Busca das últimas 5 evoluções
  const [totalAlunosAtivos, clientesCriadosEsteMes, aulasHoje, transacoesMes, settings, todosClientes, evolucoesBrutas] = await Promise.all([
    prisma.client.count({ where: { status: 'ativo' } }),
    prisma.client.count({ where: { status: 'ativo', createdAt: { gte: inicioMes, lte: fimMes } } }),
    prisma.appointment.findMany({
      where: { date: { gte: inicioDia, lte: fimDia }, status: { notIn: ['CANCELADO'] } }
    }),
    prisma.transaction.findMany({
      where: { date: { gte: inicioMes, lte: fimMes } }
    }),
    prisma.settings.findFirst(),
    prisma.client.findMany({ where: { status: 'ativo' } }),
    prisma.evolution.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { client: { select: { name: true } } }
    })
  ])

  const aulasRealizadas = aulasHoje.filter(a => a.status === 'REALIZADO').length
  const pctAulas = aulasHoje.length > 0 ? Math.round((aulasRealizadas / aulasHoje.length) * 100) : 0

  const receitasPagas = transacoesMes.filter(t => t.type === 'RECEITA' && t.status === 'PAGO').reduce((acc, t) => acc + Number(t.amount), 0)
  const receitasPendentes = transacoesMes.filter(t => t.type === 'RECEITA' && t.status === 'PENDENTE').length
  const receitaFormatada = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(receitasPagas)

  const mesAtual = (hoje.getMonth() + 1).toString().padStart(2, '0')
  const diaAtual = hoje.getDate().toString().padStart(2, '0')

  const aniversariantes = todosClientes
    .filter(c => {
      if (!c.dataNascimento) return false
      const partes = c.dataNascimento.split('-') 
      return partes.length === 3 && partes[1] === mesAtual && partes[2] === diaAtual
    })
    .map(c => ({ id: c.id, name: c.name, phone: c.phone || '' }))

  const msgAniversarioBase = settings?.msgAniversario || "Parabéns [NOME]! A equipa MRF Pilates deseja um dia maravilhoso e cheio de energia. Feliz aniversário!"

  const agendaRealDeHoje = aulasHoje.map(a => ({
    id: a.id,
    date: a.date.toISOString(),
    type: a.type,
    instructor: a.instructor,
    clientName: a.tempName || 'Visitante' // O Dashboard busca o cliente na tabela client depois se precisar
  }))

  // Mapeamos as evoluções para Plain Object
  const ultimasEvolucoes = evolucoesBrutas.map(e => ({
    id: e.id,
    clientId: e.clientId,
    client: e.client?.name || 'Cliente Removido',
    date: e.createdAt.toISOString(),
    summary: e.description,
    professional: e.instructor
  }))

  const dashboardData = {
    firstName,
    aulasRealizadas,
    totalAulasHoje: aulasHoje.length,
    pctAulas,
    totalAlunosAtivos,
    clientesCriadosEsteMes,
    receitaFormatada,
    receitasPendentes,
    aniversariantes,
    msgAniversarioBase,
    agendaRealDeHoje,
    ultimasEvolucoes // <--- Enviado para o cliente
  }

  return <DashboardClient data={dashboardData} />
}