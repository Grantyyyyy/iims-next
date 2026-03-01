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

async function main() {
    console.log('Recalculating chemical volumes (non-expired only)...')

    const chemicals = await prisma.chemical.findMany({
        where: { deletedAt: null }
    })

    const now = new Date()

    for (const chemical of chemicals) {
        const batches = await prisma.chemicalBatch.findMany({
            where: {
                chemicalId: chemical.id,
                remainingVolume: { gt: 0 },
                OR: [
                    { expiryDate: null },
                    { expiryDate: { gt: now } }
                ]
            }
        })

        const totalVolume = batches.reduce((sum, b) => sum + b.remainingVolume, 0)

        await prisma.chemical.update({
            where: { id: chemical.id },
            data: { volume: totalVolume }
        })

        console.log(`Updated ${chemical.name}: ${totalVolume.toFixed(2)} ${chemical.unit || ''}`)
    }

    console.log('Recalculation complete.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
