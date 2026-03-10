import { Home, Warehouse } from 'lucide-react'
import { RoomTable } from '@/components/rooms/room-table'
import { getRooms } from '@/app/actions/rooms'
import { getDepartments } from '@/app/actions/users'
import { requirePermission } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddRoomDialog } from '@/components/rooms/add-room-dialog'

export default async function RoomsPage() {
    await requirePermission('view:rooms')
    const rooms = await getRooms()
    const departments = await getDepartments()

    const stats = {
        total: rooms.length,
        departments: new Set(rooms.map(r => r.departmentId)).size,
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Room Management</h1>
                    <p className="text-muted-foreground">
                        Manage rooms and their department assignments.
                    </p>
                </div>
                <AddRoomDialog departments={departments} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
                        <Home className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Registered in the system</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Departments</CardTitle>
                        <Warehouse className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.departments}</div>
                        <p className="text-xs text-muted-foreground">With active room assignments</p>
                    </CardContent>
                </Card>
            </div>

            <RoomTable rooms={rooms} departments={departments} />
        </div>
    )
}
