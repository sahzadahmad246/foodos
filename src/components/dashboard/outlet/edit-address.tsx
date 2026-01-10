'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
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

const LocationPicker = dynamic(
    () => import('@/components/location-picker').then(mod => mod.LocationPicker),
    {
        ssr: false,
        loading: () => (
            <div className="h-48 rounded-lg border-2 border-dashed flex items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        )
    }
)

interface EditAddressDialogProps {
    restaurant: {
        id: string
        address_line1: string | null
        address_line2: string | null
        city: string | null
        state: string | null
        pincode: string | null
        latitude: number | null
        longitude: number | null
    }
}

export function EditAddressDialog({ restaurant }: EditAddressDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [errors, setErrors] = useState<Record<string, string | null>>({})
    const [formData, setFormData] = useState({
        address_line1: restaurant.address_line1 || '',
        address_line2: restaurant.address_line2 || '',
        city: restaurant.city || '',
        state: restaurant.state || '',
        pincode: restaurant.pincode || '',
        latitude: restaurant.latitude || undefined,
        longitude: restaurant.longitude || undefined,
    })

    const handlePincodeChange = (value: string) => {
        const cleaned = value.replace(/\D/g, '').slice(0, 6)
        setFormData(prev => ({ ...prev, pincode: cleaned }))
        if (cleaned && cleaned.length !== 6) {
            setErrors(prev => ({ ...prev, pincode: '6 digits required' }))
        } else {
            setErrors(prev => ({ ...prev, pincode: null }))
        }
    }

    const handleSubmit = () => {
        if (formData.pincode && formData.pincode.length !== 6) {
            setErrors({ pincode: '6 digits required' })
            return
        }

        startTransition(async () => {
            const result = await updateRestaurant(restaurant.id, formData as any)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Address updated')
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
            <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Address</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                        <Label className="text-sm">Address Line 1</Label>
                        <Input
                            value={formData.address_line1}
                            onChange={(e) => setFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                            placeholder="Street address"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm">Address Line 2</Label>
                        <Input
                            value={formData.address_line2}
                            onChange={(e) => setFormData(prev => ({ ...prev, address_line2: e.target.value }))}
                            placeholder="Apt, floor, landmark"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-sm">City</Label>
                            <Input
                                value={formData.city}
                                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm">State</Label>
                            <Input
                                value={formData.state}
                                onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm">Pincode</Label>
                        <Input
                            value={formData.pincode}
                            onChange={(e) => handlePincodeChange(e.target.value)}
                            maxLength={6}
                            placeholder="6 digit pincode"
                            className={errors.pincode ? 'border-red-500' : ''}
                        />
                        {errors.pincode && <p className="text-xs text-red-500">{errors.pincode}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm">Pin on Map</Label>
                        <LocationPicker
                            latitude={formData.latitude}
                            longitude={formData.longitude}
                            onLocationChange={(lat, lng) =>
                                setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }))
                            }
                        />
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
