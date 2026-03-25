"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Simular delay de autenticacao
    await new Promise((resolve) => setTimeout(resolve, 1200))

    // Mock login - aceita qualquer email/senha
    if (email && password) {
      router.push("/")
    } else {
      setError("Preencha todos os campos.")
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-primary relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 h-64 w-64 rounded-full bg-primary-foreground blur-3xl" />
          <div className="absolute bottom-32 right-16 h-48 w-48 rounded-full bg-primary-foreground blur-3xl" />
          <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-foreground blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-8 px-12 text-center">
          <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-primary-foreground/15 backdrop-blur-sm border border-primary-foreground/20">
            <Image
              src="/logo.png"
              alt="MRF Pilates"
              width={96}
              height={96}
              className="h-24 w-24 object-contain"
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-primary-foreground tracking-tight">
              MRF Studio
            </h1>
            <p className="mt-2 text-lg text-primary-foreground/80 font-light">
              Pilates e Fisioterapia
            </p>
          </div>
          <div className="mt-4 max-w-sm">
            <p className="text-sm text-primary-foreground/60 leading-relaxed">
              Sistema de gestao clinica integrado para o gerenciamento completo do seu studio.
            </p>
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex w-full items-center justify-center px-6 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-10 flex flex-col items-center lg:hidden">
            <Image
              src="/logo.png"
              alt="MRF Pilates"
              width={72}
              height={72}
              className="h-18 w-18 object-contain"
            />
            <h1 className="mt-4 text-xl font-bold text-foreground">MRF Studio</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">
              Entrar no sistema
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Insira suas credenciais para acessar o painel.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 rounded-xl border-border bg-card px-4 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Senha
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-border bg-card pr-12 px-4 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3">
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="h-12 w-full rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-sm gap-2.5 text-base"
            >
              {isLoading ? (
                <>
                  <Spinner className="h-4.5 w-4.5" />
                  Entrando...
                </>
              ) : (
                <>
                  <LogIn className="h-4.5 w-4.5" />
                  Entrar
                </>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-muted-foreground/70">
            MRF Studio - Pilates e Fisioterapia
          </p>
        </div>
      </div>
    </div>
  )
}
