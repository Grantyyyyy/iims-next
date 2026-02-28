import { PrismaClient } from '@prisma/client'

export async function seedRooms(prisma: PrismaClient) {
    console.log('--- Seeding Departments and Rooms ---')

    // 1. Master Data: Departments
    const departments = ['ICT Department', 'Engineering Department', 'Science Department']
    console.log('Seeding departments...')
    const seededDepts = []
    for (const name of departments) {
        const dept = await prisma.department.upsert({
            where: { id: departments.indexOf(name) + 1 }, // Simple ID mapping for seeding
            update: {},
            create: { name }
        })
        seededDepts.push(dept)
    }

    // 2. Master Data: Rooms
    console.log('Seeding rooms...')
    const rooms = [
        { name: 'Computer Lab 1', location: '3rd Floor, IT Bldg', departmentId: seededDepts[0].id },
        { name: 'Electronics Lab', location: '2nd Floor, Eng Bldg', departmentId: seededDepts[1].id },
        { name: 'Lecture Hall A', location: '1st Floor, Main Bldg', departmentId: seededDepts[2].id },
    ]
    const seededRooms = []
    for (const r of rooms) {
        const room = await prisma.room.upsert({
            where: { id: rooms.indexOf(r) + 1 },
            update: {},
            create: r
        })
        seededRooms.push(room)
    }

    console.log('--- Departments and Rooms Seeding Completed ---')
    return seededRooms
}
