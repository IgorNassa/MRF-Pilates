// middleware.ts
import { withAuth } from "next-auth/middleware";

// O withAuth envolve o middleware padrão do NextAuth
export default withAuth({
  pages: {
    signIn: "/login", // Para onde o utilizador é expulso se não estiver logado
  },
});

// Aqui você diz ao segurança QUAIS rotas ele deve proteger
export const config = {
  matcher: [
    // O painel principal (Dashboard)
    "/", 
    // Qualquer coisa dentro de agendamentos
    "/agendamentos/:path*", 
    // Qualquer coisa dentro de clientes
    "/clientes/:path*", 
    // Qualquer coisa dentro de financeiro
    "/financeiro/:path*", 
    // Configurações
    "/configuracoes/:path*", 
  ],
};