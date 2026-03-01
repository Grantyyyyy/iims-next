import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'

const prismaClientSingleton = () => {
    const prismaConfig = {
        url: process.env.DATABASE_URL as string,
    }
    const adapter = new PrismaLibSql(prismaConfig)
    return new PrismaClient({ adapter })
}

const prisma = prismaClientSingleton()

function randomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

async function main() {
    console.log('--- Starting LabTech Module Seed ---')

    // 1. Get reference data
    const labtech = await prisma.user.findFirst({ where: { username: 'labtech' } })
    const staff = await prisma.user.findFirst({ where: { username: 'staffuser' } })
    const room = await prisma.room.findFirst({ where: { name: 'Electronics Lab' } })

    if (!labtech) {
        console.error('LabTech user not found. Please run main seed first.')
        return
    }

    // 2. Lab Categories
    console.log('Seeding Lab Categories...')
    const categories = ['Biology', 'Chemistry', 'Physics', 'General Science']
    const seededCategories = []
    for (const name of categories) {
        let cat = await prisma.labCategory.findFirst({ where: { name } })
        if (!cat) {
            cat = await prisma.labCategory.create({ data: { name } })
        }
        seededCategories.push(cat)
    }

    // 3. Subjects
    console.log('Seeding Subjects...')
    const subjects = [
        { code: 'BIO101', name: 'General Biology I' },
        { code: 'CHEM101', name: 'General Chemistry I' },
        { code: 'PHYS101', name: 'General Physics I' },
        { code: 'BIO201', name: 'Microbiology' }
    ]
    const seededSubjects = []
    for (const s of subjects) {
        const sub = await prisma.subject.upsert({
            where: { code: s.code },
            update: {},
            create: s
        })
        seededSubjects.push(sub)
    }

    // 4. Equipment
    console.log('Seeding Equipment...')
    const equipmentData = [
        { name: 'Microscope', model: 'Olympus CX23', category: 'Biology', cost: 45000 },
        { name: 'Centrifuge', model: 'Eppendorf 5420', category: 'General Science', cost: 85000 },
        { name: 'Spectrophotometer', model: 'Thermo Scientific Genesis 30', category: 'Chemistry', cost: 120000 }
    ]

    for (const eq of equipmentData) {
        const categoryId = seededCategories.find(c => c.name === eq.category)?.id
        const equipment = await prisma.equipment.create({
            data: {
                name: eq.name,
                model: eq.model,
                categoryId: categoryId,
                quantity: 0 // Will update manually
            }
        })

        // Create 3 instances for each
        for (let i = 1; i <= 3; i++) {
            await prisma.equipmentInstance.create({
                data: {
                    equipmentId: equipment.id,
                    inventoryNumber: `EQ-${equipment.id}-${i.toString().padStart(3, '0')}`,
                    serialNumber: `SN-EQ-${equipment.id}-${i}`,
                    unitCost: eq.cost,
                    purchaseDate: randomDate(new Date(2022, 0, 1), new Date(2023, 11, 31)),
                    usefulLife: 5,
                    currentCondition: i === 3 ? 'Fair' : 'Good'
                }
            })
        }

        // Update total quantity
        await prisma.equipment.update({
            where: { id: equipment.id },
            data: { quantity: 3 }
        })
    }

    // 5. Apparatus (Consumable type)
    console.log('Seeding Apparatus...')
    const apparatusData = [
        { name: 'Beaker 250mL', type: 'Consumables', category: 'Chemistry', cost: 250 },
        { name: 'Graduated Cylinder 100mL', type: 'Consumables', category: 'Chemistry', cost: 450 },
        { name: 'Test Tube Rack', type: 'Non-Consumables', category: 'General Science', cost: 800 }
    ]

    for (const ap of apparatusData) {
        const categoryId = seededCategories.find(c => c.name === ap.category)?.id
        const apparatus = await prisma.apparatus.create({
            data: {
                name: ap.name,
                apparatusType: ap.type,
                categoryId: categoryId,
                quantity: 0
            }
        })

        if (ap.type === 'Consumables') {
            // Seed batches
            for (let i = 1; i <= 2; i++) {
                await prisma.apparatusBatch.create({
                    data: {
                        apparatusId: apparatus.id,
                        batchNumber: `BAT-AP-${apparatus.id}-${i}`,
                        originalQty: 50,
                        remainingQty: 50 - (i * 10),
                        unitCost: ap.cost,
                        purchaseDate: randomDate(new Date(2023, 0, 1), new Date()),
                        addedById: labtech.id
                    }
                })
            }
            const total = await prisma.apparatusBatch.aggregate({
                where: { apparatusId: apparatus.id },
                _sum: { remainingQty: true }
            })
            await prisma.apparatus.update({
                where: { id: apparatus.id },
                data: { quantity: total._sum.remainingQty || 0 }
            })
        } else {
            // Seed instances
            for (let i = 1; i <= 5; i++) {
                await prisma.apparatusInstance.create({
                    data: {
                        apparatusId: apparatus.id,
                        inventoryNumber: `AP-INS-${apparatus.id}-${i}`,
                        unitCost: ap.cost,
                        quantity: 1,
                        currentCondition: 'Good'
                    }
                })
            }
            await prisma.apparatus.update({
                where: { id: apparatus.id },
                data: { quantity: 5 }
            })
        }
    }

    // 6. Chemicals
    console.log('Seeding Chemicals...')
    const chemicals = [
        { name: 'Hydrochloric Acid', unit: 'mL', reorder: 1000 },
        { name: 'Sodium Hydroxide', unit: 'g', reorder: 500 },
        { name: 'Ethanol (95%)', unit: 'mL', reorder: 2000 }
    ]

    for (const chem of chemicals) {
        const chemical = await prisma.chemical.create({
            data: {
                name: chem.name,
                unit: chem.unit,
                reorderLevel: chem.reorder,
                volume: 0
            }
        })

        // Seed batches
        for (let i = 1; i <= 2; i++) {
            const originalVolume = i === 1 ? 5000 : 2500
            const remainingVolume = i === 1 ? (Math.random() * originalVolume) : originalVolume

            await prisma.chemicalBatch.create({
                data: {
                    chemicalId: chemical.id,
                    batchNumber: `CH-BAT-${chemical.id}-${i}`,
                    inventoryNumber: `INV-CHEM-${chemical.id}-${i}`,
                    originalVolume: originalVolume,
                    remainingVolume: remainingVolume,
                    unitCost: 150 * i,
                    purchaseDate: new Date(2023, 5, 20),
                    expiryDate: new Date(2025, 5, 20),
                    addedById: labtech.id
                }
            })
        }

        const totalVol = await prisma.chemicalBatch.aggregate({
            where: { chemicalId: chemical.id },
            _sum: { remainingVolume: true }
        })
        await prisma.chemical.update({
            where: { id: chemical.id },
            data: { volume: totalVol._sum.remainingVolume || 0 }
        })
    }

    // 7. Lab Borrow Records (Some samples)
    console.log('Seeding Sample Borrow Records...')
    const firstEqInst = await prisma.equipmentInstance.findFirst()
    if (firstEqInst && staff && room) {
        await prisma.labBorrowRecord.create({
            data: {
                equipmentInstanceId: firstEqInst.id,
                borrowerId: staff.id,
                roomId: room.id,
                purpose: 'Physics Class Experiment',
                borrowDate: new Date(),
                dueDate: new Date(Date.now() + 86400000) // Tomorrow
            }
        })
    }

    console.log('--- LabTech Module Seed Completed ---')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
