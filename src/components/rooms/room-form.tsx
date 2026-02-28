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
import { createRoom, updateRoom } from '@/app/actions/rooms'
import { Home, MapPin, Warehouse, Check, X } from 'lucide-react'
import { SheetFooter } from '@/components/ui/sheet'

const roomFormSchema = z.object({
    name: z.string().min(1, 'Room name is required'),
    location: z.string().min(1, 'Location is required'),
    departmentId: z.string().min(1, 'Department is required'),
})

type RoomFormValues = z.infer<typeof roomFormSchema>

interface RoomFormProps {
    mode: 'create' | 'edit'
    initialData?: any
    departments: any[]
    onSuccess?: () => void
    onCancel?: () => void
}

export function RoomForm({ mode, initialData, departments, onSuccess, onCancel }: RoomFormProps) {
    const router = useRouter()
    const [isPending, setIsPending] = React.useState(false)

    const defaultValues = React.useMemo(() => {
        if (mode === 'edit' && initialData) {
            return {
                name: initialData.name || '',
                location: initialData.location || '',
                departmentId: initialData.departmentId?.toString() || '',
            }
        }
        return {
            name: '',
            location: '',
            departmentId: '',
        }
    }, [mode, initialData])

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<RoomFormValues>({
        resolver: zodResolver(roomFormSchema),
        defaultValues,
    })

    // Reset form when initialData or mode changes
    React.useEffect(() => {
        reset(defaultValues)
    }, [initialData, mode, reset, defaultValues])

    const selectedDept = watch('departmentId')

    const onSubmit = async (data: RoomFormValues) => {
        setIsPending(true)
        const formData = new FormData()
        Object.entries(data).forEach(([key, value]) => {
            formData.append(key, value)
        })

        try {
            let result
            if (mode === 'create') {
                result = await createRoom(formData)
            } else {
                result = await updateRoom(initialData.id, formData)
            }

            if (result.error) {
                if (typeof result.error === 'object') {
                    Object.entries(result.error).forEach(([key, messages]: [string, any]) => {
                        toast.error(`${key}: ${messages[0]}`)
                    })
                } else {
                    toast.error(result.error)
                }
            } else {
                toast.success(`Room ${mode === 'create' ? 'created' : 'updated'} successfully`)
                if (onSuccess) onSuccess()
                router.refresh()
            }
        } catch (err) {
            toast.error('An unexpected error occurred')
        } finally {
            setIsPending(false)
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col">
            <div className="flex-1 space-y-6">
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                        <Home className="h-4 w-4 text-primary/70" />
                        Room Name
                    </label>
                    <Input id="name" {...register('name')} placeholder="e.g. IT Lab 1" className="h-11 transition-all focus:ring-2 focus:ring-primary/20" />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                        <MapPin className="h-4 w-4 text-primary/70" />
                        Location
                    </label>
                    <Input id="location" {...register('location')} placeholder="e.g. 3rd Floor, IT Building" className="h-11 transition-all focus:ring-2 focus:ring-primary/20" />
                    {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
                        <Warehouse className="h-4 w-4 text-primary/70" />
                        Department
                    </label>
                    <Select
                        value={selectedDept}
                        onValueChange={(val) => setValue('departmentId', val)}
                    >
                        <SelectTrigger id="departmentId" className="h-11 transition-all focus:ring-2 focus:ring-primary/20">
                            <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent>
                            {departments.map((dept) => (
                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                    {dept.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.departmentId && <p className="text-xs text-destructive">{errors.departmentId.message}</p>}
                </div>
            </div>

            <div className="mt-8 pt-6 border-t">
                <div className="flex w-full justify-end gap-3">
                    {onCancel && (
                        <Button type="button" variant="ghost" onClick={onCancel} className="px-6 h-11 shrink-0">
                            <X className="mr-2 h-4 w-4" /> Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="px-8 h-11 shadow-md hover:shadow-lg transition-all ring-offset-2 shrink-0"
                    >
                        {isPending ? 'Processing...' : (
                            <><Check className="mr-2 h-4 w-4" /> {mode === 'create' ? 'Create Room' : 'Save Changes'}</>
                        )}
                    </Button>
                </div>
            </div>
        </form>
    )
}
