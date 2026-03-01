'use server'

import prisma from '@/lib/prisma'
import { requirePermission } from '@/lib/permissions'

// Utility function for searching equipment/apparatus for borrow page
// Note: This is kept for backward compatibility but direct imports are preferred
export async function searchEquipmentForBorrow() {
    await requirePermission('manage:equipment')
    
    const [equipment, apparatus] = await Promise.all([
        prisma.equipment.findMany({
            where: { deletedAt: null },
            include: {
                category: true,
                instances: {
                    where: {
                        deletedAt: null,
                        labBorrowRecords: {
                            none: {
                                returnDate: null
                            }
                        }
                    },
                    orderBy: { inventoryNumber: 'asc' }
                }
            }
        }),
        prisma.apparatus.findMany({
            where: {
                deletedAt: null,
                apparatusType: 'Non-Consumables'
            },
            include: {
                category: true,
                instances: {
                    where: {
                        deletedAt: null,
                        labBorrowRecords: {
                            none: {
                                returnDate: null
                            }
                        }
                    },
                    orderBy: { inventoryNumber: 'asc' }
                }
            }
        })
    ])
    
    return { equipment, apparatus }
}
