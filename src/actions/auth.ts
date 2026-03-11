'use server'

import { createSession, deleteSession } from '@/lib/session'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
})

export async function loginAction(prevState: unknown, formData: FormData) {
    const rawData = {
        email: formData.get('email'),
        password: formData.get('password')
    }

    const validated = loginSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: 'Invalid credentials.' }
    }

    const { email, password } = validated.data

    const user = await prisma.user.findUnique({
        where: { email },
    })

    if (!user || !user.passwordHash) {
        return { error: 'Invalid credentials.' }
    }

    const passwordsMatch = await bcrypt.compare(password, user.passwordHash)

    if (!passwordsMatch || !user.isActive) {
        return { error: 'Invalid credentials.' }
    }

    await createSession(user.id)
    redirect('/dashboard')
}

export async function logoutAction() {
    await deleteSession()
    redirect('/login')
}
