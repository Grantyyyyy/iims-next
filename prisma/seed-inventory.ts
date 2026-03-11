import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

import { seedRooms } from './seed-rooms'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const CATEGORY_MAP: Record<string, { code: string; usefulLife: number; minCost: number; maxCost: number }> = {
    'Computers / Laptops': { code: 'COMP', usefulLife: 5, minCost: 35000, maxCost: 65000 },
    'Monitors': { code: 'MON', usefulLife: 5, minCost: 8000, maxCost: 15000 },
    'Keyboards & Mouse': { code: 'KB', usefulLife: 3, minCost: 500, maxCost: 2500 },
    'Printers & Scanners': { code: 'PRN', usefulLife: 5, minCost: 5000, maxCost: 15000 },
    'Projectors': { code: 'PROJ', usefulLife: 5, minCost: 18000, maxCost: 25000 },
    'Cables & Accessories': { code: 'CAB', usefulLife: 2, minCost: 150, maxCost: 500 },
    'USB Drives / Storage': { code: 'USB', usefulLife: 2, minCost: 300, maxCost: 800 },
    'Office Supplies': { code: 'OFF', usefulLife: 1, minCost: 50, maxCost: 500 },
}

const CONSUMABLE_QTY_MAP: Record<string, { min: number; max: number }> = {
    'Bond Paper': { min: 200, max: 500 },
    'Ballpen Box': { min: 20, max: 50 },
    'Whiteboard Markers': { min: 10, max: 30 },
    'HDMI Cable 2m': { min: 20, max: 50 },
    'USB-C Cable': { min: 20, max: 50 },
    'Ethernet Cable Cat6': { min: 30, max: 80 },
    'SanDisk 32GB USB': { min: 10, max: 30 },
    'Kingston 64GB USB': { min: 10, max: 30 },
}

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

async function main() {
    console.log('--- Starting Inventory Seed Fix ---')

    const items = await prisma.item.findMany({
        include: {
            category: true,
            instances: {
                include: {
                    consumableBatches: true
                }
            }
        },
        where: { deletedAt: null }
    })

    const secretary = await prisma.user.findFirst({ where: { username: 'secretary' } })
    if (!secretary) {
        console.error('Secretary user not found. Please run main seed first.')
        return
    }

    const categoryCounters: Record<string, number> = {}

    for (const item of items) {
        const catConfig = CATEGORY_MAP[item.category?.name || ''] || { code: 'ITEM', usefulLife: 3, minCost: 500, maxCost: 5000 }
        const catCode = catConfig.code
        if (!categoryCounters[catCode]) categoryCounters[catCode] = 0

        if (item.itemType === 'Non-Consumables') {
            const instances = item.instances

            // Ensure at least 3 instances for testing if none exist
            if (instances.length === 0) {
                for (let i = 1; i <= 3; i++) {
                    categoryCounters[catCode]++
                    const invNo = `${catCode}-${item.id}-${i.toString().padStart(3, '0')}`
                    const sn = `SN-${catCode}-${categoryCounters[catCode].toString().padStart(3, '0')}`
                    const pDate = randomDate(new Date(2021, 0, 1), new Date(2024, 11, 31))
                    const condition = pDate.getFullYear() < 2023 ? (Math.random() > 0.7 ? 'Fair' : 'Good') : 'Good'

                    await prisma.itemInstance.create({
                        data: {
                            itemId: item.id,
                            inventoryNumber: invNo,
                            serialNumber: sn,
                            unitCost: randomInt(catConfig.minCost, catConfig.maxCost),
                            purchaseDate: pDate,
                            usefulLife: catConfig.usefulLife,
                            currentCondition: condition,
                            quantity: 1
                        }
                    })
                }
            } else {
                for (let idx = 0; idx < instances.length; idx++) {
                    const inst = instances[idx]
                    categoryCounters[catCode]++

                    // Skip if serial number is already in correct format or fixed
                    if (inst.serialNumber && inst.serialNumber.startsWith('SN-') && inst.usefulLife && inst.purchaseDate) {
                        // continue // Don't skip during fix run to ensure consistency
                    }

                    const i = idx + 1
                    const pDate = inst.purchaseDate || randomDate(new Date(2021, 0, 1), new Date(2024, 11, 31))
                    const condition = pDate.getFullYear() < 2023 ? (Math.random() > 0.7 ? 'Fair' : 'Good') : 'Good'

                    await prisma.itemInstance.update({
                        where: { id: inst.id },
                        data: {
                            serialNumber: inst.serialNumber && inst.serialNumber !== 'N/A' && inst.serialNumber.startsWith('SN-')
                                ? inst.serialNumber
                                : `SN-${catCode}-${categoryCounters[catCode].toString().padStart(3, '0')}`,
                            inventoryNumber: inst.inventoryNumber && !inst.inventoryNumber.includes('ITEM')
                                ? inst.inventoryNumber
                                : `${catCode}-${item.id}-${i.toString().padStart(3, '0')}`,
                            usefulLife: catConfig.usefulLife,
                            unitCost: inst.unitCost && inst.unitCost > 0 ? inst.unitCost : randomInt(catConfig.minCost, catConfig.maxCost),
                            purchaseDate: pDate,
                            currentCondition: inst.currentCondition || condition,
                            quantity: 1
                        }
                    })
                }
            }
        } else {
            // Consumables
            for (const inst of item.instances) {
                // Ensure batches exist
                if (inst.consumableBatches.length === 0) {
                    const numBatches = 3
                    const qtyConfig = CONSUMABLE_QTY_MAP[item.name] || { min: 10, max: 50 }

                    for (let i = 1; i <= numBatches; i++) {
                        const originalQty = randomInt(qtyConfig.min, qtyConfig.max)
                        await prisma.consumableBatch.create({
                            data: {
                                itemInstanceId: inst.id,
                                batchNumber: `BATCH-${item.id}-${i.toString().padStart(3, '0')}`,
                                originalQty,
                                remainingQty: i === 1 ? 0 : originalQty,
                                unitCost: randomInt(catConfig.minCost, catConfig.maxCost),
                                purchaseDate: randomDate(new Date(2023, 0, 1), new Date(2024, 11, 31)),
                                addedById: secretary.id,
                                notes: `Seeded batch ${i}`
                            }
                        })
                    }
                } else {
                    for (const batch of inst.consumableBatches) {
                        const qtyConfig = CONSUMABLE_QTY_MAP[item.name] || { min: 10, max: 50 }
                        await prisma.consumableBatch.update({
                            where: { id: batch.id },
                            data: {
                                unitCost: batch.unitCost && batch.unitCost > 0 ? batch.unitCost : randomInt(catConfig.minCost, catConfig.maxCost),
                                purchaseDate: batch.purchaseDate || randomDate(new Date(2023, 0, 1), new Date(2024, 11, 31)),
                                originalQty: batch.originalQty > 0 ? batch.originalQty : randomInt(qtyConfig.min, qtyConfig.max),
                                remainingQty: batch.remainingQty > 0 ? batch.remainingQty : (batch.originalQty > 0 ? batch.originalQty : randomInt(qtyConfig.min, qtyConfig.max))
                            }
                        })
                    }
                }

                // Update instance quantity
                const batchSum = await prisma.consumableBatch.aggregate({
                    where: { itemInstanceId: inst.id },
                    _sum: { remainingQty: true }
                })
                await prisma.itemInstance.update({
                    where: { id: inst.id },
                    data: { quantity: batchSum._sum.remainingQty || 0 }
                })
            }
        }
    }

    // Final total quantity update for all items
    const allItems = await prisma.item.findMany({ include: { instances: true } })
    for (const item of allItems) {
        const totalQty = item.instances.reduce((sum, inst) => sum + inst.quantity, 0)
        await prisma.item.update({
            where: { id: item.id },
            data: { quantity: totalQty }
        })
    }

    console.log('--- Inventory Seed Fix Completed ---')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
