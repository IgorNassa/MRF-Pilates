import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css" 
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { TimerProvider } from "@/hooks/use-timer" // <-- 1. IMPORTAÇÃO DO PROVIDER AQUI

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MRF Pilates",
  description: "Sistema de Gestão para Studio MRF Pilates",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false} 
          disableTransitionOnChange
        >
          {/* 2. ENVELOPA A APLICAÇÃO COM O TIMER PROVIDER */}
          <TimerProvider>
            {children}
            <Toaster />
          </TimerProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}