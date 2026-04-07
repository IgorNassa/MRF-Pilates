import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Função auxiliar para gerar datas relativas a hoje
function getRelativeDate(daysOffset: number, hours: number = 10, minutes: number = 0) {
  const date = new Date()
  date.setDate(date.getDate() + daysOffset)
  date.setHours(hours, minutes, 0, 0)
  return date
}

async function main() {
  console.log('🧹 Limpando banco de dados (CUIDADO: Isso apaga todos os dados atuais)...')
  
  // Apaga tudo na ordem certa para não quebrar as relações
  await prisma.transaction.deleteMany()
  await prisma.evolution.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.client.deleteMany()

  console.log('👤 Criando clientes...')

  const clienteMensal = await prisma.client.create({
    data: {
      name: 'Ana Carolina Silva',
      email: 'ana.carolina@email.com',
      phone: '(45) 99999-1111',
      plan: 'PILATES_2X MENSAL',
      planValue: 250.00,
      planInstallments: 1,
      planInstallmentsPaid: 0,
      planDueDate: 5,
      planPaymentMethod: 'PIX',
      status: 'ativo',
      queixaPrincipal: 'Dor na lombar devido ao trabalho sentada.',
    }
  })

  const clienteSemestral = await prisma.client.create({
    data: {
      name: 'Roberto Gomes',
      email: 'roberto.gomes@email.com',
      phone: '(45) 98888-2222',
      plan: 'PILATES_3X SEMESTRAL',
      planValue: 1800.00,
      planInstallments: 6, // Parcelado no cartão
      planInstallmentsPaid: 2, // Já pagou 2 faturas no cartão
      planDueDate: 15,
      planPaymentMethod: 'CARTAO_CREDITO',
      status: 'ativo',
      queixaPrincipal: 'Buscando fortalecimento muscular.',
    }
  })

  const clienteFisio = await prisma.client.create({
    data: {
      name: 'Maria Antonieta',
      email: 'maria.antonieta@email.com',
      phone: '(45) 97777-3333',
      plan: null, // Avulsa
      status: 'ativo',
      queixaPrincipal: 'Recuperação pós-cirúrgica do joelho direito.',
    }
  })

  console.log('📅 Criando agendamentos e evoluções...')

  // 1. Sessão Passada (Realizada com Evolução)
  const apptPassado = await prisma.appointment.create({
    data: {
      clientId: clienteMensal.id,
      instructor: 'Marisa',
      type: 'PILATES_2X',
      date: getRelativeDate(-2, 14, 0), // 2 dias atrás às 14:00
      status: 'REALIZADO'
    }
  })
  
  await prisma.evolution.create({
    data: {
      clientId: clienteMensal.id,
      instructor: 'Marisa',
      description: 'Paciente relatou melhora na dor lombar. Exercícios focados em alongamento e core no Reformer. Boa progressão.',
    }
  })

  // 2. Sessões para HOJE
  await prisma.appointment.create({
    data: {
      clientId: clienteSemestral.id,
      instructor: 'Outro',
      type: 'PILATES_3X',
      date: getRelativeDate(0, 16, 0), // Hoje às 16:00
      status: 'AGENDADO'
    }
  })

  const apptFisioHoje = await prisma.appointment.create({
    data: {
      clientId: clienteFisio.id,
      instructor: 'Marisa',
      type: 'FISIO_SESSAO',
      date: getRelativeDate(0, 10, 30), // Hoje às 10:30
      status: 'AGENDADO'
    }
  })

  await prisma.appointment.create({
    data: {
      tempName: 'Visitante Lucas', // Experimental não tem cadastro ainda
      instructor: 'Marisa',
      type: 'EXPERIMENTAL',
      date: getRelativeDate(0, 18, 0), // Hoje às 18:00
      status: 'AGENDADO'
    }
  })

  // 3. Sessões para AMANHÃ
  await prisma.appointment.create({
    data: {
      clientId: clienteMensal.id,
      instructor: 'Marisa',
      type: 'PILATES_2X',
      date: getRelativeDate(1, 9, 0), // Amanhã às 09:00
      status: 'AGENDADO'
    }
  })

  console.log('💰 Criando lançamentos financeiros...')

  // --- RECEITAS (Pagas e Pendentes) ---

  // Mensalidade atrasada/pendente da Ana (Venceu dia 5)
  await prisma.transaction.create({
    data: {
      title: 'Mensalidade 1 - PILATES_2X MENSAL',
      amount: 250.00,
      type: 'RECEITA',
      category: 'MENSALIDADE',
      status: 'PENDENTE',
      paymentMethod: 'PIX',
      clientId: clienteMensal.id,
      date: getRelativeDate(-10) // Venceu faz um tempo
    }
  })

  // Pagamento do Semestral do Roberto (Paga no Cartão de Crédito)
  await prisma.transaction.create({
    data: {
      title: 'Plano Semestral (1/6)',
      amount: 300.00,
      type: 'RECEITA',
      category: 'MENSALIDADE',
      status: 'PAGO',
      paymentMethod: 'CARTAO_CREDITO',
      clientId: clienteSemestral.id,
      date: getRelativeDate(-40) // Pagou mês passado
    }
  })
  
  await prisma.transaction.create({
    data: {
      title: 'Plano Semestral (2/6)',
      amount: 300.00,
      type: 'RECEITA',
      category: 'MENSALIDADE',
      status: 'PAGO',
      paymentMethod: 'CARTAO_CREDITO',
      clientId: clienteSemestral.id,
      date: getRelativeDate(-10) // Pagou este mês
    }
  })

  // Sessão avulsa da Fisio de hoje (Pendente, pois ela acabou de marcar)
  await prisma.transaction.create({
    data: {
      title: 'Sessão de Fisioterapia Avulsa',
      amount: 150.00,
      type: 'RECEITA',
      category: 'SESSAO_AVULSA',
      status: 'PENDENTE',
      paymentMethod: 'DINHEIRO',
      clientId: clienteFisio.id,
      appointmentId: apptFisioHoje.id,
      date: getRelativeDate(0) // Hoje
    }
  })

  // --- DESPESAS (Fixas e Variáveis) ---

  await prisma.transaction.create({
    data: {
      title: 'Aluguel do Studio',
      amount: 2200.00,
      type: 'DESPESA',
      category: 'CUSTO_FIXO',
      status: 'PAGO',
      paymentMethod: 'PIX',
      date: getRelativeDate(-2) // Pagou dia 1
    }
  })

  await prisma.transaction.create({
    data: {
      title: 'Conta de Luz (Copel)',
      amount: 345.50,
      type: 'DESPESA',
      category: 'CUSTO_FIXO',
      status: 'PAGO',
      paymentMethod: 'BOLETO',
      date: getRelativeDate(-5) 
    }
  })

  await prisma.transaction.create({
    data: {
      title: 'Manutenção dos Aparelhos',
      amount: 450.00,
      type: 'DESPESA',
      category: 'OUTROS',
      status: 'PENDENTE', // Agendou manutenção mas não pagou ainda
      paymentMethod: 'PIX',
      date: getRelativeDate(2) // Vai pagar depois de amanhã
    }
  })

  console.log('✅ Seed finalizado com sucesso! Banco de dados populado.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })