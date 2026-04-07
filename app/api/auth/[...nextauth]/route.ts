import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Senha", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) throw new Error('Preencha todos os campos')
        
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user) throw new Error('E-mail não autorizado')

        const senhaCorreta = await bcrypt.compare(credentials.password, user.password)
        if (!senhaCorreta) throw new Error('Senha incorreta')

        return { id: user.id, name: user.name, email: user.email }
      }
    })
  ],
  callbacks: {
    // Essa é a barreira de segurança para o Google
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        
        // Verifica se o Gmail que tentou logar existe na nossa tabela User
        const usuarioAutorizado = await prisma.user.findUnique({
          where: { email: user.email }
        });

        if (!usuarioAutorizado) {
          return false; // Bloqueia sumariamente se não for a Marisa ou a Loani
        }
        return true; // Deixa entrar!
      }
      return true; // Deixa entrar quem usou email e senha corretos
    }
  },
  pages: {
    signIn: '/login',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || "chave-secreta-muito-segura-mrf",
})

export { handler as GET, handler as POST }