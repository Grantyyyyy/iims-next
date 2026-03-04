import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import bcrypt from 'bcryptjs'

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

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

async function main() {
    console.log('--- Starting UNIVERSAL LABTECH SEEDER ---')

    // 1. ROLES & USERS (Ensure we have at least labtech and some staff)
    console.log('Ensuring roles and users exist...')
    const roles = ['ADMIN', 'LABTECH', 'STAFF']
    for (const r of roles) {
        await prisma.role.upsert({ where: { name: r }, update: {}, create: { name: r } })
    }

    const passwordHash = await bcrypt.hash('password123', 10)

    // Upsert Labtech
    const labtechUser = await prisma.user.upsert({
        where: { username: 'labtech' },
        update: {},
        create: {
            username: 'labtech',
            email: 'labtech@test.com',
            passwordHash,
            firstName: 'Lara',
            lastName: 'Tech',
            isActive: true
        }
    })

    const labtechRole = await prisma.role.findUnique({ where: { name: 'LABTECH' } })
    if (labtechRole) {
        await prisma.userRole.upsert({
            where: { userId_roleId: { userId: labtechUser.id, roleId: labtechRole.id } },
            update: {},
            create: { userId: labtechUser.id, roleId: labtechRole.id }
        })
    }

    // Upsert Staff
    const staffUser = await prisma.user.upsert({
        where: { username: 'staffuser' },
        update: {},
        create: {
            username: 'staffuser',
            email: 'staff@test.com',
            passwordHash,
            firstName: 'Steve',
            lastName: 'Staff',
            isActive: true
        }
    })

    const staffRole = await prisma.role.findUnique({ where: { name: 'STAFF' } })
    if (staffRole) {
        await prisma.userRole.upsert({
            where: { userId_roleId: { userId: staffUser.id, roleId: staffRole.id } },
            update: {},
            create: { userId: staffUser.id, roleId: staffRole.id }
        })
    }

    // 2. DEPARTMENTS & ROOMS
    console.log('Ensuring departments and rooms exist...')
    const sciDept = await prisma.department.upsert({
        where: { id: 3 }, // Assuming 1:ICT, 2:ENG, 3:SCI as per other seeders
        update: {},
        create: { id: 3, name: 'Science Department' }
    })

    const labRooms = [
        { name: 'Chemistry Lab', location: '1st Floor, Sci Bldg', departmentId: sciDept.id },
        { name: 'Biology Lab', location: '2nd Floor, Sci Bldg', departmentId: sciDept.id },
        { name: 'Physics Lab', location: '3rd Floor, Sci Bldg', departmentId: sciDept.id },
        { name: 'General Science Lab', location: '1st Floor, Main Bldg', departmentId: sciDept.id }
    ]

    const seededRooms = []
    for (const r of labRooms) {
        const room = await prisma.room.upsert({
            where: { id: 10 + labRooms.indexOf(r) }, // Offsetting for laboratory rooms
            update: {},
            create: r
        })
        seededRooms.push(room)
    }

    // 3. LAB CATEGORIES
    console.log('Seeding Lab Categories...')
    const categories = ['Electronics', 'Chemistry', 'Biology', 'Physics', 'Safety', 'General Labware']
    const seededCats = []
    for (const name of categories) {
        const cat = await prisma.labCategory.upsert({
            where: { id: categories.indexOf(name) + 1 },
            update: {},
            create: { name }
        })
        seededCats.push(cat)
    }

    // 4. SUBJECTS
    console.log('Seeding Subjects...')
    const subjects = [
        { code: 'CHEM-101', name: 'General Chemistry I' },
        { code: 'CHEM-102', name: 'General Chemistry II' },
        { code: 'BIO-101', name: 'General Biology I' },
        { code: 'BIO-201', name: 'Microbiology' },
        { code: 'PHY-101', name: 'General Physics I' },
        { code: 'SCI-100', name: 'Introduction to Science' }
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

    // 5. EQUIPMENT
    console.log('Seeding Equipment...')
    const equipmentData = [
        { name: 'Digital Microscope', model: 'M-1000', category: 'Biology', cost: 12500 },
        { name: 'Analytical Balance', model: 'AB-224', category: 'Chemistry', cost: 45000 },
        { name: 'Digital Oscilloscope', model: 'DSO-X-2000', category: 'Electronics', cost: 85000 },
        { name: 'Centrifuge', model: 'C-28', category: 'Biology', cost: 35000 },
        { name: 'Magnetic Stirrer', model: 'MS-H280', category: 'General Labware', cost: 8500 }
    ]

    for (const eq of equipmentData) {
        const categoryId = seededCats.find(c => c.name === eq.category)?.id
        const equipment = await prisma.equipment.upsert({
            where: { id: equipmentData.indexOf(eq) + 1 },
            update: { categoryId },
            create: {
                name: eq.name,
                model: eq.model,
                categoryId: categoryId,
                quantity: 0
            }
        })

        // Create 3 instances for each
        for (let i = 1; i <= 3; i++) {
            const invNo = `EQ-${equipment.id.toString().padStart(3, '0')}-${i.toString().padStart(2, '0')}`
            await prisma.equipmentInstance.upsert({
                where: { inventoryNumber: invNo },
                update: {},
                create: {
                    equipmentId: equipment.id,
                    inventoryNumber: invNo,
                    serialNumber: `SN-${equipment.id}-${i}-${Math.random().toString(36).substring(7).toUpperCase()}`,
                    unitCost: eq.cost,
                    purchaseDate: randomDate(new Date(2022, 0, 1), new Date(2024, 1, 1)),
                    usefulLife: 5,
                    currentCondition: i === 3 ? 'Fair' : 'Good',
                    status: 'Active',
                    quantity: 1
                }
            })
        }

        // Update quantity
        await prisma.equipment.update({
            where: { id: equipment.id },
            data: { quantity: 3 }
        })
    }

    // 6. APPARATUS
    console.log('Seeding Apparatus...')
    const apparatusData = [
        { name: 'Beaker 250mL', type: 'Consumables', category: 'Chemistry', cost: 150 },
        { name: 'Test Tube Rack', type: 'Non-Consumables', category: 'Chemistry', cost: 850 },
        { name: 'Erlenmeyer Flask 500mL', type: 'Consumables', category: 'Chemistry', cost: 280 },
        { name: 'Pipette Pump', type: 'Non-Consumables', category: 'General Labware', cost: 1200 },
        { name: 'Digital Thermometer', type: 'Non-Consumables', category: 'Physics', cost: 3500 }
    ]

    for (const ap of apparatusData) {
        const categoryId = seededCats.find(c => c.name === ap.category)?.id
        const apparatus = await prisma.apparatus.upsert({
            where: { id: apparatusData.indexOf(ap) + 1 },
            update: { categoryId, apparatusType: ap.type },
            create: {
                name: ap.name,
                apparatusType: ap.type,
                categoryId: categoryId,
                quantity: 0
            }
        })

        if (ap.type === 'Consumables') {
            // Seed batches
            for (let i = 1; i <= 2; i++) {
                const batchNum = `BAT-AP-${apparatus.id}-${i}`
                const existing = await prisma.apparatusBatch.findFirst({ where: { batchNumber: batchNum, apparatusId: apparatus.id } })
                if (!existing) {
                    await prisma.apparatusBatch.create({
                        data: {
                            apparatusId: apparatus.id,
                            batchNumber: batchNum,
                            originalQty: 50,
                            remainingQty: 50 - (i * 15),
                            unitCost: ap.cost,
                            purchaseDate: randomDate(new Date(2023, 0, 1), new Date()),
                            addedById: labtechUser.id
                        }
                    })
                }
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
                const invNo = `AP-${apparatus.id.toString().padStart(3, '0')}-${i.toString().padStart(2, '0')}`
                await prisma.apparatusInstance.upsert({
                    where: { inventoryNumber: invNo },
                    update: {},
                    create: {
                        apparatusId: apparatus.id,
                        inventoryNumber: invNo,
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

    // 7. CHEMICALS
    console.log('Seeding Chemicals...')
    const chemicals = [
        { name: 'Hydrochloric Acid', unit: 'ML', reorder: 500, cost: 450, baseUnit: 'ML' },
        { name: 'Sodium Hydroxide', unit: 'G', reorder: 200, cost: 180, baseUnit: 'G' },
        { name: 'Ethanol (95%)', unit: 'ML', reorder: 1000, cost: 750, baseUnit: 'ML' },
        { name: 'Iodine Solution', unit: 'ML', reorder: 100, cost: 1200, baseUnit: 'ML' }
    ]

    for (const chem of chemicals) {
        const chemical = await prisma.chemical.upsert({
            where: { name: chem.name },
            update: { unit: chem.baseUnit, reorderLevel: chem.reorder },
            create: {
                name: chem.name,
                unit: chem.baseUnit,
                reorderLevel: chem.reorder,
                volume: 0
            }
        })

        // Seed 2 batches for each
        for (let i = 1; i <= 2; i++) {
            const invNo = `CHEM-INV-${chemical.id}-${i}`
            const existing = await prisma.chemicalBatch.findUnique({ where: { inventoryNumber: invNo } })
            if (!existing) {
                await prisma.chemicalBatch.create({
                    data: {
                        chemicalId: chemical.id,
                        batchNumber: `BAT-${chemical.id}-${i}`,
                        inventoryNumber: invNo,
                        originalVolume: 1000,
                        originalUnit: chem.unit,
                        remainingVolume: 1000 - (i * 200),
                        baseUnit: chem.baseUnit,
                        unitCost: chem.cost * i,
                        purchaseDate: randomDate(new Date(2023, 5, 20), new Date()),
                        expiryDate: randomDate(new Date(), new Date(2026, 11, 31)),
                        addedById: labtechUser.id
                    }
                })
            }
        }

        const totalVol = await prisma.chemicalBatch.aggregate({
            where: {
                chemicalId: chemical.id,
                OR: [
                    { expiryDate: null },
                    { expiryDate: { gt: new Date() } }
                ]
            },
            _sum: { remainingVolume: true }
        })
        await prisma.chemical.update({
            where: { id: chemical.id },
            data: { volume: totalVol._sum.remainingVolume || 0 }
        })
    }

    // 8. BORROW RECORDS
    console.log('Seeding Borrow Records...')
    const eqInstances = await prisma.equipmentInstance.findMany({ take: 5 })
    const apInstances = await prisma.apparatusInstance.findMany({ take: 5 })
    const rooms = await prisma.room.findMany({ take: 3 })

    // Create some returned records
    for (let i = 0; i < 5; i++) {
        const eq = eqInstances[i % eqInstances.length]
        const room = rooms[i % rooms.length]
        const borrowDate = randomDate(new Date(2023, 10, 1), new Date(2024, 0, 1))
        const returnDate = new Date(borrowDate.getTime() + 7200000) // 2 hours later

        const record = await prisma.labBorrowRecord.create({
            data: {
                equipmentInstanceId: eq.id,
                borrowerId: staffUser.id,
                roomId: room.id,
                purpose: 'Lab Class Experiment',
                borrowDate: borrowDate,
                returnDate: returnDate
            }
        })

        await prisma.labReturnRecord.create({
            data: {
                labBorrowRecordId: record.id,
                returnDate: returnDate,
                conditionOnReturn: 'Good',
                notes: 'Returned on time'
            }
        })
    }

    // Create some active records
    for (let i = 0; i < 3; i++) {
        const ap = apInstances[i % apInstances.length]
        const room = rooms[(i + 1) % rooms.length]

        await prisma.labBorrowRecord.create({
            data: {
                apparatusInstanceId: ap.id,
                borrowerId: staffUser.id,
                roomId: room.id,
                purpose: 'Ongoing Research Project',
                borrowDate: new Date(),
                dueDate: new Date(Date.now() + 86400000 * 2) // 2 days later
            }
        })
    }

    // 9. CHEMICAL USAGE & DISTRIBUTION
    console.log('Seeding Chemical Usage & Distribution...')
    const chemBatches = await prisma.chemicalBatch.findMany({ take: 5, include: { chemical: true } })
    const subjs = await prisma.subject.findMany({ take: 3 })

    for (let i = 0; i < 10; i++) {
        const batch = chemBatches[i % chemBatches.length]
        const isDist = i % 2 === 0
        const amount = randomInt(10, 50)

        // Only create if we have enough volume
        if (batch.remainingVolume > amount) {
            await prisma.chemicalUsageRecord.create({
                data: {
                    chemicalBatchId: batch.id,
                    usedById: isDist ? null : staffUser.id,
                    recipientId: isDist ? staffUser.id : null,
                    isDistribution: isDist,
                    subjectId: subjs[i % subjs.length].id,
                    roomId: rooms[i % rooms.length].id,
                    quantityUsed: amount,
                    quantityRequested: amount,
                    unit: batch.baseUnit,
                    purpose: isDist ? 'Distribution for student kits' : 'Used for faculty research',
                    recordedById: labtechUser.id,
                    dateUsed: randomDate(new Date(2024, 0, 1), new Date())
                }
            })

            // Update batch
            await prisma.chemicalBatch.update({
                where: { id: batch.id },
                data: { remainingVolume: batch.remainingVolume - amount }
            })
        }
    }

    // Recalculate all chemical totals
    const allChems = await prisma.chemical.findMany()
    for (const c of allChems) {
        const sum = await prisma.chemicalBatch.aggregate({
            where: { chemicalId: c.id },
            _sum: { remainingVolume: true }
        })
        await prisma.chemical.update({
            where: { id: c.id },
            data: { volume: sum._sum.remainingVolume || 0 }
        })
    }

    console.log('--- UNIVERSAL LABTECH SEEDER COMPLETED ---')
}

main()
    .catch((e) => {
        console.error(e)
        // process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
