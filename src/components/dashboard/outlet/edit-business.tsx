'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Pencil, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { updateRestaurantSettings } from '@/app/onboarding/actions'

interface EditBusinessDialogProps {
    restaurantId: string
    settings: {
        has_gst?: boolean
        gst_number?: string
        gst_percentage?: number
        fssai_number?: string
    }
}

export function EditBusinessDialog({ restaurantId, settings }: EditBusinessDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [formData, setFormData] = useState({
        has_gst: settings.has_gst || false,
        gst_number: settings.gst_number || '',
        gst_percentage: settings.gst_percentage || 0,
        fssai_number: settings.fssai_number || '',
    })

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (formData.has_gst && !formData.gst_number.trim()) {
            newErrors.gst_number = 'Required when GST enabled'
        } else if (formData.gst_number && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(formData.gst_number)) {
            newErrors.gst_number = 'Invalid format'
        }

        if (formData.fssai_number && !/^\d{14}$/.test(formData.fssai_number)) {
            newErrors.fssai_number = 'Must be 14 digits'
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
                toast.success('Business details updated')
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
                    <DialogTitle>Business Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div>
                            <p className="font-medium text-sm">GST Registered</p>
                            <p className="text-xs text-muted-foreground">Are you GST registered?</p>
                        </div>
                        <Switch
                            checked={formData.has_gst}
                            onCheckedChange={(checked) => {
                                setFormData(prev => ({ ...prev, has_gst: checked }))
                                if (!checked) setErrors({})
                            }}
                        />
                    </div>

                    {formData.has_gst && (
                        <>
                            <div className="space-y-1.5">
                                <Label className="text-sm">GSTIN *</Label>
                                <Input
                                    value={formData.gst_number}
                                    onChange={(e) => {
                                        setFormData(prev => ({ ...prev, gst_number: e.target.value.toUpperCase() }))
                                        setErrors(prev => ({ ...prev, gst_number: '' }))
                                    }}
                                    placeholder="22AAAAA0000A1Z5"
                                    className={errors.gst_number ? 'border-red-500' : ''}
                                />
                                {errors.gst_number && <p className="text-xs text-red-500">{errors.gst_number}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm">GST Rate</Label>
                                <Select
                                    value={String(formData.gst_percentage)}
                                    onValueChange={(v) => setFormData(prev => ({ ...prev, gst_percentage: Number(v) }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {[0, 5, 12, 18].map(rate => (
                                            <SelectItem key={rate} value={String(rate)}>{rate}%</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    <div className="space-y-1.5">
                        <Label className="text-sm">FSSAI License</Label>
                        <Input
                            value={formData.fssai_number}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 14)
                                setFormData(prev => ({ ...prev, fssai_number: value }))
                                setErrors(prev => ({ ...prev, fssai_number: '' }))
                            }}
                            placeholder="14 digit number"
                            maxLength={14}
                            className={errors.fssai_number ? 'border-red-500' : ''}
                        />
                        {errors.fssai_number && <p className="text-xs text-red-500">{errors.fssai_number}</p>}
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
