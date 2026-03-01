'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
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
import { Home, MapPin, Warehouse, Check, X, Loader2 } from 'lucide-react'

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
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                        <Home className="h-3 w-3 text-primary/70" />
                        Room Name
                    </label>
                    <Input
                        id="name"
                        {...register('name')}
                        placeholder="e.g. IT Lab 1"
                        className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                        <MapPin className="h-3 w-3 text-primary/70" />
                        Location
                    </label>
                    <Input
                        id="location"
                        {...register('location')}
                        placeholder="e.g. 3rd Floor, IT Building"
                        className="h-11 rounded-xl bg-muted/20 focus:bg-background border-border/50 transition-all duration-300"
                    />
                    {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                        <Warehouse className="h-3 w-3 text-primary/70" />
                        Department
                    </label>
                    <Select
                        value={selectedDept}
                        onValueChange={(val) => setValue('departmentId', val)}
                    >
                        <SelectTrigger id="departmentId" className="h-11 rounded-xl bg-muted/20 border-border/50 transition-all">
                            <SelectValue placeholder="Select Department" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
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

            <div className="mt-8 pt-6 border-t flex w-full justify-end gap-3">
                {onCancel && (
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="flex items-center gap-2 h-11 px-6 rounded-xl hover:bg-muted/30 transition-all font-medium"
                    >
                        <X className="h-4 w-4" /> Cancel
                    </Button>
                )}
                <Button
                    type="submit"
                    disabled={isPending}
                    className="flex items-center gap-2 px-8 h-11 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-95 bg-gradient-to-r from-primary to-primary/80 border-none group min-w-[140px]"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Processing...
                        </>
                    ) : (
                        <>
                            <Check className="h-4 w-4" />
                            {mode === 'create' ? 'Create Room' : 'Save Changes'}
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
