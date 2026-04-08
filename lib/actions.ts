"use server"

import prisma from "./prisma"
import { getServerSession } from "next-auth"
import { revalidatePath } from "next/cache"
import { createClient as createSupabaseClient } from '@supabase/supabase-js'


const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ==========================================
// 1. SUPABASE UPLOAD & DELETE
// ==========================================
async function uploadFileToSupabase(file: File) {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const { data, error } = await supabase.storage.from('prontuarios').upload(fileName, file, { cacheControl: '3600', upsert: false })
    if (error) throw error
    const { data: publicUrlData } = supabase.storage.from('prontuarios').getPublicUrl(fileName)
    return publicUrlData.publicUrl
  } catch (error) {
    throw error
  }
}

export async function deleteClientDocument(clientId: string, fileUrl: string, docType: 'general' | 'exam') {
  try {
    const filePath = fileUrl.split('/prontuarios/')[1]
    if (!filePath) throw new Error("URL inválida")
    await supabase.storage.from('prontuarios').remove([filePath])

    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client) return

    if (docType === 'general') {
      const updatedLinks = client.generalDocsLinks.filter((url) => url !== fileUrl)
      await prisma.client.update({ where: { id: clientId }, data: { generalDocsLinks: updatedLinks } })
    } else {
      const updatedLinks = client.examDocsLinks.filter((url) => url !== fileUrl)
      await prisma.client.update({ where: { id: clientId }, data: { examDocsLinks: updatedLinks } })
    }
    revalidatePath("/clientes")
    revalidatePath(`/clientes/${clientId}`)
  } catch (error) {
    throw new Error("Não foi possível deletar o arquivo")
  }
}

// ==========================================
// 2. CLIENTES (CRUD)
// ==========================================
// ==========================================
// 2. CLIENTES (CRUD)
// ==========================================
export async function createClient(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const plan = formData.get("plan") as string
  const documento = formData.get("documento") as string
  const cep = formData.get("cep") as string
  const logradouro = formData.get("logradouro") as string
  const numero = formData.get("numero") as string
  const bairro = formData.get("bairro") as string
  const cidade = formData.get("cidade") as string
  const uf = formData.get("uf") as string
  const contatoEmergencia = formData.get("contatoEmergencia") as string
  const queixaPrincipal = formData.get("queixaPrincipal") as string
  const condicoesMedicas = formData.get("condicoesMedicas") as string
  const fotoPerfil = formData.get("fotoPerfil") as string

  // CORREÇÃO DA DATA: Converte o YYYY-MM-DD do HTML para o formato ISO do Prisma
  const dataNascimentoRaw = formData.get("dataNascimento") as string
  const dataNascimento = dataNascimentoRaw ? new Date(`${dataNascimentoRaw}T12:00:00Z`) : null

  const generalDocs = formData.getAll("general_docs")
  let generalDocsLinks: string[] = []
  if (generalDocs.length > 0 && generalDocs[0] instanceof File && generalDocs[0].size > 0) {
    generalDocsLinks = await Promise.all(generalDocs.map(async (file) => await uploadFileToSupabase(file as File)))
  }

  const examDocs = formData.getAll("exam_docs")
  let examDocsLinks: string[] = []
  if (examDocs.length > 0 && examDocs[0] instanceof File && examDocs[0].size > 0) {
    examDocsLinks = await Promise.all(examDocs.map(async (file) => await uploadFileToSupabase(file as File)))
  }

  await prisma.client.create({
    data: {
      name, email, phone, plan, status: "ativo", documento, cep, logradouro, numero, bairro, cidade, uf,
      dataNascimento, // Agora vai no formato correto!
      contatoEmergencia, queixaPrincipal, condicoesMedicas, fotoPerfil,
      generalDocsLinks, examDocsLinks
    }
  })
  revalidatePath("/clientes")
}

export async function updateClient(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;
  const plan = formData.get("plan") as string;
  const documento = formData.get("documento") as string;
  const cep = formData.get("cep") as string;
  const logradouro = formData.get("logradouro") as string;
  const numero = formData.get("numero") as string;
  const bairro = formData.get("bairro") as string;
  const cidade = formData.get("cidade") as string;
  const uf = formData.get("uf") as string;
  const contatoEmergencia = formData.get("contatoEmergencia") as string;
  const queixaPrincipal = formData.get("queixaPrincipal") as string;
  const condicoesMedicas = formData.get("condicoesMedicas") as string;
  const fotoPerfil = formData.get("fotoPerfil") as string;

  // CORREÇÃO DA DATA: Converte o YYYY-MM-DD do HTML para o formato ISO do Prisma
  const dataNascimentoRaw = formData.get("dataNascimento") as string;
  const dataNascimento = dataNascimentoRaw ? new Date(`${dataNascimentoRaw}T12:00:00Z`) : null;

  try {
    const currentClient = await prisma.client.findUnique({ where: { id }, select: { generalDocsLinks: true, examDocsLinks: true } });

    const newGeneralDocs = formData.getAll("general_docs");
    let updatedGeneralLinks = Array.isArray(currentClient?.generalDocsLinks) ? [...currentClient.generalDocsLinks] : [];
    if (newGeneralDocs.length > 0 && newGeneralDocs[0] instanceof File && newGeneralDocs[0].size > 0) {
      const newLinks = await Promise.all(newGeneralDocs.map(async (file) => await uploadFileToSupabase(file as File)));
      updatedGeneralLinks = [...updatedGeneralLinks, ...newLinks];
    }

    const newExamDocs = formData.getAll("exam_docs");
    let updatedExamLinks = Array.isArray(currentClient?.examDocsLinks) ? [...currentClient.examDocsLinks] : [];
    if (newExamDocs.length > 0 && newExamDocs[0] instanceof File && newExamDocs[0].size > 0) {
      const newLinks = await Promise.all(newExamDocs.map(async (file) => await uploadFileToSupabase(file as File)));
      updatedExamLinks = [...updatedExamLinks, ...newLinks];
    }

    await prisma.client.update({
      where: { id },
      data: {
        name, email, phone, plan, documento, cep, logradouro, numero, bairro, cidade, uf,
        dataNascimento, // Agora vai no formato correto!
        contatoEmergencia, queixaPrincipal, condicoesMedicas, fotoPerfil,
        generalDocsLinks: updatedGeneralLinks, examDocsLinks: updatedExamLinks
      }
    });
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
  } catch (error) {
    throw error;
  }
}

export async function deleteClient(id: string) {
  try {
    await prisma.client.delete({ where: { id } })
    revalidatePath("/clientes")
  } catch (error) {
    throw new Error("Não foi possível excluir o cliente.")
  }
}

export async function getClientById(id: string) {
  try {
    return await prisma.client.findUnique({
      where: { id },
      include: { evolutions: true, appointments: true, transactions: { orderBy: { date: 'desc' } } }
    })
  } catch (error) {
    return null
  }
}

export async function getClients() {
  return await prisma.client.findMany({ orderBy: { name: 'asc' } })
}

// ==========================================
// 3. GESTÃO DE PLANOS & FINANCEIRO
// ==========================================

export async function atualizarPlanoCliente(clientId: string, novoPlano: string, parcelas: number, valorFinal: number, vencimento: number, paymentMethod: string) {
  try {
    let meses = 1;
    if (novoPlano.toUpperCase().includes("TRIMESTRAL")) meses = 4;
    if (novoPlano.toUpperCase().includes("SEMESTRAL")) meses = 6;
    
    let frequencia = 1;
    if (novoPlano.toUpperCase().includes("2X")) frequencia = 2;
    if (novoPlano.toUpperCase().includes("3X")) frequencia = 3;
    if (novoPlano.toUpperCase().includes("4X")) frequencia = 4;
    if (novoPlano.toUpperCase().includes("5X")) frequencia = 5;

    const totalAulas = meses * 4 * frequencia; 

    await prisma.client.update({
      where: { id: clientId },
      data: { 
        plan: novoPlano, planValue: valorFinal, planInstallments: parcelas, planPaymentMethod: paymentMethod,
        planInstallmentsPaid: 1, planLastPayment: new Date(), planDueDate: vencimento,
        totalSessions: totalAulas, 
        remainingSessions: totalAulas 
      }
    })

    if (valorFinal > 0 || paymentMethod === 'ISENTO') {
      const isMensal = novoPlano.toUpperCase().includes('MENSAL');
      await prisma.transaction.create({
        data: {
          title: isMensal ? `Mensalidade 1 - ${novoPlano}` : `Plano - ${novoPlano}`,
          amount: paymentMethod === 'ISENTO' ? 0 : valorFinal,
          type: 'RECEITA',
          category: 'MENSALIDADE',
          status: paymentMethod === 'ISENTO' ? 'ISENTO' : 'PAGO', 
          paymentMethod: paymentMethod,
          clientId: clientId,
          date: new Date() 
        }
      })
    }

    revalidatePath('/clientes')
    revalidatePath('/financeiro')
    return { sucesso: true }
  } catch (error) {
    return { sucesso: false, erro: "Falha ao atualizar plano" }
  }
}

export async function removerPlanoCliente(clientId: string) {
  try {
    await prisma.client.update({
      where: { id: clientId },
      data: { plan: null, planValue: null, planInstallments: null, planInstallmentsPaid: null, planLastPayment: null, planDueDate: null, planPaymentMethod: null }
    })
    revalidatePath('/clientes')
    revalidatePath('/financeiro')
    return { sucesso: true }
  } catch (error) {
    return { sucesso: false, erro: "Falha ao remover plano" }
  }
}

export async function pagarParcelaPlano(clientId: string, valor: number, isento: boolean) {
  try {
    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client) throw new Error("Cliente não encontrado")

    const novaParcelaPaga = (client.planInstallmentsPaid || 0) + 1

    await prisma.client.update({
      where: { id: clientId },
      data: { planInstallmentsPaid: novaParcelaPaga, planLastPayment: new Date() }
    })

    const isMensal = client.plan?.toUpperCase().includes('MENSAL');
    await prisma.transaction.create({
      data: {
        title: isMensal ? `Mensalidade ${novaParcelaPaga} - ${client.plan}` : `Renovação - ${client.plan}`,
        amount: isento ? 0 : valor,
        type: 'RECEITA',
        category: 'MENSALIDADE',
        status: isento ? 'ISENTO' : 'PAGO',
        paymentMethod: isento ? 'ISENTO' : (client.planPaymentMethod || 'PIX'),
        clientId: clientId,
        date: new Date()
      }
    })
    revalidatePath('/financeiro')
    return { sucesso: true }
  } catch (error) {
    return { sucesso: false, erro: "Falha ao pagar parcela" }
  }
}

export async function desfazerPagamentoPlano(clientId: string) {
  try {
    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client || !client.planInstallmentsPaid || client.planInstallmentsPaid <= 0) return { sucesso: false }

    await prisma.client.update({
      where: { id: clientId },
      data: { planInstallmentsPaid: client.planInstallmentsPaid - 1 }
    })
    revalidatePath('/financeiro')
    return { sucesso: true }
  } catch (error) {
    return { sucesso: false }
  }
}

export async function renovarPlanoCiclo(clientId: string) {
  try {
    await prisma.client.update({
      where: { id: clientId },
      data: { planInstallmentsPaid: 0, planLastPayment: new Date() }
    })
    revalidatePath('/financeiro')
    return { sucesso: true }
  } catch (error) {
    return { sucesso: false }
  }
}

export async function getTransactions() {
  try {
    return await prisma.transaction.findMany({
      orderBy: { date: 'desc' },
      include: { client: { select: { name: true } } }
    })
  } catch (error) {
    return []
  }
}

export async function criarTransacao(data: any) {
  try {
    await prisma.transaction.create({ data })
    revalidatePath('/financeiro')
    return { sucesso: true }
  } catch (error) {
    return { sucesso: false, erro: "Falha ao criar" }
  }
}

export async function atualizarTransacao(id: string, data: any) {
  try {
    await prisma.transaction.update({ where: { id }, data })
    revalidatePath('/financeiro')
    return { sucesso: true }
  } catch (error) {
    return { sucesso: false, erro: "Falha ao atualizar" }
  }
}

export async function deletarTransacao(id: string) {
  try {
    await prisma.transaction.delete({ where: { id } })
    revalidatePath('/financeiro')
    return { sucesso: true }
  } catch (error) {
    return { sucesso: false, erro: "Falha ao excluir" }
  }
}

export async function confirmarPagamentoTransacao(id: string) {
  try {
    await prisma.transaction.update({ where: { id }, data: { status: 'PAGO' } })
    revalidatePath('/financeiro')
    return { sucesso: true }
  } catch (error) {
    return { sucesso: false, erro: "Falha ao confirmar" }
  }
}

// ==========================================
// 4. EVOLUÇÕES E DÉBITO DE SALDO DE AULAS
// ==========================================

export async function concluirSessaoComEvolucao(id: string, clientId?: string | null, evolucaoTexto?: string, instructor?: string) {
  try {
    const appt = await prisma.appointment.update({ where: { id }, data: { status: 'REALIZADO' }, include: { client: true } })
    
    if (clientId && evolucaoTexto && evolucaoTexto.trim() !== '') {
      await prisma.evolution.create({ data: { clientId, description: evolucaoTexto, instructor: instructor || 'Sistema' } })
    }

    // REGRA SÊNIOR: Debita 1 aula do plano do cliente!
    if (clientId && appt.client?.plan && appt.client.remainingSessions > 0) {
      await prisma.client.update({
        where: { id: clientId },
        data: { remainingSessions: { decrement: 1 } }
      });
    }

    revalidatePath('/agendamentos')
    revalidatePath('/financeiro')
    return { sucesso: true }
  } catch (error) {
    return { sucesso: false, erro: "Falha ao concluir sessão" }
  }
}

export async function marcarFaltaAgendamento(id: string) {
  try {
    const appt = await prisma.appointment.update({
      where: { id },
      data: { status: 'FALTA' },
      include: { client: true }
    });
    
    // REGRA SÊNIOR: Falta também debita aula do plano!
    if (appt.clientId && appt.client?.plan && appt.client.remainingSessions > 0) {
      await prisma.client.update({
        where: { id: appt.clientId },
        data: { remainingSessions: { decrement: 1 } }
      });
    }
    
    revalidatePath('/agendamentos');
    return { sucesso: true };
  } catch (error) {
    return { sucesso: false };
  }
}

export async function cancelarAgendamento(id: string) {
  try {
    await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELADO' }
    });
    revalidatePath('/agendamentos');
    return { sucesso: true };
  } catch (error) {
    return { sucesso: false };
  }
}

export async function converterEmReposicao(id: string) {
  try {
    const appt = await prisma.appointment.findUnique({
      where: { id },
      include: { client: true }
    });

    if (!appt || !appt.clientId) return { sucesso: false, erro: "Agendamento não encontrado." };

    // Adiciona 1 crédito de reposição
    await prisma.client.update({
      where: { id: appt.clientId },
      data: { repositionCredits: { increment: 1 } }
    });

    // Cancela a aula na grelha para libertar vaga
    await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELADO' }
    });

    revalidatePath('/agendamentos');
    revalidatePath(`/clientes/${appt.clientId}`);
    return { sucesso: true };
  } catch (error) {
    return { sucesso: false, erro: "Falha ao processar reposição." };
  }
}

export async function deletarAgendamento(id: string) {
  try {
    await prisma.transaction.deleteMany({ where: { appointmentId: id } })
    await prisma.appointment.delete({ where: { id } })
    
    revalidatePath('/agendamentos') 
    revalidatePath('/financeiro') 
    return { sucesso: true }
  } catch (error) {
    return { sucesso: false, erro: "Falha ao excluir" }
  }
}

export async function reverterAgendamento(id: string) {
  try {
    const appt = await prisma.appointment.update({ 
      where: { id }, 
      data: { status: 'AGENDADO' },
      include: { client: true }
    })
    
    await prisma.transaction.deleteMany({ where: { appointmentId: id } })
    
    // REGRA SÊNIOR: Se reverteu, devolve a aula ao saldo do paciente!
    if (appt.clientId && appt.client?.plan) {
      await prisma.client.update({
        where: { id: appt.clientId },
        data: { remainingSessions: { increment: 1 } }
      });
    }
    
    revalidatePath('/agendamentos')
    revalidatePath('/financeiro')
    return { sucesso: true }
  } catch (error) {
    return { sucesso: false }
  }
}

export async function atualizarEvolucao(id: string, novaDescricao: string) {
  try {
    await prisma.evolution.update({ where: { id }, data: { description: novaDescricao } })
    revalidatePath('/clientes')
    return { sucesso: true }
  } catch (error) {
    return { sucesso: false, erro: "Falha ao atualizar evolução" }
  }
}

export async function deletarEvolucao(id: string) {
  try {
    await prisma.evolution.delete({ where: { id } })
    revalidatePath('/clientes')
    return { sucesso: true }
  } catch (error) {
    return { sucesso: false, erro: "Falha ao excluir evolução" }
  }
}

export async function createEvolution(clientId: string, formData: FormData) {
  const professional = formData.get("professional") as string
  const details = formData.get("details") as string
  const tags = formData.get("tags") as string
  const summary = tags ? `Equipamentos: ${tags}` : "Sessão"

  try {
    await prisma.evolution.create({
      data: { instructor: professional || "Profissional", description: `${summary}\n${details}`, clientId }
    })
    revalidatePath(`/clientes/${clientId}`)
  } catch (error) {
    throw new Error("Erro interno ao criar evolução")
  }
}

export async function atualizarAgendamento(id: string, novaData: Date, novoInstrutor: string) {
  try {
    const start = new Date(novaData);
    start.setSeconds(0, 0);
    const end = new Date(novaData);
    end.setSeconds(59, 999);

    const existingAppts = await prisma.appointment.findMany({
      where: {
        date: { gte: start, lte: end },
        status: { notIn: ['CANCELADO', 'FALTA'] },
        id: { not: id } 
      }
    });

    if (existingAppts.length >= 4) {
      return { sucesso: false, erro: "O horário selecionado já possui a capacidade máxima do estúdio (4 alunos)." };
    }

    const instrCount = existingAppts.filter(a => a.instructor === novoInstrutor).length;
    if (instrCount >= 2) {
      return { sucesso: false, erro: `A Dra. ${novoInstrutor} já atingiu a capacidade máxima (2 alunos) neste horário.` };
    }

    await prisma.appointment.update({ 
      where: { id }, 
      data: { 
        date: novaData,
        instructor: novoInstrutor
      } 
    })
    revalidatePath('/agendamentos')
    return { sucesso: true }
  } catch (error) {
    return { sucesso: false, erro: "Falha ao atualizar a sessão." }
  }
}

// ==========================================
// 5. NOVO AGENDAMENTO COM SUPORTE A REPOSIÇÃO
// ==========================================
export async function criarAgendamento(dados: any) {
  try {
    const { tipoAgendamento, serviceType, clientId, tempName, tempPhone, instructorId, diasComHorarios, singleTime, fisioSessions, startDate, isReposicao } = dados;

    let finalType: any = "EXPERIMENTAL";
    let clientPlanType = "PILATES_1X"; 
    let isAvulso = false; 
    
    let precoPilatesAvulso = 100.00;
    let precoFisio = 150.00;
    let precoExp = 50.00;
    
    try {
      const settings = await prisma.settings.findFirst();
      if (settings) {
        precoPilatesAvulso = Number(settings.pricePilates) || 100.00;
        precoFisio = Number(settings.priceFisio) || 150.00;
        precoExp = Number(settings.priceExp) || 50.00;
      }
    } catch (e) {
      console.log("Settings não encontradas. A usar preços base.");
    }
    
    if (tipoAgendamento === 'REGULAR') {
      if (serviceType === 'FISIOTERAPIA') {
        finalType = "FISIO_SESSAO"; 
      } else {
        const client = await prisma.client.findUnique({ where: { id: clientId } });
        const p = client?.plan?.toUpperCase() || "";
        if (p.includes("1X")) clientPlanType = "PILATES_1X";
        else if (p.includes("2X")) clientPlanType = "PILATES_2X";
        else if (p.includes("3X")) clientPlanType = "PILATES_3X";
        else if (p.includes("5X")) clientPlanType = "PILATES_5X";
        
        finalType = clientPlanType; 
      }
    }

    let datesToCheck: { date: Date, instructor: string, clientId?: string }[] = [];

    if (serviceType === 'FISIOTERAPIA') {
      for (const session of fisioSessions) {
        if (!session.date || !session.timeSlot) continue;
        const [hora, minuto] = session.timeSlot.split(':');
        const d = new Date(session.date + "T00:00:00");
        d.setHours(Number(hora), Number(minuto), 0);
        datesToCheck.push({ date: d, instructor: instructorId, clientId: tipoAgendamento === 'REGULAR' ? clientId : undefined });
      }
    } else if (serviceType === 'PILATES') {
      const diasMapa: Record<string, number> = { 'Dom': 0, 'Seg': 1, 'Ter': 2, 'Qua': 3, 'Qui': 4, 'Sex': 5, 'Sáb': 6 };
      
      if (!diasComHorarios || Object.keys(diasComHorarios).length === 0) {
        if (!singleTime) return { sucesso: false, erro: "Selecione o horário para a sessão avulsa." };
        const [hora, minuto] = singleTime.split(':');
        let d = new Date(startDate + "T00:00:00");
        d.setHours(Number(hora), Number(minuto), 0);
        datesToCheck.push({ date: d, instructor: instructorId, clientId: tipoAgendamento === 'REGULAR' ? clientId : undefined });
        
        isAvulso = true; 
        
      } else {
        let mesesDuracao = 1;
        if (clientId) {
          const client = await prisma.client.findUnique({ where: { id: clientId } });
          const planStr = client?.plan?.toUpperCase() || "";
          if (planStr.includes("TRIMESTRAL")) mesesDuracao = 4;
          if (planStr.includes("SEMESTRAL")) mesesDuracao = 6;
        }
        
        const totalSemanas = mesesDuracao * 4;

        for (const dia of Object.keys(diasComHorarios)) {
          const diaNumero = diasMapa[dia];
          const horarioDoDia = diasComHorarios[dia];
          if (!horarioDoDia) continue;
          
          const [hora, minuto] = horarioDoDia.split(':');

          let d = new Date(startDate + "T00:00:00"); 
          d.setHours(0, 0, 0, 0); 
          while (d.getDay() !== diaNumero) { d.setDate(d.getDate() + 1); }

          const agora = new Date();
          if (d.getDate() === agora.getDate() && d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear() && agora.getHours() >= Number(hora)) {
            d.setDate(d.getDate() + 7);
          }

          for (let i = 0; i < totalSemanas; i++) { 
            const dataSalvar = new Date(d);
            dataSalvar.setHours(Number(hora), Number(minuto), 0);
            datesToCheck.push({ date: dataSalvar, instructor: instructorId, clientId: tipoAgendamento === 'REGULAR' ? clientId : undefined });
            d.setDate(d.getDate() + 7);
          }
        }
      }
    }

    if (datesToCheck.length > 0) {
      const datesOnly = datesToCheck.map(d => d.date);
      const minD = new Date(Math.min(...datesOnly.map(d => d.getTime())));
      const maxD = new Date(Math.max(...datesOnly.map(d => d.getTime())));
      
      const existingAppts = await prisma.appointment.findMany({
          where: {
              date: { gte: minD, lte: maxD },
              status: { notIn: ['CANCELADO', 'FALTA'] }
          },
          select: { date: true, instructor: true, clientId: true }
      });

      const grouped = existingAppts.reduce((acc, curr) => {
          const t = curr.date.getTime();
          if (!acc[t]) acc[t] = [];
          acc[t].push(curr);
          return acc;
      }, {} as Record<number, any[]>);

      for (const req of datesToCheck) {
          const t = req.date.getTime();
          const inSlot = grouped[t] || [];
          const diaStr = `${req.date.getDate().toString().padStart(2,'0')}/${(req.date.getMonth()+1).toString().padStart(2,'0')}/${req.date.getFullYear()}`;
          const horaStr = `${req.date.getHours().toString().padStart(2,'0')}:${req.date.getMinutes().toString().padStart(2,'0')}`;

          if (req.clientId) {
            const isClone = inSlot.some(a => a.clientId === req.clientId);
            if (isClone) return { sucesso: false, erro: `O aluno já tem aula marcada dia ${diaStr} às ${horaStr}. Agendamento bloqueado.` };
          }
          if (inSlot.length >= 4) {
              return { sucesso: false, erro: `Estúdio lotado (4/4) no dia ${diaStr} às ${horaStr}.` };
          }
          const instrCount = inSlot.filter(a => a.instructor === req.instructor).length;
          if (instrCount >= 2) {
              return { sucesso: false, erro: `A Dra. ${req.instructor} já tem 2 alunos marcados dia ${diaStr} às ${horaStr}.` };
          }
          inSlot.push({ date: req.date, instructor: req.instructor, clientId: req.clientId });
          grouped[t] = inSlot;
      }
    }

    // REGRA SÊNIOR: GESTÃO DE CRÉDITO DE REPOSIÇÃO
    if (isReposicao && clientId) {
      const clienteData = await prisma.client.findUnique({ where: { id: clientId } });
      const saldo = clienteData?.repositionCredits || 0;
      const qtdNecessaria = datesToCheck.length;

      if (saldo < qtdNecessaria) {
        return { sucesso: false, erro: `Saldo insuficiente. O aluno tem ${saldo} crédito(s) e você tenta marcar ${qtdNecessaria} reposições.` };
      }

      // Desconta os créditos usados
      await prisma.client.update({
        where: { id: clientId },
        data: { repositionCredits: { decrement: qtdNecessaria } }
      });
    }

    // --- SALVAR NO BANCO ---
    const transacoesFinanceiras = [];
    const apptsToCreate = datesToCheck.map(req => ({
          clientId: tipoAgendamento === 'REGULAR' ? clientId : undefined,
          tempName: tipoAgendamento === 'EXPERIMENTAL' ? tempName : undefined,
          tempPhone: tipoAgendamento === 'EXPERIMENTAL' ? tempPhone : undefined,
          instructor: req.instructor,
          type: finalType as any, 
          date: req.date,
          status: 'AGENDADO' as any
        }));
    
    const createdAppts = await Promise.all(
      apptsToCreate.map(data => prisma.appointment.create({ data }))
    );

    // --- GERAÇÃO FINANCEIRA (SOMENTE SE NÃO FOR REPOSIÇÃO) ---
    if (!isReposicao) {
      for (const appt of createdAppts) {
        if (finalType === 'FISIO_SESSAO' || finalType === 'EXPERIMENTAL' || isAvulso) {
          let amountToCharge = precoPilatesAvulso;
          let txTitle = 'Aula Avulsa de Pilates (Extra Plano)';

          if (finalType === 'FISIO_SESSAO') { amountToCharge = precoFisio; txTitle = 'Sessão de Fisioterapia'; }
          if (finalType === 'EXPERIMENTAL') { amountToCharge = precoExp; txTitle = 'Sessão Experimental'; }

          transacoesFinanceiras.push({
            title: txTitle,
            amount: amountToCharge,
            type: 'RECEITA',
            category: 'SESSAO_AVULSA',
            status: 'PENDENTE',
            paymentMethod: 'PIX', 
            clientId: tipoAgendamento === 'REGULAR' ? clientId : undefined,
            appointmentId: appt.id,
            date: new Date()
          });
        }
      }
    }

    if (transacoesFinanceiras.length > 0) {
      await prisma.transaction.createMany({ data: transacoesFinanceiras as any });
    }
    
    revalidatePath('/agendamentos'); 
    revalidatePath('/financeiro');
    return { sucesso: true };

  } catch (erro) {
    console.error("ERRO COMPLETO:", erro);
    return { sucesso: false, erro: "Falha ao gravar no banco. Verifique os dados inseridos." };
  }
}
export async function getSettings() {
  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          studioName: "MRF Pilates", openTime: "07:00", closeTime: "19:00",
          priceFisio: 150.00, pricePilates: 100.00, priceExp: 50.00,
          plan1xMensal: 150.00, plan1xTrimestral: 400.00, plan1xSemestral: 750.00,
          plan2xMensal: 250.00, plan2xTrimestral: 700.00, plan2xSemestral: 1300.00,
          plan3xMensal: 350.00, plan3xTrimestral: 1000.00, plan3xSemestral: 1800.00,
          msgFatura: "Olá [NOME], sua fatura da MRF Pilates já está liberada! O vencimento é dia [DATA].",
          msgAtraso: "Olá [NOME], tudo bem? Notamos que a sua mensalidade com vencimento em [DATA] ainda está pendente no sistema. Podemos ajudar com algo?",
          msgConfirmacao: "Olá [NOME], passando para confirmar sua sessão de Pilates amanhã às [HORA]. Por favor, nos avise se houver algum imprevisto!",
          msgAniversario: "Parabéns [NOME]! A equipe MRF Pilates te deseja um dia maravilhoso e cheio de energia e muito movimento. Feliz aniversário!",
          msgProspeccao: "Olá [NOME], tudo bem? Vi que você tem interesse em cuidar da sua saúde com a gente. Vamos agendar uma aula experimental sem compromisso?"
        }
      });
    }
    return settings;
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return null;
  }
}

export async function updateSettings(dados: any) {
  try {
    const settings = await prisma.settings.findFirst();
    if (settings) {
      await prisma.settings.update({ where: { id: settings.id }, data: dados });
    } else {
      await prisma.settings.create({ data: dados });
    }
    revalidatePath('/configuracoes');
    revalidatePath('/agendamentos'); 
    revalidatePath('/agendamentos/novo'); 
    return { sucesso: true };
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);
    return { sucesso: false, erro: "Falha ao salvar configurações" };
  }
}
export async function checkDailyAvailability(dateStr: string) {
  try {
    const startOfDay = new Date(dateStr + "T00:00:00");
    const endOfDay = new Date(dateStr + "T23:59:59");

    const appointments = await prisma.appointment.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
        status: { notIn: ['CANCELADO'] }
      },
      select: { date: true, instructor: true }
    });

    const availability: Record<string, { total: number, Marisa: number, Loani: number }> = {};

    appointments.forEach(app => {
      // CORREÇÃO: Agora respeita a hora e o minuto (Ex: 07:30)
      const h = app.date.getHours().toString().padStart(2, '0');
      const m = app.date.getMinutes().toString().padStart(2, '0');
      const timeKey = `${h}:${m}`;
      
      if (!availability[timeKey]) availability[timeKey] = { total: 0, Marisa: 0, Loani: 0 };
      
      availability[timeKey].total += 1;
      if (app.instructor === 'Marisa') availability[timeKey].Marisa += 1;
      if (app.instructor === 'Loani') availability[timeKey].Loani += 1;
    });

    return availability; 
  } catch (error) {
    console.error("Erro ao checar vagas:", error);
    return {};
  }
}