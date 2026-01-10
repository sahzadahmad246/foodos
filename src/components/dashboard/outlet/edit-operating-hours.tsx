'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateRestaurantSettings } from '@/app/onboarding/actions'

interface EditOperatingHoursDialogProps {
    restaurantId: string
    settings: {
        opening_time?: string
        closing_time?: string
        working_days?: string[]
    }
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function EditOperatingHoursDialog({ restaurantId, settings }: EditOperatingHoursDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [formData, setFormData] = useState({
        opening_time: settings.opening_time || '09:00',
        closing_time: settings.closing_time || '22:00',
        working_days: settings.working_days || ALL_DAYS,
    })

    const toggleDay = (day: string) => {
        setFormData(prev => ({
            ...prev,
            working_days: prev.working_days.includes(day)
                ? prev.working_days.filter(d => d !== day)
                : [...prev.working_days, day]
        }))
        setErrors({})
    }

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}
        if (formData.working_days.length === 0) {
            newErrors.working_days = 'Select at least one day'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = () => {
        if (!validate()) return

        startTransition(async () => {
            const result = await updateRestaurantSettings(restaurantId, formData)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Operating hours updated')
                setOpen(false)
                router.refresh()
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                    <Pencil className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Operating Hours</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-sm">Opens at</Label>
                            <Input
                                type="time"
                                value={formData.opening_time}
                                onChange={(e) => setFormData(prev => ({ ...prev, opening_time: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm">Closes at</Label>
                            <Input
                                type="time"
                                value={formData.closing_time}
                                onChange={(e) => setFormData(prev => ({ ...prev, closing_time: e.target.value }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm">Working Days</Label>
                        <div className="flex flex-wrap gap-1.5">
                            {ALL_DAYS.map(day => (
                                <Badge
                                    key={day}
                                    variant={formData.working_days.includes(day) ? 'default' : 'outline'}
                                    className="cursor-pointer px-3 py-1.5 text-sm transition-all hover:scale-105"
                                    onClick={() => toggleDay(day)}
                                >
                                    {day}
                                </Badge>
                            ))}
                        </div>
                        {errors.working_days && <p className="text-xs text-red-500">{errors.working_days}</p>}
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isPending} className="flex-1">
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
