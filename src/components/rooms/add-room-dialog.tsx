"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Sheet, SheetContent, SheetDescription, SheetHeader,
    SheetTitle
} from "@/components/ui/sheet"
import { Plus, Check, X } from "lucide-react"
import { RoomForm } from "./room-form"

interface AddRoomDialogProps {
    departments: any[]
}

export function AddRoomDialog({ departments }: AddRoomDialogProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <Button onClick={() => setOpen(true)} className="gap-2 shadow-sm">
                <Plus className="h-4 w-4" />
                Add New Room
            </Button>
            <SheetContent className="flex flex-col gap-0 sm:max-w-md border-l shadow-2xl">
                <SheetHeader className="pb-6 border-b bg-muted/20 px-1">
                    <SheetTitle className="text-2xl font-bold tracking-tight">Create New Room</SheetTitle>
                    <SheetDescription className="text-sm text-muted-foreground">
                        Register a new room in a department.
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto py-8 px-1">
                    <RoomForm
                        mode="create"
                        departments={departments}
                        onSuccess={() => setOpen(false)}
                        onCancel={() => setOpen(false)}
                    />
                </div>
            </SheetContent>
        </Sheet>
    )
}
