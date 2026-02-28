import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="bg-zinc-50 flex min-h-svh flex-col items-center justify-center p-6 md:p-10 relative">
      <div className={`w-full ${isDev ? 'max-w-sm md:max-w-4xl' : 'max-w-sm'}`}>
        <LoginForm />
      </div>
    </div>
  )
}
