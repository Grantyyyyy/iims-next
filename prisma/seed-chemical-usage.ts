import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })


function randomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

async function main() {
    console.log('--- Starting Chemical Usage Tracking Seed ---')

    // 1. Create subjects if they don't exist
    console.log('Creating subjects...')
    const subjectsData = [
        { code: 'CHEM-101', name: 'General Chemistry I' },
        { code: 'BIO-101', name: 'General Biology I' },
        { code: 'PHY-101', name: 'General Physics I' },
        { code: 'CHEM-201', name: 'Organic Chemistry I' },
        { code: 'BIO-201', name: 'Molecular Biology' }
    ]

    const subjects = []
    for (const s of subjectsData) {
        const subject = await prisma.subject.upsert({
            where: { code: s.code },
            update: {},
            create: s
        })
        subjects.push(subject)
    }
    console.log(`✓ Created/verified ${subjects.length} subjects`)

    // 2. Get reference data
    console.log('Fetching reference data...')
    const labtech = await prisma.user.findFirst({ where: { username: 'labtech' } })
    const staff = await prisma.user.findFirst({ where: { username: 'staffuser' } })
    const rooms = await prisma.room.findMany({ take: 3 })

    if (!labtech) {
        console.error('LabTech user not found. Please run main seed first.')
        return
    }

    if (rooms.length === 0) {
        console.error('No rooms found. Please run room seed first.')
        return
    }

    // 3. Get chemicals with available batches
    console.log('Fetching chemicals with available batches...')
    const chemicals = await prisma.chemical.findMany({
        where: {
            deletedAt: null,
            batches: {
                some: {
                    remainingVolume: { gt: 0 },
                    OR: [
                        { expiryDate: null },
                        { expiryDate: { gte: new Date() } }
                    ]
                }
            }
        },
        include: {
            batches: {
                where: {
                    remainingVolume: { gt: 0 },
                    OR: [
                        { expiryDate: null },
                        { expiryDate: { gte: new Date() } }
                    ]
                },
                orderBy: { purchaseDate: 'asc' }
            }
        },
        take: 5
    })

    if (chemicals.length === 0) {
        console.error('No chemicals with available batches found. Please run labtech seed first.')
        return
    }

    console.log(`✓ Found ${chemicals.length} chemicals with available stock`)

    // 4. Create sample usage records
    console.log('Creating sample usage records...')

    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // Define sample usage scenarios (regular usage)
    const usageScenarios = [
        {
            chemicalIndex: 0,
            quantity: 150,
            subjectIndex: 0, // CHEM-101
            roomIndex: 0,
            purpose: 'Acid-base titration experiment for General Chemistry lab',
            usedById: staff?.id || null, // Registered user
            dateUsed: randomDate(thirtyDaysAgo, now)
        },
        {
            chemicalIndex: 0,
            quantity: 200,
            subjectIndex: 3, // CHEM-201
            roomIndex: 1,
            purpose: 'Organic synthesis demonstration',
            usedById: null, // Internal usage
            dateUsed: randomDate(thirtyDaysAgo, now)
        },
        {
            chemicalIndex: 1,
            quantity: 75,
            subjectIndex: 1, // BIO-101
            roomIndex: 0,
            purpose: 'pH adjustment for bacterial culture media',
            usedById: staff?.id || null,
            dateUsed: randomDate(thirtyDaysAgo, now)
        },
        {
            chemicalIndex: 1,
            quantity: 100,
            subjectIndex: 4, // BIO-201
            roomIndex: 2,
            purpose: 'Buffer preparation for molecular biology experiments',
            usedById: null, // Internal usage
            dateUsed: randomDate(thirtyDaysAgo, now)
        },
        {
            chemicalIndex: 2,
            quantity: 300,
            subjectIndex: 0, // CHEM-101
            roomIndex: 1,
            purpose: 'Solvent for extraction lab exercise',
            usedById: staff?.id || null,
            dateUsed: randomDate(thirtyDaysAgo, now)
        },
        {
            chemicalIndex: 2,
            quantity: 250,
            subjectIndex: 2, // PHY-101
            roomIndex: 0,
            purpose: 'Cleaning glassware for physics experiments',
            usedById: null, // Internal usage
            dateUsed: randomDate(thirtyDaysAgo, now)
        },
        {
            chemicalIndex: 0,
            quantity: 120,
            subjectIndex: 3, // CHEM-201
            roomIndex: 2,
            purpose: 'Reaction catalyst preparation',
            usedById: staff?.id || null,
            dateUsed: randomDate(thirtyDaysAgo, now)
        },
        {
            chemicalIndex: 1,
            quantity: 50,
            subjectIndex: 1, // BIO-101
            roomIndex: 1,
            purpose: 'Microscopy slide preparation',
            usedById: null, // Internal usage
            dateUsed: randomDate(thirtyDaysAgo, now)
        }
    ]

    // Define sample distribution scenarios (isDistribution=true)
    const distributionScenarios = [
        {
            chemicalIndex: 0,
            quantity: 500,
            unit: 'ML',
            subjectIndex: 0, // CHEM-101
            roomIndex: 0,
            purpose: 'Distribution for student lab experiment - acid-base titration',
            recipientId: staff?.id || null,
            dateUsed: randomDate(thirtyDaysAgo, now)
        },
        {
            chemicalIndex: 1,
            quantity: 1,
            unit: 'L',
            subjectIndex: 1, // BIO-101
            roomIndex: 1,
            purpose: 'Distribution for bacterial culture preparation',
            recipientId: staff?.id || null,
            dateUsed: randomDate(thirtyDaysAgo, now)
        },
        {
            chemicalIndex: 2,
            quantity: 250,
            unit: 'G',
            subjectIndex: 3, // CHEM-201
            roomIndex: 2,
            purpose: 'Distribution for organic synthesis lab',
            recipientId: staff?.id || null,
            dateUsed: randomDate(thirtyDaysAgo, now)
        }
    ]

    let successCount = 0
    let skipCount = 0

    for (const scenario of usageScenarios) {
        // Ensure indices are valid
        if (scenario.chemicalIndex >= chemicals.length) {
            console.log(`⚠ Skipping scenario: chemical index ${scenario.chemicalIndex} out of range`)
            skipCount++
            continue
        }
        if (scenario.subjectIndex >= subjects.length) {
            console.log(`⚠ Skipping scenario: subject index ${scenario.subjectIndex} out of range`)
            skipCount++
            continue
        }
        if (scenario.roomIndex >= rooms.length) {
            console.log(`⚠ Skipping scenario: room index ${scenario.roomIndex} out of range`)
            skipCount++
            continue
        }

        const chemical = chemicals[scenario.chemicalIndex]
        const subject = subjects[scenario.subjectIndex]
        const room = rooms[scenario.roomIndex]

        // Calculate available stock
        const availableStock = chemical.batches.reduce((sum, b) => sum + b.remainingVolume, 0)

        if (availableStock < scenario.quantity) {
            console.log(`⚠ Skipping ${chemical.name}: insufficient stock (available: ${availableStock}, requested: ${scenario.quantity})`)
            skipCount++
            continue
        }

        try {
            // Execute FIFO deduction
            await prisma.$transaction(async (tx) => {
                // Fetch fresh batches in FIFO order
                const batches = await tx.chemicalBatch.findMany({
                    where: {
                        chemicalId: chemical.id,
                        remainingVolume: { gt: 0 },
                        OR: [
                            { expiryDate: null },
                            { expiryDate: { gte: new Date() } }
                        ]
                    },
                    orderBy: { purchaseDate: 'asc' }
                })

                let remaining = scenario.quantity
                for (const batch of batches) {
                    if (remaining <= 0) break

                    const deduction = Math.min(batch.remainingVolume, remaining)

                    // Create usage record
                    await tx.chemicalUsageRecord.create({
                        data: {
                            chemicalBatchId: batch.id,
                            quantityUsed: deduction,
                            quantityRequested: scenario.quantity,
                            unit: chemical.unit,
                            subjectId: subject.id,
                            roomId: room.id,
                            purpose: scenario.purpose,
                            usedById: scenario.usedById,
                            recordedById: labtech.id,
                            dateUsed: scenario.dateUsed
                        }
                    })

                    // Update batch remaining volume
                    await tx.chemicalBatch.update({
                        where: { id: batch.id },
                        data: { remainingVolume: batch.remainingVolume - deduction }
                    })

                    remaining -= deduction
                }

                // Recalculate chemical volume
                const updatedBatches = await tx.chemicalBatch.findMany({
                    where: {
                        chemicalId: chemical.id,
                        OR: [
                            { expiryDate: null },
                            { expiryDate: { gte: new Date() } }
                        ]
                    }
                })

                const newVolume = updatedBatches.reduce((sum, b) => sum + b.remainingVolume, 0)

                await tx.chemical.update({
                    where: { id: chemical.id },
                    data: { volume: newVolume }
                })
            })

            const usedByText = scenario.usedById ? 'Registered User' : 'Internal'
            console.log(`✓ Recorded ${scenario.quantity} ${chemical.unit} of ${chemical.name} (${usedByText}, ${subject.code})`)
            successCount++
        } catch (error: any) {
            console.error(`✗ Failed to record usage for ${chemical.name}:`, error.message)
            skipCount++
        }
    }

    console.log(`\n--- Chemical Usage Tracking Seed Completed ---`)
    console.log(`✓ Successfully created ${successCount} usage records`)
    if (skipCount > 0) {
        console.log(`⚠ Skipped ${skipCount} scenarios`)
    }

    // 5. Create sample distribution records
    console.log('\nCreating sample distribution records...')

    let distributionSuccessCount = 0
    let distributionSkipCount = 0

    for (const scenario of distributionScenarios) {
        // Ensure indices are valid
        if (scenario.chemicalIndex >= chemicals.length) {
            console.log(`⚠ Skipping distribution: chemical index ${scenario.chemicalIndex} out of range`)
            distributionSkipCount++
            continue
        }
        if (scenario.subjectIndex >= subjects.length) {
            console.log(`⚠ Skipping distribution: subject index ${scenario.subjectIndex} out of range`)
            distributionSkipCount++
            continue
        }
        if (scenario.roomIndex >= rooms.length) {
            console.log(`⚠ Skipping distribution: room index ${scenario.roomIndex} out of range`)
            distributionSkipCount++
            continue
        }
        if (!scenario.recipientId) {
            console.log(`⚠ Skipping distribution: no recipient available`)
            distributionSkipCount++
            continue
        }

        const chemical = chemicals[scenario.chemicalIndex]
        const subject = subjects[scenario.subjectIndex]
        const room = rooms[scenario.roomIndex]

        // Convert to base unit for deduction
        const conversionFactors: Record<string, number> = {
            'GAL': 3785.41,
            'L': 1000,
            'ML': 1,
            'KG': 1000,
            'G': 1
        }
        const amountInBaseUnit = scenario.quantity * (conversionFactors[scenario.unit] || 1)

        // Calculate available stock
        const availableStock = chemical.batches.reduce((sum, b) => sum + b.remainingVolume, 0)

        if (availableStock < amountInBaseUnit) {
            console.log(`⚠ Skipping distribution of ${chemical.name}: insufficient stock (available: ${availableStock}, requested: ${amountInBaseUnit})`)
            distributionSkipCount++
            continue
        }

        try {
            // Execute FIFO deduction for distribution
            await prisma.$transaction(async (tx) => {
                // Fetch fresh batches in FIFO order
                const batches = await tx.chemicalBatch.findMany({
                    where: {
                        chemicalId: chemical.id,
                        remainingVolume: { gt: 0 },
                        OR: [
                            { expiryDate: null },
                            { expiryDate: { gte: new Date() } }
                        ]
                    },
                    orderBy: { purchaseDate: 'asc' }
                })

                let remaining = amountInBaseUnit
                for (const batch of batches) {
                    if (remaining <= 0) break

                    const deduction = Math.min(batch.remainingVolume, remaining)

                    // Create distribution record with isDistribution=true
                    await tx.chemicalUsageRecord.create({
                        data: {
                            chemicalBatchId: batch.id,
                            quantityUsed: deduction,
                            quantityRequested: amountInBaseUnit,
                            unit: scenario.unit,
                            isDistribution: true,
                            recipientId: scenario.recipientId,
                            subjectId: subject.id,
                            roomId: room.id,
                            purpose: scenario.purpose,
                            recordedById: labtech.id,
                            dateUsed: scenario.dateUsed
                        }
                    })

                    // Update batch remaining volume
                    await tx.chemicalBatch.update({
                        where: { id: batch.id },
                        data: { remainingVolume: batch.remainingVolume - deduction }
                    })

                    remaining -= deduction
                }

                // Recalculate chemical volume
                const updatedBatches = await tx.chemicalBatch.findMany({
                    where: {
                        chemicalId: chemical.id,
                        OR: [
                            { expiryDate: null },
                            { expiryDate: { gte: new Date() } }
                        ]
                    }
                })

                const newVolume = updatedBatches.reduce((sum, b) => sum + b.remainingVolume, 0)

                await tx.chemical.update({
                    where: { id: chemical.id },
                    data: { volume: newVolume }
                })
            })

            console.log(`✓ Distributed ${scenario.quantity} ${scenario.unit} of ${chemical.name} to recipient (${subject.code})`)
            distributionSuccessCount++
        } catch (error: any) {
            console.error(`✗ Failed to record distribution for ${chemical.name}:`, error.message)
            distributionSkipCount++
        }
    }

    console.log(`\n--- Distribution Records Seed Completed ---`)
    console.log(`✓ Successfully created ${distributionSuccessCount} distribution records`)
    if (distributionSkipCount > 0) {
        console.log(`⚠ Skipped ${distributionSkipCount} distribution scenarios`)
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
