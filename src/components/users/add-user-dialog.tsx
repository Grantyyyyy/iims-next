"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
} from "@/components/ui/sheet"
import { Plus, Check, X, Loader2 } from "lucide-react"
import { UserForm } from "./user-form"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AddUserDialogProps {
    departments: any[]
    currentUserId?: number
}

export function AddUserDialog({ departments, currentUserId }: AddUserDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [isPending, setIsPending] = React.useState(false)
    const formId = "add-user-form"

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button className="gap-2 h-11 px-6 rounded-xl hover:shadow-lg transition-all active:scale-95 bg-gradient-to-r from-primary to-primary/80 border-none font-bold">
                    <Plus className="h-4 w-4" />
                    Add User
                </Button>
            </SheetTrigger>
            <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 border-l shadow-2xl">
                <SheetHeader className="px-6 pt-5 pb-3 border-b bg-gradient-to-b from-primary/5 to-transparent sticky top-0 z-50 bg-background/95 backdrop-blur-md overflow-hidden shrink-0">
                    {/* Subtle Glow Effect */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl opacity-50 pointer-events-none" />
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl opacity-30 pointer-events-none" />

                    <div className="relative z-10 text-left">
                        <SheetTitle className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Add New User
                        </SheetTitle>
                        <SheetDescription className="text-sm font-medium mt-1">
                            Create a new user account and assign roles and departments.
                        </SheetDescription>
                    </div>
                </SheetHeader>

                <ScrollArea className="flex-1 px-6 py-8">
                    <UserForm
                        mode="create"
                        formId={formId}
                        departments={departments}
                        currentUserId={currentUserId}
                        onSuccess={() => setOpen(false)}
                        showFooter={false}
                        isLoading={setIsPending}
                    />
                </ScrollArea>

                <SheetFooter className="px-6 py-4 border-t flex-row justify-end gap-3 shrink-0 bg-muted/5">
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 h-11 px-6 rounded-xl hover:bg-muted/30 transition-all font-medium"
                    >
                        <X className="h-4 w-4" />
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        form={formId}
                        disabled={isPending}
                        className="flex items-center gap-2 px-8 h-11 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 bg-gradient-to-r from-primary to-primary/80 border-none group min-w-[140px]"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4" />
                                Create User
                            </>
                        )}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
