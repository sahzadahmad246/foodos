'use client'

import { useState, useRef } from 'react'
import { Switch } from '@/components/ui/switch'
import { EditPaymentKeysDialog } from '@/components/dashboard/outlet/edit-payment-keys'

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
    const [showDialog, setShowDialog] = useState(false)
    const dialogTriggerRef = useRef<HTMLButtonElement>(null)

    const handleToggle = () => {
        if (!enabled && !hasRazorpayKeys) {
            // Trying to enable but no keys - show dialog
            dialogTriggerRef.current?.click()
        }
    }

    const isDisabled = !hasRazorpayKeys && !enabled

    return (
        <div className={`flex items-center justify-between gap-4 p-3 rounded-lg transition-colors ${enabled ? 'bg-primary/5' : 'bg-muted/50'
            }`}>
            <div className="min-w-0">
                <p className="font-medium text-sm">Online Payments</p>
                <p className="text-xs text-muted-foreground truncate">UPI, cards, wallets</p>
                {!hasRazorpayKeys && (
                    <p className="text-xs text-amber-600 mt-0.5">Setup Razorpay keys first</p>
                )}
            </div>

            <div className="flex items-center gap-2">
                {!hasRazorpayKeys ? (
                    <EditPaymentKeysDialog
                        restaurantId={restaurantId}
                        hasKeys={hasRazorpayKeys}
                        keyId={razorpayKeyId}
                        triggerButton={
                            <button
                                ref={dialogTriggerRef}
                                className="text-xs text-primary underline"
                            >
                                Setup Keys
                            </button>
                        }
                    />
                ) : (
                    <Switch
                        checked={enabled}
                        onCheckedChange={handleToggle}
                        disabled={isDisabled}
                        className="shrink-0"
                    />
                )}
            </div>
        </div>
    )
}
