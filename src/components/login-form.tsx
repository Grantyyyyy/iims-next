'use client'

import { useActionState, useState } from "react"
import { useForm } from "react-hook-form"
import { loginAction } from "@/actions/auth"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Eye, EyeOff, MousePointerClick } from "lucide-react"

const DEV_ACCOUNTS = [
  { role: 'Admin', email: 'admin@test.com', password: 'password123', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { role: 'Secretary', email: 'secretary@test.com', password: 'password123', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { role: 'Labtech', email: 'labtech@test.com', password: 'password123', color: 'bg-green-100 text-green-700 border-green-200' },
  { role: 'Dean', email: 'dean@test.com', password: 'password123', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { role: 'Staff', email: 'staff@test.com', password: 'password123', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { role: 'Ictc', email: 'ictc@test.com', password: 'password123', color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  { role: 'Supply', email: 'supply@test.com', password: 'password123', color: 'bg-orange-100 text-orange-700 border-orange-200' },
]

export function LoginForm({
  className,
  serverError,
  ...props
}: React.ComponentProps<"div"> & { serverError?: string | null }) {
  const [state, formAction, isPending] = useActionState(loginAction, null)
  const [showPassword, setShowPassword] = useState(false)

  const isDev = process.env.NODE_ENV === 'development'

  const displayError = state?.error || (serverError === 'account_deactivated'
    ? 'Your account has been deactivated. Please contact an administrator.'
    : serverError ? 'An error occurred. Please try again.'
      : null)

  const { register, setValue } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  })

  const fillCredentials = (email: string, pass: string) => {
    setValue('email', email)
    setValue('password', pass)
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0 border-0 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/60 backdrop-blur-xl ring-1 ring-zinc-200/50">
        <CardContent className={cn("grid p-0", isDev ? "md:grid-cols-2" : "grid-cols-1")}>
          <form action={formAction} className="p-6 md:p-10 flex flex-col justify-center bg-white">
            <FieldGroup className="max-w-[320px] mx-auto w-full gap-4">
              <div className="flex flex-col items-center gap-2 text-center mb-5">
                <div className="w-10 h-10 bg-zinc-950 text-white rounded-xl flex items-center justify-center shadow-lg shadow-zinc-950/20 mb-1">
                  <span className="text-lg font-bold tracking-tighter">IIMS</span>
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Welcome back</h1>
                <p className="text-zinc-500 text-xs">
                  Please enter your details to sign in
                </p>
              </div>
              <Field className="space-y-1.5">
                <FieldLabel htmlFor="email" className="text-zinc-700 font-medium text-sm">Email address</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  className="h-10 px-3 rounded-lg bg-zinc-50/50 border-zinc-200/80 focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:border-zinc-400 transition-all placeholder:text-zinc-400 text-sm"
                  {...register('email')}
                />
              </Field>
              <Field className="space-y-1.5">
                <FieldLabel htmlFor="password" className="text-zinc-700 font-medium text-sm">Password</FieldLabel>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    className="h-10 px-3 pr-10 rounded-lg bg-zinc-50/50 border-zinc-200/80 focus-visible:ring-1 focus-visible:ring-zinc-400 focus-visible:border-zinc-400 transition-all placeholder:text-zinc-400 text-sm"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
                  </button>
                </div>
              </Field>
              {displayError && (
                <div className="text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 select-none flex items-center gap-2 mt-1">
                  <span className="w-1 h-1 rounded-full bg-red-600 animate-pulse" />
                  {displayError}
                </div>
              )}
              <Field className="pt-2">
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-10 text-sm font-medium rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white shadow-md shadow-zinc-950/10 transition-all hover:-translate-y-0.5"
                >
                  {isPending ? 'Signing in...' : 'Sign in'}
                </Button>
              </Field>
              <FieldDescription className="text-center text-[11px] text-zinc-400 mt-2">
                Access is strictly restricted to authorized personnel.
              </FieldDescription>
            </FieldGroup>
          </form>

          {isDev && (
            <div className="bg-zinc-950 p-6 md:p-10 text-zinc-400 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none transform translate-x-1/3 -translate-y-1/3" />

              <div className="mb-6 relative z-10 text-center md:text-left">
                <h2 className="text-lg font-medium text-white flex items-center justify-center md:justify-start gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Test Credentials
                </h2>
                <p className="text-xs mt-1.5 opacity-80">
                  Development environment only.
                </p>
              </div>

              <div className="grid gap-2 relative z-10 max-w-[320px] mx-auto md:mx-0 w-full">
                {DEV_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillCredentials(acc.email, acc.password)}
                    className="group flex flex-col items-start p-3 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 text-left relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <Badge variant="outline" className={cn("text-[9px] font-semibold px-1.5 py-0 h-4 border-white/10 shadow-none uppercase tracking-wider", acc.color.replace('bg-', 'bg-').replace('text-', 'text-').replace('border-', 'border-').replace(/100/g, '500/10').replace(/700/g, '400').replace(/200/g, '500/20'))}>
                        {acc.role}
                      </Badge>
                      <MousePointerClick className="w-3.5 h-3.5 text-zinc-600 group-hover:text-white transition-colors duration-300" />
                    </div>
                    <span className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors duration-300">{acc.email}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
