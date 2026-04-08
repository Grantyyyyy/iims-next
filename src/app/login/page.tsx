import { LoginForm } from "@/components/login-form"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const isDev = process.env.NODE_ENV === 'development'
  const sp = await searchParams
  const error = sp?.error

  return (
    <div className="bg-zinc-50 flex min-h-svh flex-col items-center justify-center p-6 md:p-10 relative">
      <div className={`w-full ${isDev ? 'max-w-sm md:max-w-4xl' : 'max-w-sm'}`}>
        <LoginForm serverError={error || null} />
      </div>
    </div>
  )
}
