"use client"

import * as React from "react"
import {
    Sheet, SheetContent, SheetDescription, SheetHeader,
    SheetTitle
} from "@/components/ui/sheet"
import { RoomForm } from "./room-form"

interface EditRoomSheetProps {
    room: any
    departments: any[]
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditRoomSheet({ room, departments, open, onOpenChange }: EditRoomSheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="flex flex-col gap-0 sm:max-w-md border-l shadow-2xl">
                <SheetHeader className="pb-6 border-b bg-muted/20 px-1">
                    <SheetTitle className="text-2xl font-bold tracking-tight">Edit Room Details</SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground">
                        Update the information for <strong>{room?.name}</strong>.
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto py-8 px-1">
                    {room && (
                        <RoomForm
                            mode="edit"
                            initialData={room}
                            departments={departments}
                            onSuccess={() => onOpenChange(false)}
                            onCancel={() => onOpenChange(false)}
                        />
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
