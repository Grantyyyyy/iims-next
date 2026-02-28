import { PrismaClient } from '@prisma/client'
import { PrismaLibSql } from '@prisma/adapter-libsql'
// Triggering re-check after prisma generate
import { createClient } from '@libsql/client'

const prismaClientSingleton = () => {
    const config = {
        url: process.env.DATABASE_URL as string,
    }
    const adapter = new PrismaLibSql(config)
    return new PrismaClient({ adapter })
}

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
