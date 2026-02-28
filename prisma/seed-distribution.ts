import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

import { seedRooms } from './seed-rooms'

const prismaClientSingleton = () => {
    const prismaConfig = {
        url: process.env.DATABASE_URL as string,
    }
    const adapter = new PrismaLibSql(prismaConfig)
    return new PrismaClient({ adapter })
}

const prisma = prismaClientSingleton()

async function main() {
    console.log('--- Starting Distribution Seeding ---')

    // 1 & 2. Master Data: Departments and Rooms - HANDLED BY SEPARATE SEEDER
    const seededRooms = await seedRooms(prisma)

    // 3. Fetch Required Users
    const secretary = await prisma.user.findFirst({ where: { username: 'secretary' } })
    const staff = await prisma.user.findFirst({ where: { username: 'staffuser' } })
    if (!secretary || !staff) throw new Error('Required users (secretary/staff) not found. Run main seed first.')

    // 4. Distribution: Non-Consumable Item (Example: Dell Inspiron 15)
    console.log('Seeding Non-Consumable distribution...')
    const laptop = await prisma.item.findFirst({
        where: { name: 'Dell Inspiron 15' },
        include: { instances: true }
    })

    if (laptop && laptop.instances.length > 0) {
        const instanceToDistribute = laptop.instances[0]

        // Check if already distributed
        const existingDist = await prisma.distributionRecord.findFirst({
            where: { itemInstanceId: instanceToDistribute.id, recipientId: staff.id }
        })

        if (!existingDist) {
            await prisma.distributionRecord.create({
                data: {
                    itemInstanceId: instanceToDistribute.id,
                    recipientId: staff.id,
                    distributedById: secretary.id,
                    roomId: seededRooms[0].id,
                    quantity: 1,
                    purpose: 'Assigned for faculty office use.',
                }
            })
            console.log(`Distributed 1 x ${laptop.name} to staffuser.`)

            // Non-consumables often have quantity 1 per instance, so we just track it.
            // In this specific schema, we might not subtract quantity for non-consumables 
            // if "quantity" means "total owned". But if it means "total in stock", we subtract.
            // Let's assume we subtract from instance quantity.
            await prisma.itemInstance.update({
                where: { id: instanceToDistribute.id },
                data: { quantity: { decrement: 1 } }
            })
        }
    }

    // 5. Distribution: Consumable Item (Example: Bond Paper)
    console.log('Seeding Consumable distribution (FIFO)...')
    const paper = await prisma.item.findFirst({
        where: { name: 'Bond Paper' },
        include: {
            instances: {
                include: {
                    consumableBatches: {
                        where: { remainingQty: { gt: 0 } },
                        orderBy: { purchaseDate: 'asc' }
                    }
                }
            }
        }
    })

    if (paper && paper.instances.length > 0) {
        const instance = paper.instances[0]
        const batches = instance.consumableBatches
        let qtyToDistribute = 5 // Suppose we distribute 5 reams

        if (batches.length > 0) {
            for (const batch of batches) {
                if (qtyToDistribute <= 0) break;

                const take = Math.min(batch.remainingQty, qtyToDistribute)

                await prisma.distributionRecord.create({
                    data: {
                        itemInstanceId: instance.id,
                        batchId: batch.id,
                        recipientId: staff.id,
                        distributedById: secretary.id,
                        roomId: seededRooms[2].id,
                        quantity: take,
                        purpose: 'Office supply request for prelim exams.',
                    }
                })

                await prisma.consumableBatch.update({
                    where: { id: batch.id },
                    data: { remainingQty: { decrement: take } }
                })

                qtyToDistribute -= take
            }
            console.log(`Distributed 5 x ${paper.name} (Consumable) using FIFO logic.`)
        }
    }

    // 6. Recalculate Parent Item Quantities
    console.log('Updating item total quantities...')
    const allItems = await prisma.item.findMany({ include: { instances: true } })
    for (const item of allItems) {
        let totalQty = 0
        for (const inst of item.instances) {
            if (item.itemType === 'Consumables') {
                const batchSum = await prisma.consumableBatch.aggregate({
                    where: { itemInstanceId: inst.id },
                    _sum: { remainingQty: true }
                })
                const instQty = batchSum._sum.remainingQty || 0
                await prisma.itemInstance.update({ where: { id: inst.id }, data: { quantity: instQty } })
                totalQty += instQty
            } else {
                totalQty += inst.quantity
            }
        }
        await prisma.item.update({ where: { id: item.id }, data: { quantity: totalQty } })
    }

    console.log('--- Distribution Seeding Completed ---')
}

main()
    .catch((e) => {
        console.error(e)
    })
    .finally(async () => {
        // Cleanup if needed
    })
