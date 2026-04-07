import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Limpando banco de dados (CUIDADO: Isso apaga todos os dados atuais)...')
  
  // Apaga tudo na ordem certa para não quebrar as relações
  await prisma.transaction.deleteMany()
  await prisma.evolution.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.client.deleteMany()
}