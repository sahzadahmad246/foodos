'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
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

interface EditDeliveryDialogProps {
    restaurantId: string
    settings: {
        delivery_radius_km?: number
        min_order_amount?: number
        delivery_fee?: number
        free_delivery_above?: number
    }
}

export function EditDeliveryDialog({ restaurantId, settings }: EditDeliveryDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [formData, setFormData] = useState({
        delivery_radius_km: settings.delivery_radius_km || 5,
        min_order_amount: settings.min_order_amount || 0,
        delivery_fee: settings.delivery_fee || 0,
        free_delivery_above: settings.free_delivery_above || null,
    })

    const handleSubmit = () => {
        startTransition(async () => {
            const result = await updateRestaurantSettings(restaurantId, formData)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Delivery settings updated')
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
                    <DialogTitle>Delivery Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-5 py-2">
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <Label className="text-sm">Delivery Radius</Label>
                            <span className="text-sm font-medium">{formData.delivery_radius_km} km</span>
                        </div>
                        <Slider
                            value={[formData.delivery_radius_km]}
                            onValueChange={([value]) => setFormData(prev => ({ ...prev, delivery_radius_km: value }))}
                            min={1}
                            max={20}
                            step={0.5}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-sm">Min Order ₹</Label>
                            <Input
                                type="number"
                                min="0"
                                value={formData.min_order_amount}
                                onChange={(e) => setFormData(prev => ({ ...prev, min_order_amount: Number(e.target.value) || 0 }))}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm">Delivery Fee ₹</Label>
                            <Input
                                type="number"
                                min="0"
                                value={formData.delivery_fee}
                                onChange={(e) => setFormData(prev => ({ ...prev, delivery_fee: Number(e.target.value) || 0 }))}
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-sm">Free Delivery Above ₹</Label>
                        <Input
                            type="number"
                            min="0"
                            value={formData.free_delivery_above || ''}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                free_delivery_above: e.target.value ? Number(e.target.value) : null
                            }))}
                            placeholder="Leave empty to disable"
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
