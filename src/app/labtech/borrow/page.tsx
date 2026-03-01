import { requirePermission } from "@/lib/permissions"
import LabBorrowClient from "./LabBorrowClient"
import prisma from '@/lib/prisma'

export default async function LabtechBorrowPage() {
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

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Equipment & Apparatus Borrowing</h2>
            </div>

            <LabBorrowClient
                equipment={equipment}
                apparatus={apparatus}
            />
        </div>
    )
}
