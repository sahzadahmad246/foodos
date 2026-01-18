'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, Loader2, Store, CheckCircle2 } from 'lucide-react'
import { arrivedAtRestaurant } from '@/app/rider/actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface RiderReturnCardProps {
    riderId: string
    restaurant: {
        name: string
        latitude?: number | null
        longitude?: number | null
        address_line1?: string | null
    }
}

export function RiderReturnCard({ riderId, restaurant }: RiderReturnCardProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [isGettingLocation, setIsGettingLocation] = useState(false)

    const handleArrived = () => {
        if (!navigator.geolocation) {
            toast.error('Location not supported by your browser')
            return
        }

        setIsGettingLocation(true)

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                setIsGettingLocation(false)

                startTransition(async () => {
                    const result = await arrivedAtRestaurant(riderId, latitude, longitude)
                    if (result.error) {
                        if ('distance' in result) {
                            toast.error(`${result.error}. You are ${result.distance}m away.`)
                        } else {
                            toast.error(result.error)
                        }
                    } else {
                        toast.success('Welcome back! You are now online.')
                        router.refresh()
                    }
                })
            },
            (error) => {
                console.error('Geolocation error:', error)
                setIsGettingLocation(false)
                toast.error('Could not get your location. Please check permissions.')
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    const getDirectionsUrl = () => {
        if (restaurant.latitude && restaurant.longitude) {
            return `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`
        }
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address_line1 || restaurant.name)}`
    }

    return (
        <div className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <Store className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-lg text-blue-900 dark:text-blue-100">Return to Restaurant</p>
                    <p className="text-blue-700 dark:text-blue-300">
                        Detailed to: {restaurant.name}
                    </p>
                    <p className="text-sm text-blue-600/80 dark:text-blue-400/80 mt-1">
                        Please return to the restaurant to receive new orders.
                    </p>
                </div>
            </div>

            <div className="flex gap-3">
                <Button variant="outline" className="flex-1 bg-white dark:bg-gray-900" asChild>
                    <a href={getDirectionsUrl()} target="_blank" rel="noopener noreferrer">
                        <Navigation className="h-4 w-4 mr-2" />
                        Navigate
                    </a>
                </Button>
                <Button
                    onClick={handleArrived}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isPending || isGettingLocation}
                >
                    {isPending || isGettingLocation ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    I've Arrived
                </Button>
            </div>
        </div>
    )
}
