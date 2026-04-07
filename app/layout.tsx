import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

// 1. ADICIONE ESTAS DUAS LINHAS
import { TimerProvider } from "@/hooks/use-timer";
import { GlobalTimer } from "@/components/global-timer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MRF Pilates - Gestão",
  description: "Sistema de gestão para estúdios de Pilates",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            
            {/* 2. ENVOLVA O SEU SISTEMA COM O PROVIDER */}
            <TimerProvider>
              {children}
              <GlobalTimer /> {/* A bolinha mágica nasce aqui */}
            </TimerProvider>

            <Toaster />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}