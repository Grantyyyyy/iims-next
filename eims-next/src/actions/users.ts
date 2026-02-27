'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getUsers() {
    try {
        return await prisma.user.findMany({
            include: {
                roles: {
                    include: {
                        role: true
                    }
                },
                department: true
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
    try {
        // Find existing role IDs for the names
        const roles = await prisma.role.findMany({
            where: {
                name: { in: roleNames }
            }
        })

        const roleIds = roles.map(r => r.id)

        // Reset roles for this user
        await prisma.userRole.deleteMany({
            where: { userId }
        })

        // Add new roles
        await prisma.userRole.createMany({
            data: roleIds.map(roleId => ({
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
