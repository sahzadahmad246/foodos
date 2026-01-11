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
import { Settings, Loader2, Eye, EyeOff, ExternalLink, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { saveRazorpayKeys, removeRazorpayKeys } from '@/app/dashboard/outlet/payment-actions'

interface EditPaymentKeysDialogProps {
    restaurantId: string
    hasKeys: boolean
    keyId?: string | null
    triggerButton?: React.ReactNode
    onSuccess?: () => void
}

export function EditPaymentKeysDialog({
    restaurantId,
    hasKeys,
    keyId,
    triggerButton,
    onSuccess
}: EditPaymentKeysDialogProps) {
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
            newErrors.keyId = 'Should start with rzp_'
        }

        if (!formData.keySecret.trim()) {
            newErrors.keySecret = 'Key Secret is required'
        } else if (formData.keySecret.length < 20) {
            newErrors.keySecret = 'Seems too short'
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
                toast.success('Payment keys saved!')
                setFormData({ keyId: '', keySecret: '' })
                setOpen(false)
                onSuccess?.()
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

    const defaultTrigger = (
        <Button variant="outline" size="sm" className="h-8 text-xs">
            <Settings className="h-3.5 w-3.5 mr-1" />
            {hasKeys ? 'Update' : 'Setup'}
        </Button>
    )

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {triggerButton || defaultTrigger}
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-sm mx-auto max-h-[90vh] flex flex-col p-0">
                <DialogHeader className="px-4 pt-4 pb-2 shrink-0">
                    <DialogTitle className="text-base">Razorpay API Keys</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                    {/* Guide */}
                    <div className="p-3 rounded-lg bg-muted text-xs space-y-2">
                        <p className="font-medium">How to get Razorpay keys:</p>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                            <li>Go to <a href="https://dashboard.razorpay.com" target="_blank" className="text-primary underline">dashboard.razorpay.com</a></li>
                            <li>Login or create account</li>
                            <li>Go to Settings → API Keys</li>
                            <li>Generate new key pair</li>
                            <li>Copy Key ID & Key Secret</li>
                        </ol>
                        <a
                            href="https://razorpay.com/docs/payments/dashboard/account-settings/api-keys/"
                            target="_blank"
                            className="inline-flex items-center gap-1 text-primary text-xs mt-2"
                        >
                            Full documentation <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>

                    {hasKeys && keyId && (
                        <div className="p-2.5 rounded-lg bg-green-50 dark:bg-green-950/30 text-xs flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <div>
                                <p className="text-green-800 dark:text-green-200">Keys configured</p>
                                <p className="font-mono text-green-600">{keyId.substring(0, 12)}••••</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <Label className="text-xs">Key ID *</Label>
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
                        <Label className="text-xs">Key Secret *</Label>
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
                </div>

                <div className="px-4 pb-4 flex flex-col gap-2 shrink-0">
                    <Button onClick={handleSubmit} disabled={isPending} className="w-full h-9 text-sm">
                        {isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                        {hasKeys ? 'Update Keys' : 'Save & Enable Payments'}
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
