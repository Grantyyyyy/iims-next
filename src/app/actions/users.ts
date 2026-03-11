'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'
import { Prisma } from '@prisma/client'

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createUserSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(50),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    role: z.enum(['ADMIN', 'SECRETARY', 'LABTECH', 'DEAN', 'STAFF', 'ICTC', 'SUPPLY']),
    departmentId: z.preprocess((val) => (val === "" || val === "none" ? null : val), z.coerce.number().nullable()),
    contactNumber: z.preprocess((val) => (val === "" ? null : val), z.string().nullable()),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
})

const updateUserSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(50),
    password: z.string().optional().or(z.literal('')),
    role: z.enum(['ADMIN', 'SECRETARY', 'LABTECH', 'DEAN', 'STAFF', 'ICTC', 'SUPPLY']),
    departmentId: z.preprocess((val) => (val === "" || val === "none" ? null : val), z.coerce.number().nullable()),
    contactNumber: z.preprocess((val) => (val === "" ? null : val), z.string().nullable()),
})

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export async function getUsers() {
    await requirePermission('view:users')

    return await prisma.user.findMany({
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
            contactNumber: true,
            profilePicUrl: true,
            barcodeValue: true,
            customId: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            departmentId: true,
            department: true,
            roles: {
                select: {
                    roleId: true,
                    role: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })
}

export async function getUserById(id: number) {
    await requirePermission('view:users')

    return await prisma.user.findUnique({
        where: { id },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            username: true,
            contactNumber: true,
            profilePicUrl: true,
            barcodeValue: true,
            customId: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            departmentId: true,
            department: true,
            roles: {
                select: {
                    roleId: true,
                    role: true
                }
            }
        }
    })
}

export async function createUser(formData: FormData) {
    const { roles } = await requirePermission('manage:users')

    if (roles.includes('DEAN')) {
        return { error: { root: ['Dean role does not have permission to perform this action.'] } }
    }

    const rawData = Object.fromEntries(formData.entries())
    const validated = createUserSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors }
    }

    const { password, role, ...data } = validated.data

    // Check uniqueness
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: data.email },
                { username: data.username }
            ]
        }
    })

    if (existingUser) {
        if (existingUser.email === data.email) {
            return { error: { email: ['Email already exists'] } }
        }
        return { error: { username: ['Username already exists'] } }
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // Auto-generate customId
    const lastUser = await prisma.user.findFirst({
        where: { NOT: { customId: null } },
        orderBy: { customId: 'desc' }
    })

    const customId = lastUser?.customId ? lastUser.customId + 1 : 1000
    const barcodeValue = `IIMS-${customId}`

    try {
        const userRole = await prisma.role.findUnique({
            where: { name: role }
        })

        if (!userRole) {
            return { error: { role: ['Role not found'] } }
        }

        await prisma.user.create({
            data: {
                ...data,
                passwordHash,
                customId,
                barcodeValue,
                roles: {
                    create: {
                        roleId: userRole.id
                    }
                }
            }
        })

        revalidatePath('/dashboard/users')
        revalidatePath('/users/list') // Sync both possible paths
        return { success: true }
    } catch (err) {
        console.error(err)
        return { error: { root: ['Failed to create user'] } }
    }
}

export async function updateUser(id: number, formData: FormData) {
    const { user: currentUser, roles } = await requirePermission('manage:users')

    if (roles.includes('DEAN')) {
        return { error: { root: ['Dean role does not have permission to perform this action.'] } }
    }

    const rawData = Object.fromEntries(formData.entries())
    const validated = updateUserSchema.safeParse(rawData)

    if (!validated.success) {
        return { error: validated.error.flatten().fieldErrors }
    }

    const { password, role, ...data } = validated.data

    // Prevent self-lockout: Admin cannot change their own role unless they are the only admin?
    // Actually the prompt says: "Cannot edit own role (prevent self-lockout)"
    if (id === currentUser.id && role !== 'ADMIN') {
        // We should check if current user is indeed having ADMIN role in form
        // Let's check current roles in DB
        const existingUser = await prisma.user.findUnique({
            where: { id },
            select: {
                roles: {
                    select: {
                        role: { select: { name: true } }
                    }
                }
            }
        })

        const currentRoles = existingUser?.roles.map((r) => r.role.name) || []
        if (currentRoles.includes('ADMIN')) {
            return { error: { role: ['You cannot change your own ADMIN role'] } }
        }
    }

    // Check uniqueness for email/username if changed
    const existingUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: data.email },
                { username: data.username }
            ],
            NOT: { id }
        }
    })

    if (existingUser) {
        if (existingUser.email === data.email) {
            return { error: { email: ['Email already exists'] } }
        }
        return { error: { username: ['Username already exists'] } }
    }

    const updateData: Prisma.UserUpdateInput = { ...data }

    if (password && password.length >= 8) {
        updateData.passwordHash = await bcrypt.hash(password, 10)
    }

    try {
        const targetRole = await prisma.role.findUnique({
            where: { name: role }
        })

        if (!targetRole) {
            return { error: { role: ['Role not found'] } }
        }

        // Role update: Delete existing roles and add new one
        // Note: IIMS seems to support multiple roles per user in schema, 
        // but the UI only allows one. We'll stick to one.
        await prisma.$transaction([
            prisma.userRole.deleteMany({ where: { userId: id } }),
            prisma.user.update({
                where: { id },
                data: {
                    ...updateData,
                    roles: {
                        create: {
                            roleId: targetRole.id
                        }
                    }
                }
            })
        ])

        revalidatePath('/dashboard/users')
        revalidatePath('/users/list')
        return { success: true }
    } catch (err) {
        console.error(err)
        return { error: { root: ['Failed to update user'] } }
    }
}

export async function toggleUserStatus(id: number) {
    const { user: currentUser, roles } = await requirePermission('manage:users')

    if (roles.includes('DEAN')) {
        return { error: 'Dean role does not have permission to perform this action.' }
    }

    try {
        if (id === currentUser.id) {
            return { error: 'You cannot deactivate yourself' }
        }

        const user = await prisma.user.findUnique({
            where: { id },
            select: { isActive: true }
        })

        if (!user) {
            return { error: 'User not found' }
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { isActive: !user.isActive }
        })

        revalidatePath('/dashboard/users')
        revalidatePath('/users/list')

        return {
            success: true,
            isActive: updatedUser.isActive
        }
    } catch (err) {
        console.error('Toggle status error:', err)
        return { error: 'Failed to update user status in database' }
    }
}

export async function getDepartments() {
    return await prisma.department.findMany({
        orderBy: { name: 'asc' }
    })
}
