'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { Loader2 } from 'lucide-react'
import { toggleOnlinePayment } from '@/app/dashboard/outlet/payment-actions'
import { toast } from 'sonner'

interface OnlinePaymentToggleProps {
    restaurantId: string
    enabled: boolean
    hasRazorpayKeys: boolean
    razorpayKeyId?: string | null
}

export function OnlinePaymentToggle({
    restaurantId,
    enabled,
    hasRazorpayKeys,
    razorpayKeyId
}: OnlinePaymentToggleProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [isEnabled, setIsEnabled] = useState(enabled)

    const handleToggle = (checked: boolean) => {
        if (!hasRazorpayKeys && checked) {
            toast.error('Please setup Razorpay keys first')
            return
        }

        setIsEnabled(checked)
        startTransition(async () => {
            const result = await toggleOnlinePayment(restaurantId, checked)
            if (result.error) {
                setIsEnabled(!checked) // Revert on error
                toast.error(result.error)
            } else {
                toast.success(checked ? 'Online payments enabled' : 'Online payments disabled')
                router.refresh()
            }
        })
    }

    return (
        <div className={`flex items-center justify-between gap-4 p-3 rounded-lg transition-colors ${isEnabled ? 'bg-primary/5' : 'bg-muted/50'
            }`}>
            <div className="min-w-0">
                <p className="font-medium text-sm">Online Payments</p>
                <p className="text-xs text-muted-foreground truncate">UPI, cards, wallets</p>
                {!hasRazorpayKeys && (
                    <p className="text-xs text-amber-600 mt-0.5">Setup Razorpay keys first</p>
                )}
            </div>

            <div className="flex items-center gap-2">
                {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <Switch
                        checked={isEnabled}
                        onCheckedChange={handleToggle}
                        disabled={!hasRazorpayKeys}
                        className="shrink-0"
                    />
                )}
            </div>
        </div>
    )
}
