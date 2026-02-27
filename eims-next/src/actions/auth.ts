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

    await createSession(user.id)
    redirect('/dashboard')
}

export async function signupAction(prevState: any, formData: FormData) {
    const username = formData.get('username') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!username || !email || !password) {
        return { error: 'Please enter all required fields.' }
    }

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [{ email }, { username }]
        }
    })

    if (existingUser) {
        return { error: 'User with this email or username already exists.' }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // Start with default role "STAFF"
    const defaultRole = await prisma.role.upsert({
        where: { name: 'STAFF' },
        update: {},
        create: { name: 'STAFF' },
    })

    const user = await prisma.user.create({
        data: {
            username,
            email,
            passwordHash,
            roles: {
                create: {
                    roleId: defaultRole.id
                }
            }
        },
    })

    await createSession(user.id)
    redirect('/dashboard')
}

export async function logoutAction() {
    await deleteSession()
    redirect('/login')
}
