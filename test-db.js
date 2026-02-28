const { PrismaClient } = require('@prisma/client');
const { PrismaLibSql } = require('@prisma/adapter-libsql');
const { createClient } = require('@libsql/client');
require('dotenv').config();

const config = {
    url: process.env.DATABASE_URL,
};

const adapter = new PrismaLibSql(config);
const prisma = new PrismaClient({ adapter });

async function main() {
    const users = await prisma.user.findMany();
    console.log('Users count:', users.length);
    if (users.length > 0) {
        console.log('Fields of first user:', Object.keys(users[0]));
        console.log('isActive value of first user:', users[0].isActive);
    }
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
