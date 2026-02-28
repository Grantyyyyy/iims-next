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

const categoriesData = [
    {
        name: 'Computers / Laptops',
        type: 'Non-Consumables',
        code: 'COMP',
        items: [
            { name: 'Dell Inspiron 15', model: 'INS-15-3000', cost: 35000 },
            { name: 'HP EliteBook 840', model: 'HP-EB-840', cost: 45000 },
            { name: 'Lenovo ThinkPad E14', model: 'TP-E14', cost: 42000 },
        ]
    },
    {
        name: 'Monitors',
        type: 'Non-Consumables',
        code: 'MON',
        items: [
            { name: 'Dell 24" Monitor', model: 'DELL-P2422H', cost: 8500 },
            { name: 'LG 27" IPS Monitor', model: 'LG-27MK600', cost: 11000 },
        ]
    },
    {
        name: 'Keyboards & Mouse',
        type: 'Non-Consumables',
        code: 'KBM',
        items: [
            { name: 'Logitech Wireless Keyboard', model: 'LOG-K380', cost: 1800 },
            { name: 'HP USB Mouse', model: 'HP-USB-MSE', cost: 400 },
            { name: 'Mechanical Keyboard', model: 'MK-750', cost: 3500 },
        ]
    },
    {
        name: 'Printers & Scanners',
        type: 'Non-Consumables',
        code: 'PRN',
        items: [
            { name: 'HP LaserJet Pro', model: 'HP-LJ-M404', cost: 12000 },
            { name: 'Canon Inkjet Printer', model: 'CAN-G3010', cost: 8500 },
        ]
    },
    {
        name: 'Cables & Accessories',
        type: 'Consumables',
        items: [
            { name: 'HDMI Cable 2m', model: 'HDMI-2M', cost: 250, qty: 50 },
            { name: 'USB-C Cable', model: 'USBC-1M', cost: 300, qty: 100 },
            { name: 'Ethernet Cable Cat6', model: 'CAT6-3M', cost: 150, qty: 40 },
        ]
    },
    {
        name: 'Projectors',
        type: 'Non-Consumables',
        code: 'PROJ',
        items: [
            { name: 'Epson EB-X51 Projector', model: 'EP-EBX51', cost: 22000 },
            { name: 'BenQ MX550 Projector', model: 'BQ-MX550', cost: 19500 },
        ]
    },
    {
        name: 'USB Drives / Storage',
        type: 'Consumables',
        items: [
            { name: 'SanDisk 32GB USB', model: 'SD-32GB', cost: 450, qty: 30 },
            { name: 'Kingston 64GB USB', model: 'KS-64GB', cost: 650, qty: 25 },
        ]
    },
    {
        name: 'Office Supplies',
        type: 'Consumables',
        items: [
            { name: 'Bond Paper', model: 'A4-500', cost: 250, qty: 100 },
            { name: 'Ballpen Box', model: 'BP-BOX-12', cost: 150, qty: 20 },
            { name: 'Whiteboard Markers', model: 'WBM-SET', cost: 350, qty: 15 },
        ]
    }
]

function randomDate(start: Date, end: Date) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
    // 1. Roles
    const roles = ['ADMIN', 'SECRETARY', 'LABTECH', 'DEAN', 'STAFF', 'ICTC', 'SUPPLY']
    console.log('Upserting roles...')
    for (const roleName of roles) {
        await prisma.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName },
        })
    }

    const passwordHash = await bcrypt.hash('password123', 10)

    // 2. Users
    const testUsers = [
        { username: 'admin', email: 'admin@test.com', role: 'ADMIN' },
        { username: 'secretary', email: 'secretary@test.com', role: 'SECRETARY' },
        { username: 'labtech', email: 'labtech@test.com', role: 'LABTECH' },
        { username: 'dean', email: 'dean@test.com', role: 'DEAN' },
        { username: 'staffuser', email: 'staff@test.com', role: 'STAFF' },
        { username: 'ictcuser', email: 'ictc@test.com', role: 'ICTC' },
        { username: 'supplyuser', email: 'supply@test.com', role: 'SUPPLY' },
    ]

    console.log('Seeding users...')
    const users = []
    for (const u of testUsers) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: {
                username: u.username,
                email: u.email,
                passwordHash: passwordHash,
                firstName: u.username.charAt(0).toUpperCase() + u.username.slice(1),
                lastName: 'Test',
            },
        })
        users.push(user)

        const role = await prisma.role.findUnique({ where: { name: u.role } })
        if (role) {
            await prisma.userRole.upsert({
                where: {
                    userId_roleId: {
                        userId: user.id,
                        roleId: role.id,
                    }
                },
                update: {},
                create: {
                    userId: user.id,
                    roleId: role.id,
                },
            })
        }
    }

    const secretary = users.find(u => u.username === 'secretary')
    if (!secretary) throw new Error('Secretary user not found')

    // 3. Categories and Items
    console.log('Seeding categories and items...')
    for (const catData of categoriesData) {
        let category = await prisma.category.findFirst({ where: { name: catData.name } })
        if (!category) {
            category = await prisma.category.create({ data: { name: catData.name } })
        }

        for (const itemData of catData.items) {
            let item = await prisma.item.findFirst({ where: { name: itemData.name } })

            if (!item) {
                item = await prisma.item.create({
                    data: {
                        name: itemData.name,
                        model: itemData.model,
                        itemType: catData.type,
                        categoryId: category.id,
                        quantity: 0, // Calculated later
                    }
                })
            }

            // Create 1 instance for both types (Consumables only need 1 parent instance now)
            let instance = await prisma.itemInstance.findFirst({ where: { itemId: item.id } })
            if (!instance) {
                instance = await prisma.itemInstance.create({
                    data: {
                        itemId: item.id,
                        unitCost: itemData.cost,
                        quantity: 0, // Calculated later
                        currentCondition: 'Good',
                        inventoryNumber: catData.type === 'Non-Consumables' ? `${catData.code || 'ITEM'}-${item.id}-001` : `CONS-${item.id}`,
                    }
                })
            }

            if (catData.type === 'Non-Consumables') {
                // Create more instances for non-consumables
                const additionalInstances = 2;
                for (let i = 2; i <= additionalInstances + 1; i++) {
                    const invNo = `${catData.code || 'ITEM'}-${item.id}-${i.toString().padStart(3, '0')}`
                    const existingInst = await prisma.itemInstance.findUnique({ where: { inventoryNumber: invNo } })
                    if (!existingInst) {
                        await prisma.itemInstance.create({
                            data: {
                                itemId: item.id,
                                inventoryNumber: invNo,
                                serialNumber: `SN-${Math.floor(1000 + Math.random() * 9000)}-${item.id}-${i}`,
                                currentCondition: 'Good',
                                unitCost: itemData.cost,
                                purchaseDate: randomDate(new Date(2022, 0, 1), new Date(2024, 11, 31)),
                                usefulLife: Math.floor(Math.random() * 3) + 3,
                                quantity: 1,
                            }
                        })
                    }
                }
            } else {
                // Consumables: Create multiple batches
                const numBatches = 3;
                for (let i = 1; i <= numBatches; i++) {
                    const batchNo = `BATCH-${item.id}-${i.toString().padStart(3, '0')}`
                    const existingBatch = await prisma.consumableBatch.findFirst({
                        where: { batchNumber: batchNo }
                    })

                    if (!existingBatch) {
                        const originalQty = Math.floor(((itemData as any).qty || 10) / numBatches)
                        const remainingQty = i === 1 ? 0 : originalQty // Make the first batch exhausted for testing

                        await prisma.consumableBatch.create({
                            data: {
                                itemInstanceId: instance.id,
                                batchNumber: batchNo,
                                originalQty,
                                remainingQty,
                                unitCost: itemData.cost + (i * 10), // vary cost slightly
                                purchaseDate: randomDate(new Date(2023, 0, 1), new Date(2024, 11, 31)),
                                addedById: secretary.id,
                                notes: `Seed batch ${i}`,
                            }
                        })
                    }
                }
            }

            // Recalculate quantities
            const instances = await prisma.itemInstance.findMany({
                where: { itemId: item.id },
                include: { consumableBatches: true }
            })

            let totalItemQty = 0;
            for (const inst of instances) {
                let instQty = 0;
                if (item.itemType === 'Consumables') {
                    instQty = inst.consumableBatches.reduce((sum, b) => sum + b.remainingQty, 0)
                } else {
                    instQty = 1; // For non-consumables, each instance is 1 unit usually
                }

                await prisma.itemInstance.update({
                    where: { id: inst.id },
                    data: { quantity: instQty }
                })
                totalItemQty += instQty;
            }

            await prisma.item.update({
                where: { id: item.id },
                data: { quantity: totalItemQty }
            })
        }
    }

    console.log('Seed completed successfully.')
}

main()
    .catch((e) => {
        console.error(e)
        // process.exit(1)
    })
    .finally(async () => {
        // close connection
    })
