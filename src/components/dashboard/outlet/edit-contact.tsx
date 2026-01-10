'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateRestaurant } from '@/app/onboarding/actions'

interface EditContactDialogProps {
    restaurant: {
        id: string
        phone: string | null
        phone_secondary: string | null
        email: string | null
    }
}

const validatePhone = (phone: string): string | null => {
    if (!phone) return null
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length < 10) return 'Min 10 digits'
    if (cleaned.length > 12) return 'Max 12 digits'
    return null
}

const validateEmail = (email: string): string | null => {
    if (!email) return null
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email'
    return null
}

export function EditContactDialog({ restaurant }: EditContactDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [errors, setErrors] = useState<Record<string, string | null>>({})
    const [formData, setFormData] = useState({
        phone: restaurant.phone || '',
        phone_secondary: restaurant.phone_secondary || '',
        email: restaurant.email || '',
    })

    const handlePhoneChange = (field: 'phone' | 'phone_secondary', value: string) => {
        const cleaned = value.replace(/[^\d+]/g, '').replace(/(?!^)\+/g, '')
        setFormData(prev => ({ ...prev, [field]: cleaned }))
        setErrors(prev => ({ ...prev, [field]: validatePhone(cleaned) }))
    }

    const validate = (): boolean => {
        const newErrors = {
            phone: validatePhone(formData.phone),
            phone_secondary: validatePhone(formData.phone_secondary),
            email: validateEmail(formData.email),
        }
        setErrors(newErrors)
        return !Object.values(newErrors).some(e => e !== null)
    }

    const handleSubmit = () => {
        if (!validate()) return

        startTransition(async () => {
            const result = await updateRestaurant(restaurant.id, formData as any)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Contact updated')
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
                    <DialogTitle>Edit Contact</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label className="text-sm">Primary Phone</Label>
                        <Input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handlePhoneChange('phone', e.target.value)}
                            placeholder="+91 9876543210"
                            className={errors.phone ? 'border-red-500' : ''}
                        />
                        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm">Secondary Phone</Label>
                        <Input
                            type="tel"
                            value={formData.phone_secondary}
                            onChange={(e) => handlePhoneChange('phone_secondary', e.target.value)}
                            placeholder="Optional"
                            className={errors.phone_secondary ? 'border-red-500' : ''}
                        />
                        {errors.phone_secondary && <p className="text-xs text-red-500">{errors.phone_secondary}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm">Email</Label>
                        <Input
                            type="email"
                            value={formData.email}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, email: e.target.value }))
                                setErrors(prev => ({ ...prev, email: validateEmail(e.target.value) }))
                            }}
                            placeholder="restaurant@example.com"
                            className={errors.email ? 'border-red-500' : ''}
                        />
                        {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
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
