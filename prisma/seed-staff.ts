import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })


async function main() {
    console.log('--- Staff Seed: Starting ---')

    // 1. Get staff user (must run main seed.ts first)
    const staff = await prisma.user.findFirst({ where: { username: 'staffuser' } })
    if (!staff) {
        console.error('staffuser not found — run: npx tsx prisma/seed.ts first')
        return
    }

    const labtech = await prisma.user.findFirst({ where: { username: 'labtech' } })
    if (!labtech) {
        console.error('labtech user not found — run main seed first')
        return
    }

    // Get or create a room
    let room = await prisma.room.findFirst()
    if (!room) {
        let dept = await prisma.department.findFirst()
        if (!dept) {
            dept = await prisma.department.create({ data: { name: 'Natural Sciences' } })
        }
        room = await prisma.room.create({
            data: { name: 'Lab Room 1', location: 'Building A', departmentId: dept.id },
        })
    }

    // 2. ── BorrowRecords ─────────────────────────────────────────────────────
    // Get/create an ItemInstance to borrow
    let itemInst = await prisma.itemInstance.findFirst()
    if (!itemInst) {
        let item = await prisma.item.findFirst()
        let category = await prisma.category.findFirst()
        if (!category) {
            category = await prisma.category.create({ data: { name: 'Electronics' } })
        }
        if (!item) {
            item = await prisma.item.create({
                data: { name: 'HP Laptop', itemType: 'Non-Consumables', categoryId: category.id },
            })
        }
        itemInst = await prisma.itemInstance.create({
            data: {
                itemId: item.id,
                inventoryNumber: `STAFF-INST-001`,
                currentCondition: 'Good',
                unitCost: 40000,
                quantity: 1,
            },
        })
    }

    // Active borrow (no returnRecord)
    const existingActive = await prisma.borrowRecord.findFirst({
        where: { borrowerId: staff.id, returnRecord: null },
    })
    if (!existingActive) {
        console.log('Creating active BorrowRecord...')
        await prisma.borrowRecord.create({
            data: {
                borrowerId: staff.id,
                itemInstanceId: itemInst.id,
                roomId: room.id,
                borrowDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                duration: 7,
                purpose: 'Faculty use for IT presentation',
                quantity: 1,
            },
        })
    }

    // Returned borrow
    const existingReturned = await prisma.borrowRecord.findFirst({
        where: { borrowerId: staff.id, returnRecord: { isNot: null } },
    })
    if (!existingReturned) {
        console.log('Creating returned BorrowRecord...')
        const returnedBorrow = await prisma.borrowRecord.create({
            data: {
                borrowerId: staff.id,
                itemInstanceId: itemInst.id,
                roomId: room.id,
                borrowDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                duration: 5,
                purpose: 'Department meeting equipment',
                quantity: 1,
            },
        })
        await prisma.returnRecord.create({
            data: {
                borrowRecordId: returnedBorrow.id,
                itemInstanceId: itemInst.id,
                returnDate: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
                conditionOnReturn: 'Good',
            },
        })
    }

    // 3. ── LabBorrowRecords ─────────────────────────────────────────────────
    // Get an equipment instance
    let eqInst = await prisma.equipmentInstance.findFirst()
    if (eqInst) {
        // Active lab borrow
        const existingActiveLab = await prisma.labBorrowRecord.findFirst({
            where: { borrowerId: staff.id, returnDate: null },
        })
        if (!existingActiveLab) {
            console.log('Creating active LabBorrowRecord...')
            await prisma.labBorrowRecord.create({
                data: {
                    borrowerId: staff.id,
                    equipmentInstanceId: eqInst.id,
                    roomId: room.id,
                    purpose: 'Microbiology practical class',
                    borrowDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
                },
            })
        }

        // Overdue lab borrow (dueDate in the past, no returnDate)
        const existingOverdue = await prisma.labBorrowRecord.findFirst({
            where: {
                borrowerId: staff.id,
                returnDate: null,
                dueDate: { lt: new Date() },
            },
        })
        if (!existingOverdue) {
            // Get a second equipment instance if available
            const eqInst2 = await prisma.equipmentInstance.findFirst({
                where: { id: { not: eqInst.id } },
            })
            const targetInst = eqInst2 || eqInst
            console.log('Creating overdue LabBorrowRecord...')
            await prisma.labBorrowRecord.create({
                data: {
                    borrowerId: staff.id,
                    equipmentInstanceId: targetInst.id,
                    roomId: room.id,
                    purpose: 'Chemistry lab demonstration',
                    borrowDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
                    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days OVERDUE
                },
            })
        }
    } else {
        console.warn('No EquipmentInstance found — skipping lab borrow records')
    }

    // 4. ── ChemicalUsageRecord (isDistribution) ────────────────────────────
    const chemBatch = await prisma.chemicalBatch.findFirst({
        include: { chemical: true },
    })
    if (chemBatch) {
        // Get or create a subject
        let subject = await prisma.subject.findFirst()
        if (!subject) {
            subject = await prisma.subject.create({
                data: { code: 'CHEM101', name: 'General Chemistry I' },
            })
        }

        const existingChem = await (prisma.chemicalUsageRecord as any).findFirst({
            where: { recipientId: staff.id, isDistribution: true },
        })
        if (!existingChem) {
            console.log('Creating ChemicalUsageRecord distributions...')
            // First distribution
            await (prisma.chemicalUsageRecord as any).create({
                data: {
                    chemicalBatchId: chemBatch.id,
                    recipientId: staff.id,
                    isDistribution: true,
                    distributedAmount: 500,
                    distributedUnit: 'ML',
                    quantityUsed: 500,
                    quantityRequested: 500,
                    unit: chemBatch.baseUnit,
                    subjectId: subject.id,
                    roomId: room.id,
                    purpose: 'Lab experiment: acid-base reactions',
                    recordedById: labtech.id,
                    dateUsed: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
                },
            })

            // Second distribution (recent)
            await (prisma.chemicalUsageRecord as any).create({
                data: {
                    chemicalBatchId: chemBatch.id,
                    recipientId: staff.id,
                    isDistribution: true,
                    distributedAmount: 1,
                    distributedUnit: 'L',
                    quantityUsed: 1000,
                    quantityRequested: 1000,
                    unit: 'ML', // base unit
                    subjectId: subject.id,
                    roomId: room.id,
                    purpose: 'Titration experiment',
                    recordedById: labtech.id,
                    dateUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                },
            })
        }
    } else {
        console.warn('No ChemicalBatch found — skipping chemical records')
    }

    console.log('--- Staff Seed Completed ---')
    console.log('Login: staff@test.com / password123')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
