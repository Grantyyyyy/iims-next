'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/permissions'

export async function getLabCategories() {
    await requirePermission('manage:equipment')
    
    return await prisma.labCategory.findMany({
        orderBy: { name: 'asc' }
    })
}

export async function createLabCategory(name: string) {
    await requirePermission('manage:equipment')
    
    try {
        await prisma.labCategory.create({
            data: { name }
        })
        revalidatePath('/labtech/categories')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to create category' }
    }
}

export async function updateLabCategory(id: number, name: string) {
    await requirePermission('manage:equipment')
    
    try {
        await prisma.labCategory.update({
            where: { id },
            data: { name }
        })
        revalidatePath('/labtech/categories')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to update category' }
    }
}

export async function deleteLabCategory(id: number) {
    await requirePermission('manage:equipment')
    
    try {
        await prisma.labCategory.delete({
            where: { id }
        })
        revalidatePath('/labtech/categories')
        return { success: true }
    } catch (error) {
        return { success: false, error: 'Failed to delete category' }
    }
}
