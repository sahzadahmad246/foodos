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
import { Settings, Loader2, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { saveRazorpayKeys, removeRazorpayKeys } from '@/app/dashboard/outlet/payment-actions'

interface EditPaymentKeysDialogProps {
    restaurantId: string
    hasKeys: boolean
    keyId?: string | null
}

export function EditPaymentKeysDialog({ restaurantId, hasKeys, keyId }: EditPaymentKeysDialogProps) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [showSecret, setShowSecret] = useState(false)
    const [formData, setFormData] = useState({
        keyId: '',
        keySecret: '',
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {}

        if (!formData.keyId.trim()) {
            newErrors.keyId = 'Key ID is required'
        } else if (!formData.keyId.startsWith('rzp_')) {
            newErrors.keyId = 'Invalid format (should start with rzp_)'
        }

        if (!formData.keySecret.trim()) {
            newErrors.keySecret = 'Key Secret is required'
        } else if (formData.keySecret.length < 20) {
            newErrors.keySecret = 'Key Secret seems too short'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = () => {
        if (!validate()) return

        startTransition(async () => {
            const result = await saveRazorpayKeys(restaurantId, formData.keyId, formData.keySecret)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Payment keys saved securely')
                setFormData({ keyId: '', keySecret: '' })
                setOpen(false)
                router.refresh()
            }
        })
    }

    const handleRemove = () => {
        startTransition(async () => {
            const result = await removeRazorpayKeys(restaurantId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Payment keys removed')
                setOpen(false)
                router.refresh()
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Settings className="h-3.5 w-3.5 mr-1" />
                    {hasKeys ? 'Update' : 'Setup'}
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-sm mx-auto">
                <DialogHeader className="pb-2">
                    <DialogTitle className="text-base">Razorpay Payment Keys</DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 text-xs flex gap-2">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>Keys are encrypted before storage. Never share your secret key.</span>
                    </div>

                    {hasKeys && keyId && (
                        <div className="p-2.5 rounded-lg bg-muted text-xs">
                            <p className="text-muted-foreground">Current Key ID:</p>
                            <p className="font-mono">{keyId.substring(0, 12)}••••••••</p>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label className="text-xs">Key ID</Label>
                        <Input
                            value={formData.keyId}
                            onChange={(e) => {
                                setFormData(prev => ({ ...prev, keyId: e.target.value }))
                                setErrors(prev => ({ ...prev, keyId: '' }))
                            }}
                            placeholder="rzp_live_xxxxxxxxxxxxx"
                            className={`text-sm h-9 ${errors.keyId ? 'border-red-500' : ''}`}
                        />
                        {errors.keyId && <p className="text-xs text-red-500">{errors.keyId}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Key Secret</Label>
                        <div className="relative">
                            <Input
                                type={showSecret ? 'text' : 'password'}
                                value={formData.keySecret}
                                onChange={(e) => {
                                    setFormData(prev => ({ ...prev, keySecret: e.target.value }))
                                    setErrors(prev => ({ ...prev, keySecret: '' }))
                                }}
                                placeholder="••••••••••••••••••••"
                                className={`text-sm h-9 pr-10 ${errors.keySecret ? 'border-red-500' : ''}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowSecret(!showSecret)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        {errors.keySecret && <p className="text-xs text-red-500">{errors.keySecret}</p>}
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Get keys from <a href="https://dashboard.razorpay.com/app/keys" target="_blank" className="text-primary underline">Razorpay Dashboard</a>
                    </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                    <Button onClick={handleSubmit} disabled={isPending} className="w-full h-9 text-sm">
                        {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                        {hasKeys ? 'Update Keys' : 'Save Keys'}
                    </Button>
                    {hasKeys && (
                        <Button variant="outline" onClick={handleRemove} disabled={isPending} className="w-full h-9 text-sm text-destructive">
                            Remove Keys
                        </Button>
                    )}
                    <Button variant="ghost" onClick={() => setOpen(false)} className="w-full h-9 text-sm">
                        Cancel
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
