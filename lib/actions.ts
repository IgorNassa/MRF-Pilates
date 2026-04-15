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
export async function createClient(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
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
      name, email, phone, status: "ativo", documento, cep, logradouro, numero, bairro, cidade, uf,
      dataNascimento,
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
        name, email, phone, documento, cep, logradouro, numero, bairro, cidade, uf,
        dataNascimento,
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
export async function atualizarPlanoCliente(clientId: string, novoPlano: string, parcelas: number, valorFinal: number, vencimento: number, paymentMethod: string, isPendente: boolean = false) {
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
    
    const statusFinal = (paymentMethod === 'ISENTO') ? 'ISENTO' : (isPendente ? 'PENDENTE' : 'PAGO');
    const parcelasPagas = (statusFinal === 'PAGO' || statusFinal === 'ISENTO') ? 1 : 0;

    await prisma.client.update({
      where: { id: clientId },
      data: { 
        plan: novoPlano, planValue: valorFinal, planInstallments: parcelas, planPaymentMethod: paymentMethod,
        planInstallmentsPaid: parcelasPagas, planLastPayment: new Date(), planDueDate: vencimento,
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
          status: statusFinal as any, 
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
      data: { plan: null, planValue: null, planInstallments: null, planInstallmentsPaid: null, planLastPayment: null, planDueDate: null, planPaymentMethod: null, totalSessions: 0, remainingSessions: 0 }
    })
    revalidatePath('/clientes')
    revalidatePath('/financeiro')
    return { sucesso: true }
  } catch (error) {
    return { sucesso: false, erro: "Falha ao remover plano" }
  }
}

export async function pagarParcelaPlano(clientId: string, valor: number, isento: boolean, isPendente: boolean = false) {
  try {
    const client = await prisma.client.findUnique({ where: { id: clientId } })
    if (!client) throw new Error("Cliente não encontrado")

    const statusFinal = isento ? 'ISENTO' : (isPendente ? 'PENDENTE' : 'PAGO');
    
    const novaParcelaPaga = (statusFinal === 'PAGO' || statusFinal === 'ISENTO') 
      ? (client.planInstallmentsPaid || 0) + 1 
      : (client.planInstallmentsPaid || 0);

    await prisma.client.update({
      where: { id: clientId },
      data: { planInstallmentsPaid: novaParcelaPaga, planLastPayment: new Date() }
    })

    const isMensal = client.plan?.toUpperCase().includes('MENSAL');
    const proxParcela = (client.planInstallmentsPaid || 0) + 1;
    
    await prisma.transaction.create({
      data: {
        title: isMensal ? `Mensalidade ${proxParcela} - ${client.plan}` : `Renovação - ${client.plan}`,
        amount: isento ? 0 : valor,
        type: 'RECEITA',
        category: 'MENSALIDADE',
        status: statusFinal as any,
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
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    await prisma.client.update({
      where: { id: clientId },
      data: { 
        planInstallmentsPaid: 0, 
        planLastPayment: new Date(),
        remainingSessions: client?.totalSessions || 0 
      }
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
    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx) return { sucesso: false, erro: "Transação não encontrada" };

    if (tx.category === 'MENSALIDADE' && tx.status === 'PAGO' && tx.clientId) {
        const client = await prisma.client.findUnique({ where: { id: tx.clientId } });
        if (client && client.planInstallmentsPaid && client.planInstallmentsPaid > 0) {
            await prisma.client.update({
                where: { id: tx.clientId },
                data: { planInstallmentsPaid: client.planInstallmentsPaid - 1 }
            });
        }
    }

    await prisma.transaction.delete({ where: { id } })
    revalidatePath('/financeiro')
    revalidatePath('/clientes')
    return { sucesso: true }
  } catch (error) {
    return { sucesso: false, erro: "Falha ao excluir" }
  }
}

export async function confirmarPagamentoTransacao(id: string) {
  try {
    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (!tx) return { sucesso: false, erro: "Transação não encontrada" };

    await prisma.transaction.update({ where: { id }, data: { status: 'PAGO' } })
    
    if (tx.category === 'MENSALIDADE' && tx.clientId) {
       const client = await prisma.client.findUnique({ where: { id: tx.clientId } });
       if (client) {
          await prisma.client.update({
             where: { id: tx.clientId },
             data: { planInstallmentsPaid: (client.planInstallmentsPaid || 0) + 1, planLastPayment: new Date() }
          });
       }
    }

    revalidatePath('/financeiro')
    revalidatePath('/clientes')
    return { sucesso: true }
  } catch (error) {
    return { sucesso: false, erro: "Falha ao confirmar" }
  }
}

// ==========================================
// 4. EVOLUÇÕES E GESTÃO DE AGENDAMENTOS
// ==========================================
export async function concluirSessaoComEvolucao(id: string, clientId?: string | null, evolucaoTexto?: string, instructor?: string) {
  try {
    await prisma.appointment.update({ where: { id }, data: { status: 'REALIZADO' } })
    if (clientId && evolucaoTexto && evolucaoTexto.trim() !== '') {
      await prisma.evolution.create({ data: { clientId, description: evolucaoTexto, instructor: instructor || 'Sistema' } })
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
    await prisma.appointment.update({ where: { id }, data: { status: 'FALTA' } });
    revalidatePath('/agendamentos');
    return { sucesso: true };
  } catch (error) {
    return { sucesso: false };
  }
}

export async function cancelarAgendamento(id: string) {
  try {
    const appt = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELADO' },
      include: { client: true }
    });

    const isAvulsa = await prisma.transaction.findFirst({ where: { appointmentId: id } });
    const isAulaDoPlano = appt.type && String(appt.type).includes('PILATES_') && !isAvulsa;

    if (appt.clientId && appt.client?.plan && isAulaDoPlano) {
      await prisma.client.update({
        where: { id: appt.clientId },
        data: { remainingSessions: { increment: 1 } }
      });
    }

    revalidatePath('/agendamentos');
    return { sucesso: true };
  } catch (error) {
    return { sucesso: false };
  }
}

export async function converterEmReposicao(id: string) {
  try {
    const appt = await prisma.appointment.findUnique({ where: { id }, include: { client: true } });
    if (!appt || !appt.clientId) return { sucesso: false, erro: "Agendamento não encontrado." };

    await prisma.client.update({ where: { id: appt.clientId }, data: { repositionCredits: { increment: 1 } } });
    await prisma.appointment.update({ where: { id }, data: { status: 'CANCELADO' } });

    revalidatePath('/agendamentos');
    revalidatePath(`/clientes/${appt.clientId}`);
    return { sucesso: true };
  } catch (error) {
    return { sucesso: false, erro: "Falha ao processar reposição." };
  }
}

export async function deletarAgendamento(id: string) {
  try {
    const appt = await prisma.appointment.findUnique({ where: { id }, include: { client: true } });
    
    const isAvulsa = await prisma.transaction.findFirst({ where: { appointmentId: id } });
    const isAulaDoPlano = appt?.type && String(appt.type).includes('PILATES_') && !isAvulsa;

    await prisma.transaction.deleteMany({ where: { appointmentId: id } })
    await prisma.appointment.delete({ where: { id } })
    
    if (appt && appt.status !== 'CANCELADO' && appt.clientId && appt.client?.plan && isAulaDoPlano) {
      await prisma.client.update({
        where: { id: appt.clientId },
        data: { remainingSessions: { increment: 1 } }
      });
    }
    
    revalidatePath('/agendamentos') 
    revalidatePath('/financeiro') 
    return { sucesso: true }
  } catch (error) {
    return { sucesso: false, erro: "Falha ao excluir" }
  }
}

export async function reverterAgendamento(id: string) {
  try {
    const isAvulsa = await prisma.transaction.findFirst({ where: { appointmentId: id } });

    const appt = await prisma.appointment.update({ 
      where: { id }, 
      data: { status: 'AGENDADO' },
      include: { client: true }
    })
    
    const isAulaDoPlano = appt.type && String(appt.type).includes('PILATES_') && !isAvulsa;

    if (appt.clientId && appt.client?.plan && isAulaDoPlano) {
      await prisma.client.update({
        where: { id: appt.clientId },
        data: { remainingSessions: { decrement: 1 } }
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

    if (existingAppts.length >= 4) return { sucesso: false, erro: "Lotação máxima (4 alunos)." };
    const instrCount = existingAppts.filter(a => a.instructor === novoInstrutor).length;
    if (instrCount >= 2) return { sucesso: false, erro: `A Dra. ${novoInstrutor} já atingiu o limite neste horário.` };

    await prisma.appointment.update({ where: { id }, data: { date: novaData, instructor: novoInstrutor } })
    revalidatePath('/agendamentos')
    return { sucesso: true }
  } catch (error) {
    return { sucesso: false, erro: "Falha ao atualizar a sessão." }
  }
}

// ==========================================
// 5. PREVIEW DE AGENDAMENTO (PARA O MODAL)
// ==========================================
export async function validarAgendamentosPreview(dados: any) {
  try {
    const { tipoAgendamento, serviceType, clientId, instructorId, isAgendamentoManual, manualSessions, diasComHorarios, recorrenciaPeriodo, startDate, descontarDoPlano, comecarHoje } = dados;

    let clienteAtual = null;
    if (tipoAgendamento === 'REGULAR' && serviceType === 'PILATES') {
      clienteAtual = await prisma.client.findUnique({ where: { id: clientId } });
    }

    let datesToCheck: { date: Date, instructor: string, clientId?: string }[] = [];
    
    if (isAgendamentoManual) {
      for (const session of manualSessions) {
        if (!session.date || !session.timeSlot) continue;
        const [hora, minuto] = session.timeSlot.split(':');
        const d = new Date(`${session.date}T${hora.padStart(2, '0')}:${minuto.padStart(2, '0')}:00-03:00`);
        datesToCheck.push({ date: d, instructor: instructorId, clientId: tipoAgendamento === 'REGULAR' ? clientId : undefined });
      }
    } else if (serviceType === 'PILATES' && diasComHorarios && Object.keys(diasComHorarios).length > 0) {
      const diasMapa: Record<string, number> = { 'Dom': 0, 'Seg': 1, 'Ter': 2, 'Qua': 3, 'Qui': 4, 'Sex': 5, 'Sáb': 6 };
      
      let limiteAulas = Object.keys(diasComHorarios).length; 
      
      if (tipoAgendamento === 'REGULAR' && clienteAtual) {
         if (recorrenciaPeriodo === 'SEMANA') limiteAulas = Object.keys(diasComHorarios).length;
         else if (recorrenciaPeriodo === 'MES') limiteAulas = Object.keys(diasComHorarios).length * 4;
         else if (recorrenciaPeriodo === 'TUDO') limiteAulas = clienteAtual.remainingSessions;
      }

      if (descontarDoPlano && clienteAtual) {
          limiteAulas = Math.min(limiteAulas, clienteAtual.remainingSessions);
      }

      const [ano, mes, diaDaData] = startDate.split('-').map(Number);
      let dataAtual = new Date(Date.UTC(ano, mes - 1, diaDaData, 12, 0, 0)); 
      const agora = new Date();

      let aulasGeradas = 0;
      let diasSeguros = 0; 

      while(aulasGeradas < limiteAulas && diasSeguros < 730) {
         const diaSemanaNum = dataAtual.getUTCDay();
         const diaSemanaStr = Object.keys(diasMapa).find(key => diasMapa[key] === diaSemanaNum);

         if (diaSemanaStr && diasComHorarios[diaSemanaStr]) {
            const isToday = dataAtual.getUTCDate() === agora.getDate() && dataAtual.getUTCMonth() === agora.getMonth() && dataAtual.getUTCFullYear() === agora.getFullYear();

            if (isToday && !comecarHoje) {
               // Pula
            } else {
               const horarioDoDia = diasComHorarios[diaSemanaStr];
               const [hora, minuto] = horarioDoDia.split(':');

               const yyyy = dataAtual.getUTCFullYear();
               const mm = String(dataAtual.getUTCMonth() + 1).padStart(2, '0');
               const dd = String(dataAtual.getUTCDate()).padStart(2, '0');
               
               const dataSalvar = new Date(`${yyyy}-${mm}-${dd}T${hora.padStart(2, '0')}:${minuto.padStart(2, '0')}:00-03:00`);
               datesToCheck.push({ date: dataSalvar, instructor: instructorId, clientId: tipoAgendamento === 'REGULAR' ? clientId : undefined });
               
               aulasGeradas++;
            }
         }
         dataAtual.setUTCDate(dataAtual.getUTCDate() + 1);
         diasSeguros++;
      }
    }

    if (datesToCheck.length === 0) return { sucesso: false, erro: "Nenhuma data selecionada ou o paciente não tem saldo suficiente." };

    // Validação do banco em massa
    const datesOnly = datesToCheck.map(d => d.date);
    const minD = new Date(Math.min(...datesOnly.map(d => d.getTime())));
    const maxD = new Date(Math.max(...datesOnly.map(d => d.getTime())));
    
    const existingAppts = await prisma.appointment.findMany({
        where: { date: { gte: minD, lte: maxD }, status: { notIn: ['CANCELADO', 'FALTA'] } },
        select: { date: true, instructor: true, clientId: true }
    });

    const blockedTimes = await prisma.instructorBlock.findMany({ where: { date: { gte: minD, lte: maxD } } });

    const grouped = existingAppts.reduce((acc, curr) => {
        const t = curr.date.getTime();
        if (!acc[t]) acc[t] = [];
        acc[t].push(curr);
        return acc;
    }, {} as Record<number, any[]>);

    const sessoesPreview = datesToCheck.map((req, idx) => {
        const t = req.date.getTime();
        const inSlot = grouped[t] || [];
        
        const diaStr = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(req.date);
        const horaStr = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(req.date);
        
        const [d, m, y] = diaStr.split('/');
        const dateStr = `${y}-${m}-${d}`;

        const isBlockedByDoctor = blockedTimes.some(b => {
            const bDateStr = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(b.date);
            return b.instructor === req.instructor && bDateStr === diaStr && horaStr >= b.startTime && horaStr <= b.endTime;
        });
        
        let status = 'OK';
        let errorMsg = '';

        if (isBlockedByDoctor) { status = 'BLOQUEADO'; errorMsg = `A Dra. ${req.instructor} está marcada como Indisponível neste horário.`; }
        else if (req.clientId && inSlot.some(a => a.clientId === req.clientId)) { status = 'DUPLICADO'; errorMsg = `O aluno já tem aula marcada neste dia e horário.`; }
        else if (inSlot.length >= 4) { status = 'LOTADO'; errorMsg = `Estúdio lotado (4/4) vagas ocupadas neste dia/horário.`; }
        else if (inSlot.filter(a => a.instructor === req.instructor).length >= 2) { status = 'INSTRUTOR_LOTADO'; errorMsg = `A Dra. ${req.instructor} já tem 2 alunos marcados.`; }

        return {
            id: `temp-${idx}`,
            dateStr,
            timeStr: horaStr,
            instructor: req.instructor,
            status,
            errorMsg,
            diaFormatado: diaStr
        };
    });

    return { sucesso: true, sessoes: sessoesPreview };
  } catch (error) {
    return { sucesso: false, erro: "Falha ao gerar o preview de agendamentos." };
  }
}

// ==========================================
// 6. EFETIVAR AGENDAMENTOS SEGURAMENTE
// ==========================================
export async function efetivarAgendamentos(dadosFinais: any) {
  try {
    const { 
      sessoesConfirmadas, tipoAgendamento, serviceType, clientId, tempName, tempPhone, 
      useReposicao: paramUseReposicao, descontarDoPlano: paramDescontar, valorPersonalizado 
    } = dadosFinais;

    // Converte os dados do Frontend de volta para as Datas Reais do Backend
    const datesToCheck = sessoesConfirmadas.map((s: any) => {
        const [hora, minuto] = s.timeStr.split(':');
        const d = new Date(`${s.dateStr}T${hora.padStart(2, '0')}:${minuto.padStart(2, '0')}:00-03:00`);
        return { date: d, instructor: s.instructor, clientId: tipoAgendamento === 'REGULAR' ? clientId : undefined };
    });

    if (datesToCheck.length === 0) return { sucesso: false, erro: "Nenhuma sessão para agendar." };

    let useReposicao = paramUseReposicao;
    let descontarDoPlano = paramDescontar;
    
    let finalType: any = "EXPERIMENTAL";
    if (tipoAgendamento === 'REGULAR') {
      if (serviceType === 'FISIOTERAPIA') finalType = "FISIO_SESSAO"; 
      else {
        const clienteAtual = await prisma.client.findUnique({ where: { id: clientId } });
        const p = clienteAtual?.plan?.toUpperCase() || "";
        if (p.includes("1X")) finalType = "PILATES_1X";
        else if (p.includes("2X")) finalType = "PILATES_2X";
        else if (p.includes("3X")) finalType = "PILATES_3X";
        else if (p.includes("5X")) finalType = "PILATES_5X";
      }
    }

    // 1. CHECAGEM FINAL DE CONFLITOS (Para evitar que outro utilizador roube a vaga enquanto o modal estava aberto)
    const datesOnly = datesToCheck.map((d: any) => d.date);
    const minD = new Date(Math.min(...datesOnly.map((d: any) => d.getTime())));
    const maxD = new Date(Math.max(...datesOnly.map((d: any) => d.getTime())));
    
    const existingAppts = await prisma.appointment.findMany({
        where: { date: { gte: minD, lte: maxD }, status: { notIn: ['CANCELADO', 'FALTA'] } },
        select: { date: true, instructor: true, clientId: true }
    });
    const blockedTimes = await prisma.instructorBlock.findMany({ where: { date: { gte: minD, lte: maxD } } });

    const grouped = existingAppts.reduce((acc, curr) => {
        const t = curr.date.getTime();
        if (!acc[t]) acc[t] = [];
        acc[t].push(curr);
        return acc;
    }, {} as Record<number, any[]>);

    for (const req of datesToCheck) {
        const t = req.date.getTime();
        const inSlot = grouped[t] || [];
        const diaStr = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(req.date);
        const horaStr = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(req.date);

        const isBlockedByDoctor = blockedTimes.some(b => {
            const bDateStr = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' }).format(b.date);
            return b.instructor === req.instructor && bDateStr === diaStr && horaStr >= b.startTime && horaStr <= b.endTime;
        });

        // SE ENCONTRAR ERRO AQUI, ELE RETORNA ANTES DE MEXER NO SALDO! (BUG RESOLVIDO)
        if (isBlockedByDoctor) return { sucesso: false, erro: `A Dra. ${req.instructor} ficou Indisponível dia ${diaStr} às ${horaStr}.` };
        if (req.clientId && inSlot.some((a: any) => a.clientId === req.clientId)) return { sucesso: false, erro: `O aluno já tem aula no dia ${diaStr} às ${horaStr}.` };
        if (inSlot.length >= 4) return { sucesso: false, erro: `A vaga do dia ${diaStr} às ${horaStr} acabou de ser ocupada e o estúdio lotou.` };
        if (inSlot.filter((a: any) => a.instructor === req.instructor).length >= 2) return { sucesso: false, erro: `A Dra. ${req.instructor} acabou de lotar a agenda no dia ${diaStr} às ${horaStr}.` };
        
        inSlot.push({ date: req.date, instructor: req.instructor, clientId: req.clientId });
        grouped[t] = inSlot;
    }

    // 2. TUDO OK! AGORA SIM DESCONTAMOS O SALDO COM SEGURANÇA
    if (useReposicao && clientId) {
      await prisma.client.update({ where: { id: clientId }, data: { repositionCredits: { decrement: datesToCheck.length } } });
    } else if (descontarDoPlano && clientId) {
      await prisma.client.update({ where: { id: clientId }, data: { remainingSessions: { decrement: datesToCheck.length } } });
    }

    // 3. GRAVAR AS AULAS
    const apptsToCreate = datesToCheck.map((req: any) => ({
        clientId: tipoAgendamento === 'REGULAR' ? clientId : undefined,
        tempName: tipoAgendamento === 'EXPERIMENTAL' ? tempName : undefined,
        tempPhone: tipoAgendamento === 'EXPERIMENTAL' ? tempPhone : undefined,
        instructor: req.instructor, type: finalType as any, date: req.date, status: 'AGENDADO' as any
    }));
    
    const createdAppts = await Promise.all(apptsToCreate.map((data: any) => prisma.appointment.create({ data })));

    // 4. GERAR FINANCEIRO SE FOR O CASO
    if (!useReposicao && !descontarDoPlano) {
      let precoPilatesAvulso = 100.00; let precoFisio = 150.00; let precoExp = 50.00;
      try {
        const settings = await prisma.settings.findFirst();
        if (settings) { precoPilatesAvulso = Number(settings.pricePilates); precoFisio = Number(settings.priceFisio); precoExp = Number(settings.priceExp); }
      } catch (e) {}

      if (valorPersonalizado !== undefined && valorPersonalizado !== null) {
        if (tipoAgendamento === 'EXPERIMENTAL') precoExp = Number(valorPersonalizado);
        else if (serviceType === 'FISIOTERAPIA') precoFisio = Number(valorPersonalizado);
        else precoPilatesAvulso = Number(valorPersonalizado);
      }

      const transacoesFinanceiras = [];
      for (const appt of createdAppts) {
        let amountToCharge = precoPilatesAvulso;
        let txTitle = 'Aula Avulsa de Pilates (Extra Plano)';

        if (finalType === 'FISIO_SESSAO') { amountToCharge = precoFisio; txTitle = 'Sessão de Fisioterapia'; }
        if (finalType === 'EXPERIMENTAL') { amountToCharge = precoExp; txTitle = 'Sessão Experimental'; }

        transacoesFinanceiras.push({
          title: txTitle, amount: amountToCharge, type: 'RECEITA', category: 'SESSAO_AVULSA', status: 'PENDENTE', paymentMethod: 'PIX', clientId: tipoAgendamento === 'REGULAR' ? clientId : undefined, appointmentId: appt.id, date: new Date()
        });
      }
      if (transacoesFinanceiras.length > 0) await prisma.transaction.createMany({ data: transacoesFinanceiras as any });
    }

    revalidatePath('/agendamentos'); revalidatePath('/financeiro');
    return { sucesso: true };
  } catch (erro) {
    return { sucesso: false, erro: "Falha crítica ao gravar no banco." };
  }
}

// ==========================================
// 7. CONFIGURAÇÕES ADICIONAIS
// ==========================================
export async function createInstructorBlock(data: { instructor: string, date: string, startTime: string, endTime: string, reason?: string }) {
  try {
    const dataBloqueio = new Date(`${data.date}T12:00:00-03:00`);
    await prisma.instructorBlock.create({ data: { ...data, date: dataBloqueio } });
    revalidatePath('/configuracoes'); revalidatePath('/agendamentos/novo');
    return { sucesso: true };
  } catch (error) { return { sucesso: false, erro: "Falha ao criar bloqueio." }; }
}

export async function getInstructorBlocks() {
  const hoje = new Date(); hoje.setHours(0,0,0,0);
  return await prisma.instructorBlock.findMany({ where: { date: { gte: hoje } }, orderBy: { date: 'asc' } });
}

export async function deleteInstructorBlock(id: string) {
  try {
    await prisma.instructorBlock.delete({ where: { id } });
    revalidatePath('/configuracoes'); revalidatePath('/agendamentos/novo');
    return { sucesso: true };
  } catch (error) { return { sucesso: false }; }
}

export async function getSettings() {
  try {
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          studioName: "MRF Pilates", openTime: "07:00", closeTime: "19:00", priceFisio: 150.00, pricePilates: 100.00, priceExp: 50.00,
          plan1xMensal: 150.00, plan1xTrimestral: 400.00, plan1xSemestral: 750.00, plan2xMensal: 250.00, plan2xTrimestral: 700.00, plan2xSemestral: 1300.00, plan3xMensal: 350.00, plan3xTrimestral: 1000.00, plan3xSemestral: 1800.00,
          msgFatura: "Olá...", msgAtraso: "Olá...", msgConfirmacao: "Olá...", msgAniversario: "Parabéns...", msgProspeccao: "Olá..."
        }
      });
    }
    return settings;
  } catch (error) { return null; }
}

export async function updateSettings(dados: any) {
  try {
    const settings = await prisma.settings.findFirst();
    if (settings) await prisma.settings.update({ where: { id: settings.id }, data: dados });
    else await prisma.settings.create({ data: dados });
    revalidatePath('/configuracoes'); revalidatePath('/agendamentos'); revalidatePath('/agendamentos/novo'); 
    return { sucesso: true };
  } catch (error) { return { sucesso: false }; }
}

export async function checkDailyAvailability(dateStr: string) {
  try {
    const startOfDay = new Date(`${dateStr}T00:00:00-03:00`);
    const endOfDay = new Date(`${dateStr}T23:59:59-03:00`);

    const appointments = await prisma.appointment.findMany({
      where: { date: { gte: startOfDay, lte: endOfDay }, status: { notIn: ['CANCELADO'] } },
      select: { date: true, instructor: true }
    });
    const blocks = await prisma.instructorBlock.findMany({ where: { date: { gte: startOfDay, lte: endOfDay } } });

    const availability: Record<string, { total: number, Marisa: number, Loani: number, MarisaBlocked: boolean, LoaniBlocked: boolean }> = {};
    const horariosDisponiveisBase = ["07:30", "08:30", "09:30", "10:30", "11:30", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

    horariosDisponiveisBase.forEach(time => {
      availability[time] = { total: 0, Marisa: 0, Loani: 0, MarisaBlocked: false, LoaniBlocked: false };
      blocks.forEach(b => {
        if (time >= b.startTime && time <= b.endTime) {
          if (b.instructor === 'Marisa') availability[time].MarisaBlocked = true;
          if (b.instructor === 'Loani') availability[time].LoaniBlocked = true;
        }
      });
    });

    appointments.forEach(app => {
      const formatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' });
      const timeKey = formatter.format(app.date);
      if (!availability[timeKey]) availability[timeKey] = { total: 0, Marisa: 0, Loani: 0, MarisaBlocked: false, LoaniBlocked: false };
      availability[timeKey].total += 1;
      if (app.instructor === 'Marisa') availability[timeKey].Marisa += 1;
      if (app.instructor === 'Loani') availability[timeKey].Loani += 1;
    });

    return availability; 
  } catch (error) { return {}; }
}