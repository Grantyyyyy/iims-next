"use client"

import * as React from "react"
import {
    Sheet, SheetContent, SheetDescription, SheetHeader,
    SheetTitle
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
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
            <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 border-l shadow-2xl">
                <SheetHeader className="px-6 pt-5 pb-3 border-b bg-gradient-to-b from-primary/5 to-transparent sticky top-0 z-50 bg-background/95 backdrop-blur-md overflow-hidden shrink-0">
                    {/* Subtle Glow Effect */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />

                    <div className="relative z-10 text-left">
                        <SheetTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Edit Room Details
                        </SheetTitle>
                        <SheetDescription className="text-sm font-medium mt-1">
                            Update the information for <strong>{room?.name}</strong>.
                        </SheetDescription>
                    </div>
                </SheetHeader>
                <ScrollArea className="flex-1 px-6 py-8">
                    {room && (
                        <RoomForm
                            mode="edit"
                            initialData={room}
                            departments={departments}
                            onSuccess={() => onOpenChange(false)}
                            onCancel={() => onOpenChange(false)}
                        />
                    )}
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}
