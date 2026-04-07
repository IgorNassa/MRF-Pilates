const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('Sincronizando Doutoras no banco de dados...')
  
  const senhaMRF = await bcrypt.hash('MRFfisio@26!', 10)

  const draMarisa = await prisma.User.upsert({
    where: { email: 'marisa.stoicov@gmail.com' }, 
    update: { password: senhaMRF },
    create: {
      name: 'Marisa',
      email: 'marisa.stoicov@gmail.com',
      password: senhaMRF,
    },
  })

  const draLoani = await prisma.User.upsert({
    where: { email: 'loaniglobes3@gmail.com' }, 
    update: { password: senhaMRF },
    create: {
      name: 'Loani',
      email: 'loaniglobes3@gmail.com',
      password: senhaMRF,
    },
  })

  console.log(`✅ Contas sincronizadas: ${draMarisa.name} e ${draLoani.name}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })