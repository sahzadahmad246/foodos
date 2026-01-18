'use client'

import { useState, useTransition } from 'react'
import { Switch } from '@/components/ui/switch'
import { toggleRiderStatus } from '@/app/rider/actions'
import { toast } from 'sonner'

interface RiderStatusToggleProps {
    riderId: string
    currentStatus: 'online' | 'offline' | 'on_delivery'
}

export function RiderStatusToggle({ riderId, currentStatus }: RiderStatusToggleProps) {
    const [isPending, startTransition] = useTransition()
    const [isOnline, setIsOnline] = useState(currentStatus !== 'offline')

    const handleToggle = (checked: boolean) => {
        if (currentStatus === 'on_delivery') {
            toast.error('Cannot go offline while on delivery')
            return
        }

        setIsOnline(checked)
        startTransition(async () => {
            const result = await toggleRiderStatus(riderId, checked ? 'online' : 'offline')
            if (result.error) {
                toast.error(result.error)
                setIsOnline(!checked) // Revert
            } else {
                toast.success(checked ? 'You are now online' : 'You are now offline')
            }
        })
    }

    return (
        <div className="flex items-center gap-3">
            <Switch
                checked={isOnline}
                onCheckedChange={handleToggle}
                disabled={isPending || currentStatus === 'on_delivery'}
            />
            <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-muted-foreground'}`}>
                {isPending ? 'Updating...' : isOnline ? 'Online' : 'Offline'}
            </span>
        </div>
    )
}
