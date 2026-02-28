"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { UserForm } from "./user-form"

interface EditUserDialogProps {
    user: any
    departments: any[]
    currentUserId?: number
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
}

export function EditUserDialog({
    user,
    departments,
    currentUserId,
    open,
    onOpenChange,
    onSuccess
}: EditUserDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit User</DialogTitle>
                    <DialogDescription>
                        Update account details and permissions for {user?.firstName} {user?.lastName}.
                    </DialogDescription>
                </DialogHeader>
                {user && (
                    <UserForm
                        mode="edit"
                        initialData={user}
                        departments={departments}
                        currentUserId={currentUserId}
                        onSuccess={onSuccess}
                    />
                )}
            </DialogContent>
        </Dialog>
    )
}
