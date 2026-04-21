'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/permissions'

export async function getLabCategories() {
    await requirePermission('view:equipment')

    return await prisma.labCategory.findMany({
        orderBy: { name: 'asc' }
    })
}

export async function createLabCategory(name: string) {
    const { roles } = await requirePermission('manage:equipment')

    if (roles.includes('DEAN')) {
        return { success: false, error: 'Dean role does not have permission to perform this action.' }
    }

    try {
        await prisma.labCategory.create({
            data: { name }
        })
        revalidatePath('/equipment/categories')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to create category' }
    }
}

export async function updateLabCategory(id: number, name: string) {
    const { roles } = await requirePermission('manage:equipment')

    if (roles.includes('DEAN')) {
        return { success: false, error: 'Dean role does not have permission to perform this action.' }
    }

    try {
        await prisma.labCategory.update({
            where: { id },
            data: { name }
        })
        revalidatePath('/equipment/categories')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to update category' }
    }
}

export async function deleteLabCategory(id: number) {
    const { roles } = await requirePermission('manage:equipment')

    if (roles.includes('DEAN')) {
        return { success: false, error: 'Dean role does not have permission to perform this action.' }
    }

    try {
        await prisma.labCategory.delete({
            where: { id }
        })
        revalidatePath('/equipment/categories')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to delete category' }
    }
}
