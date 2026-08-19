'use client'

import { useEffect, useState, useTransition } from 'react'
import { Switch } from '@/components/ui/switch'
import { arrivedAtRestaurant, toggleRiderStatus } from '@/app/rider/actions'
import { toast } from 'sonner'

interface RiderStatusToggleProps {
    riderId: string
    currentStatus: 'online' | 'offline' | 'on_delivery' | 'delivering' | 'returning'
}

export function RiderStatusToggle({ riderId, currentStatus }: RiderStatusToggleProps) {
    const [isPending, startTransition] = useTransition()
    const [isOnline, setIsOnline] = useState(currentStatus !== 'offline')

    useEffect(() => {
        setIsOnline(currentStatus !== 'offline')
    }, [currentStatus])

    const handleToggle = (checked: boolean) => {
        if (currentStatus === 'on_delivery' || currentStatus === 'delivering' || currentStatus === 'returning') {
            toast.error('Cannot go offline right now')
            return
        }

        if (checked) {
            if (!navigator.geolocation) {
                toast.error('Location not supported by your browser')
                setIsOnline(false)
                return
            }

            setIsOnline(false)
            startTransition(async () => {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const result = await arrivedAtRestaurant(
                            riderId,
                            position.coords.latitude,
                            position.coords.longitude
                        )

                        if (result.error) {
                            if ('distance' in result) {
                                toast.error(`${result.error}. You are ${result.distance}m away.`)
                            } else {
                                toast.error(result.error)
                            }
                            setIsOnline(false)
                        } else {
                            toast.success('You are now online')
                            setIsOnline(true)
                        }
                    },
                    () => {
                        toast.error('Could not get your location. Please check permissions.')
                        setIsOnline(false)
                    },
                    { enableHighAccuracy: true, timeout: 10000 }
                )
            })
            return
        }

        setIsOnline(false)
        startTransition(async () => {
            const result = await toggleRiderStatus(riderId, 'offline')
            if (result.error) {
                toast.error(result.error)
                setIsOnline(true) // Revert
            } else {
                toast.success('You are now offline')
            }
        })
    }

    return (
        <div className="flex items-center gap-3">
            <Switch
                checked={isOnline}
                onCheckedChange={handleToggle}
                disabled={isPending || currentStatus === 'on_delivery' || currentStatus === 'delivering' || currentStatus === 'returning'}
            />
            <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-muted-foreground'}`}>
                {isPending ? 'Updating...' : isOnline ? 'Online' : 'Offline'}
            </span>
        </div>
    )
}
