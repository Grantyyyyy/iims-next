'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Field,
    FieldContent,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createUser, updateUser } from '@/app/actions/users'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const userSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(50),
    password: z.string().optional().or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
    role: z.enum(['ADMIN', 'SECRETARY', 'LABTECH', 'DEAN', 'STAFF', 'ICTC', 'SUPPLY']),
    departmentId: z.string().optional().nullable(),
    contactNumber: z.string().optional().nullable(),
}).refine((data) => {
    // If passwords are provided, they must match
    if (data.password && data.password.length > 0) {
        return data.password === data.confirmPassword
    }
    return true
}, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
}).refine((data) => {
    // If it's a new user (conceptual, we check if password is provided if we want to enforce it)
    // Actually we'll handle enforcement in the component if needed, or leave it to server.
    return true
})

interface UserFormProps {
    mode: 'create' | 'edit'
    initialData?: any
    departments: any[]
    currentUserId?: number
    onSuccess?: () => void
    formId?: string
    showFooter?: boolean
    isLoading?: (loading: boolean) => void
}

export function UserForm({
    mode,
    initialData,
    departments,
    currentUserId,
    onSuccess,
    formId = "user-form",
    showFooter = true,
    isLoading
}: UserFormProps) {
    const router = useRouter()
    const [isPending, setIsPending] = React.useState(false)

    React.useEffect(() => {
        if (isLoading) isLoading(isPending)
    }, [isPending, isLoading])

    const defaultValues = React.useMemo(() => {
        if (mode === 'edit' && initialData) {
            return {
                firstName: initialData.firstName || '',
                lastName: initialData.lastName || '',
                email: initialData.email || '',
                username: initialData.username || '',
                password: '',
                confirmPassword: '',
                role: initialData.roles?.[0]?.role?.name || 'STAFF',
                departmentId: initialData.departmentId?.toString() || 'none',
                contactNumber: initialData.contactNumber || '',
            }
        }
        return {
            firstName: '',
            lastName: '',
            email: '',
            username: '',
            password: '',
            confirmPassword: '',
            role: 'STAFF' as const,
            departmentId: 'none',
            contactNumber: '',
        }
    }, [mode, initialData])

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<z.infer<typeof userSchema>>({
        resolver: zodResolver(userSchema),
        defaultValues,
    })

    // Set initial select values
    React.useEffect(() => {
        if (mode === 'edit' && initialData) {
            setValue('role', initialData.roles?.[0]?.role?.name || 'STAFF')
            setValue('departmentId', initialData.departmentId?.toString() || 'none')
        }
    }, [mode, initialData, setValue])

    const selectedRole = watch('role')
    const selectedDept = watch('departmentId')

    const onSubmit = async (data: any) => {
        setIsPending(true)
        const formData = new FormData()
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value.toString())
            }
        })

        try {
            let result
            if (mode === 'create') {
                result = await createUser(formData)
            } else {
                result = await updateUser(initialData.id, formData)
            }

            if (result.error) {
                // Map server errors to form labels if possible, or just toast
                if (typeof result.error === 'object') {
                    Object.entries(result.error).forEach(([key, messages]: [string, any]) => {
                        toast.error(`${key}: ${messages[0]}`)
                    })
                } else {
                    toast.error(result.error)
                }
            } else {
                toast.success(`User ${mode === 'create' ? 'created' : 'updated'} successfully`)
                if (onSuccess) {
                    onSuccess()
                } else {
                    router.push('/dashboard/users')
                }
            }
        } catch (err) {
            toast.error('An unexpected error occurred')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                    <FieldLabel htmlFor="firstName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">First Name</FieldLabel>
                    <Input id="firstName" {...register('firstName')} placeholder="John" className="rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300 h-11" />
                    <FieldError errors={[errors.firstName]} />
                </Field>
                <Field>
                    <FieldLabel htmlFor="lastName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Last Name</FieldLabel>
                    <Input id="lastName" {...register('lastName')} placeholder="Doe" className="rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300 h-11" />
                    <FieldError errors={[errors.lastName]} />
                </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                    <FieldLabel htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email</FieldLabel>
                    <Input id="email" type="email" {...register('email')} placeholder="john.doe@example.com" className="rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300 h-11" />
                    <FieldError errors={[errors.email]} />
                </Field>
                <Field>
                    <FieldLabel htmlFor="username" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Username</FieldLabel>
                    <Input id="username" {...register('username')} placeholder="johndoe" className="rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300 h-11" />
                    <FieldError errors={[errors.username]} />
                </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                    <FieldLabel htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                        {mode === 'create' ? 'Password' : 'New Password (optional)'}
                    </FieldLabel>
                    <Input id="password" type="password" {...register('password')} className="rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300 h-11" />
                    <FieldError errors={[errors.password]} />
                </Field>
                {mode === 'create' && (
                    <Field>
                        <FieldLabel htmlFor="confirmPassword" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Confirm Password</FieldLabel>
                        <Input id="confirmPassword" type="password" {...register('confirmPassword')} className="rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300 h-11" />
                        <FieldError errors={[(errors as any).confirmPassword]} />
                    </Field>
                )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field>
                    <FieldLabel htmlFor="role" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Role</FieldLabel>
                    <Select
                        value={selectedRole}
                        onValueChange={(val) => setValue('role', val as any)}
                        disabled={mode === 'edit' && initialData?.id === currentUserId}
                    >
                        <SelectTrigger id="role" className="w-full h-11 rounded-xl bg-muted/20 border-border/50">
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ADMIN">ADMIN</SelectItem>
                            <SelectItem value="SECRETARY">SECRETARY</SelectItem>
                            <SelectItem value="LABTECH">LABTECH</SelectItem>
                            <SelectItem value="DEAN">DEAN</SelectItem>
                            <SelectItem value="STAFF">STAFF</SelectItem>
                            <SelectItem value="ICTC">ICTC</SelectItem>
                            <SelectItem value="SUPPLY">SUPPLY</SelectItem>
                        </SelectContent>
                    </Select>
                    {mode === 'edit' && initialData?.id === currentUserId && (
                        <p className="text-[10px] text-muted-foreground mt-1">You cannot change your own role.</p>
                    )}
                    <FieldError errors={[errors.role]} />
                </Field>
                <Field>
                    <FieldLabel htmlFor="departmentId" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Department</FieldLabel>
                    <Select
                        value={selectedDept || "none"}
                        onValueChange={(val) => setValue('departmentId', val)}
                    >
                        <SelectTrigger id="departmentId" className="w-full h-11 rounded-xl bg-muted/20 border-border/50">
                            <SelectValue placeholder="Select Department (Optional)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                    {dept.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FieldError errors={[errors.departmentId]} />
                </Field>
            </div>

            <Field>
                <FieldLabel htmlFor="contactNumber" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Contact Number (Optional)</FieldLabel>
                <Input id="contactNumber" {...register('contactNumber')} placeholder="09123456789" className="rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300 h-11" />
                <FieldError errors={[errors.contactNumber]} />
            </Field>

            {showFooter && (
                <div className="flex justify-end gap-4">
                    {!onSuccess && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/dashboard/users')}
                            disabled={isPending}
                            className="rounded-xl h-11"
                        >
                            Cancel
                        </Button>
                    )}
                    <Button type="submit" disabled={isPending} className="w-full sm:w-auto rounded-xl h-11 bg-gradient-to-r from-primary to-primary/80 border-none shadow-md hover:shadow-lg transition-all active:scale-95">
                        {isPending ? 'Saving...' : mode === 'create' ? 'Create User' : 'Update User'}
                    </Button>
                </div>
            )}
        </form>
    )
}
