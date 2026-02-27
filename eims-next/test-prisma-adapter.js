const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');

const prismaConfig = {
    url: 'file:prisma/dev.db',
}
try {
    const adapter = new PrismaLibSql(prismaConfig);
    const prisma = new PrismaClient({ adapter });
    console.log('Success: PrismaClient instantiated with LibSQL adapter');
    process.exit(0);
} catch (e) {
    console.error('Failure:', e.message);
    process.exit(1);
}
