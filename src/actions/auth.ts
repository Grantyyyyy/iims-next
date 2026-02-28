'use server'

import { createSession, deleteSession } from '@/lib/session'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'

export async function loginAction(prevState: any, formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
        return { error: 'Please enter both email and password.' }
    }

    const user = await prisma.user.findUnique({
        where: { email },
    })

    if (!user || !user.passwordHash) {
        return { error: 'Invalid credentials.' }
    }

    const passwordsMatch = await bcrypt.compare(password, user.passwordHash)

    if (!passwordsMatch) {
        return { error: 'Invalid credentials.' }
    }

    if (!user.isActive) {
        return { error: 'Your account has been deactivated. Please contact an administrator.' }
    }

    await createSession(user.id)
    redirect('/dashboard')
}

export async function logoutAction() {
    await deleteSession()
    redirect('/login')
}
