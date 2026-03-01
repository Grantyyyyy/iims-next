'use client'

import React from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Pencil, Trash2, Search, MoreHorizontal, Check, X, MapPin, Warehouse } from 'lucide-react'
import { deleteRoom } from '@/app/actions/rooms'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { EditRoomSheet } from '@/components/rooms/edit-room-sheet'
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination'

interface Department {
    id: number
    name: string
}

interface Room {
    id: number
    name: string
    location: string
    departmentId: number
    department?: Department
}

interface RoomTableProps {
    rooms: Room[]
    departments: Department[]
}

export function RoomTable({ rooms, departments }: RoomTableProps) {
    const router = useRouter()
    const [isPending, startTransition] = React.useTransition()
    const [isEditOpen, setIsEditOpen] = React.useState(false)
    const [isDeleteOpen, setIsDeleteOpen] = React.useState(false)
    const [selectedRoom, setSelectedRoom] = React.useState<Room | null>(null)
    const [searchQuery, setSearchQuery] = React.useState('')
    const [currentPage, setCurrentPage] = React.useState(1)
    const itemsPerPage = 8

    const filteredRooms = rooms.filter((room) =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.department?.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const totalPages = Math.ceil(filteredRooms.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedRooms = filteredRooms.slice(startIndex, startIndex + itemsPerPage)

    const openEdit = (room: Room) => {
        setSelectedRoom(room)
        setIsEditOpen(true)
    }

    const openDelete = (room: Room) => {
        setSelectedRoom(room)
        setIsDeleteOpen(true)
    }

    const handleDelete = async () => {
        if (!selectedRoom) return

        startTransition(async () => {
            try {
                const result = await deleteRoom(selectedRoom.id)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success('Room deleted successfully')
                    setIsDeleteOpen(false)
                    router.refresh()
                }
            } catch {
                toast.error('An unexpected error occurred')
            }
        })
    }

    if (rooms.length === 0) {
        return (
            <div className="flex min-h-[400px] flex-col items-center justify-center rounded-md border border-dashed p-8 text-center animate-in fade-in duration-500">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                    <MoreHorizontal className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No rooms found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    There are no rooms in records. Click &quot;Add Room&quot; to get started.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-6 bg-card p-6 rounded-xl border shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="relative flex-1 min-w-[300px] max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search rooms..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setCurrentPage(1)
                            }}
                            className="pl-10 h-10 rounded-lg bg-muted/30 focus-visible:ring-primary/20 transition-all border-muted-foreground/20"
                        />
                    </div>
                </div>

                <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="font-semibold text-foreground/80">Room Name</TableHead>
                                <TableHead className="font-semibold text-foreground/80">Location</TableHead>
                                <TableHead className="font-semibold text-foreground/80">Department</TableHead>
                                <TableHead className="text-right font-semibold text-foreground/80">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedRooms.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                                        No rooms matching your search.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedRooms.map((room) => (
                                    <TableRow key={room.id} className="hover:bg-muted/30 transition-colors">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground font-medium">
                                                    {room.name.charAt(0).toUpperCase()}
                                                </div>
                                                <button
                                                    onClick={() => openEdit(room)}
                                                    className="font-medium hover:underline text-foreground hover:text-primary transition-colors text-left"
                                                >
                                                    {room.name}
                                                </button>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">{room.location}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">{room.department?.name || '---'}</span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => openEdit(room)} className="cursor-pointer">
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openDelete(room)} className="cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground">
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete Room
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-2">
                        <div className="text-sm text-muted-foreground whitespace-nowrap">
                            Showing {Math.min(filteredRooms.length, startIndex + 1)} to {Math.min(startIndex + itemsPerPage, filteredRooms.length)} of {filteredRooms.length}
                        </div>
                        <Pagination className="w-auto flex-1 flex justify-end">
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        className={cn(
                                            "cursor-pointer",
                                            currentPage === 1 && "pointer-events-none opacity-50"
                                        )}
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    />
                                </PaginationItem>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <PaginationItem key={page}>
                                        <PaginationLink
                                            className="cursor-pointer"
                                            isActive={currentPage === page}
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        className={cn(
                                            "cursor-pointer",
                                            currentPage === totalPages && "pointer-events-none opacity-50"
                                        )}
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </div>

            <EditRoomSheet
                room={selectedRoom}
                departments={departments}
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
            />

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Room</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{selectedRoom?.name}</strong>? This action cannot be undone.
                            Rooms with active assignments or inventory records may not be deletable.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
                            {isPending ? 'Deleting...' : 'Delete Room'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
