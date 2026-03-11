'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/permissions'

export async function getUsers() {
    await requirePermission('view:users')
    try {
        return await prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                username: true,
                profilePicUrl: true,
                isActive: true,
                createdAt: true,
                department: true,
                roles: {
                    select: {
                        role: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
    } catch (error) {
        console.error('Error fetching users:', error)
        return []
    }
}

export async function updateUserRoles(userId: number, roleNames: string[]) {
    await requirePermission('manage:users')
    try {
        // Find existing role IDs for the names
        const roles = await prisma.role.findMany({
            where: {
                name: { in: roleNames }
            }
        })

        const roleIds = roles.map((r: { id: number }) => r.id)

        // Reset roles for this user
        await prisma.userRole.deleteMany({
            where: { userId }
        })

        // Add new roles
        await prisma.userRole.createMany({
            data: roleIds.map((roleId: number) => ({
                userId,
                roleId
            }))
        })

        revalidatePath('/users/list')
        return { success: true }
    } catch (error) {
        console.error('Error updating user roles:', error)
        return { error: 'Failed to update roles.' }
    }
}

export async function getDepartments() {
    await requirePermission('view:departments')
    try {
        return await prisma.department.findMany({
            include: {
                _count: {
                    select: { users: true }
                }
            }
        })
    } catch (error) {
        console.error('Error fetching departments:', error)
        return []
    }
}

export async function createDepartment(name: string) {
    await requirePermission('manage:users')
    try {
        await prisma.department.create({
            data: { name }
        })
        revalidatePath('/users/departments')
        return { success: true }
    } catch (error) {
        console.error('Error creating department:', error)
        return { error: 'Failed to create department.' }
    }
}
