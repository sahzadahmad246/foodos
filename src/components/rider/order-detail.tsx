'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, MapPin, Phone, Package, Store,
    Navigation, CheckCircle2, Loader2, AlertCircle, MapPinOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { pickupOrder, deliverOrder } from '@/app/rider/actions'
import { toast } from 'sonner'

interface OrderItem {
    id: string
    name: string
    quantity: number
    price: number
}

interface Order {
    id: string
    order_number: string
    customer_name: string
    customer_phone: string | null
    customer_address: string | null
    customer_latitude?: number | null
    customer_longitude?: number | null
    total_amount: number
    payment_method: string
    status: string
    notes: string | null
    order_items: OrderItem[]
    restaurant?: {
        name: string
        phone: string | null
        address_line1: string | null
        city: string | null
    }
}

interface RiderOrderDetailProps {
    order: Order
    riderId: string
}

export function RiderOrderDetail({ order, riderId }: RiderOrderDetailProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [showDeliverDialog, setShowDeliverDialog] = useState(false)
    const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [locationError, setLocationError] = useState<string | null>(null)
    const [isGettingLocation, setIsGettingLocation] = useState(false)

    // Get rider location when dialog opens
    const getRiderLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Location not supported by your browser')
            return
        }

        setIsGettingLocation(true)
        setLocationError(null)

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setRiderLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                })
                setIsGettingLocation(false)
            },
            (error) => {
                console.error('Geolocation error:', error)
                setLocationError('Could not get your location. Please enable location access.')
                setIsGettingLocation(false)
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    const handlePickup = () => {
        startTransition(async () => {
            const result = await pickupOrder(order.id, riderId)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Order picked up! Navigate to customer.')
                router.refresh()
            }
        })
    }

    const openDeliverDialog = () => {
        setShowDeliverDialog(true)
        getRiderLocation()
    }

    const handleDeliver = () => {
        startTransition(async () => {
            const result = await deliverOrder(
                order.id,
                riderId,
                riderLocation?.lat,
                riderLocation?.lng
            )
            if (result.error) {
                if ('distance' in result) {
                    toast.error(`${result.error}. You are ${result.distance}m away.`)
                } else {
                    toast.error(result.error)
                }
            } else {
                toast.success('Order delivered successfully!')
                setShowDeliverDialog(false)
                router.push('/rider')
            }
        })
    }

    const getDirectionsUrl = () => {
        // Prefer coordinates if available
        if (order.customer_latitude && order.customer_longitude) {
            return `https://www.google.com/maps/dir/?api=1&destination=${order.customer_latitude},${order.customer_longitude}`
        }
        // Fallback to text search
        if (order.customer_address) {
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer_address)}`
        }
        return null
    }

    const restaurantAddress = order.restaurant
        ? [order.restaurant.address_line1, order.restaurant.city].filter(Boolean).join(', ')
        : null

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/rider">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div className="flex-1">
                            <h1 className="font-bold text-lg">{order.order_number}</h1>
                            <p className="text-sm text-muted-foreground">
                                {order.customer_name}
                            </p>
                        </div>
                        <Badge variant={order.status === 'out_for_delivery' ? 'default' : 'secondary'}>
                            {order.status === 'out_for_delivery' ? 'Delivering' : 'Ready'}
                        </Badge>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Status Steps */}
                <div className="flex items-center justify-between text-sm">
                    <div className={`flex flex-col items-center ${order.status !== 'ready' ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${order.status !== 'ready' ? 'bg-green-100' : 'bg-muted'}`}>
                            <Store className="h-5 w-5" />
                        </div>
                        <span>Pickup</span>
                    </div>
                    <div className={`flex-1 h-1 mx-2 rounded ${order.status === 'out_for_delivery' ? 'bg-green-500' : 'bg-muted'}`} />
                    <div className={`flex flex-col items-center ${order.status === 'delivered' ? 'text-green-600' : 'text-muted-foreground'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${order.status === 'delivered' ? 'bg-green-100' : 'bg-muted'}`}>
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <span>Delivered</span>
                    </div>
                </div>

                {/* Restaurant Pickup */}
                {order.status === 'ready' && (
                    <div className="p-5 rounded-2xl border-2 border-primary/20 bg-primary/5">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                                <Store className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-lg">Pick up from</p>
                                <p className="text-muted-foreground">{order.restaurant?.name}</p>
                                {restaurantAddress && (
                                    <p className="text-sm text-muted-foreground mt-1">{restaurantAddress}</p>
                                )}
                            </div>
                        </div>
                        {order.restaurant?.phone && (
                            <Button variant="outline" asChild className="w-full mb-3">
                                <a href={`tel:${order.restaurant.phone}`}>
                                    <Phone className="h-4 w-4 mr-2" />
                                    Call Restaurant
                                </a>
                            </Button>
                        )}
                        <Button onClick={handlePickup} className="w-full" disabled={isPending}>
                            {isPending ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Package className="h-4 w-4 mr-2" />
                            )}
                            Confirm Pickup
                        </Button>
                    </div>
                )}

                {/* Delivery Destination */}
                {order.customer_address && (
                    <div className={`p-5 rounded-2xl border ${order.status === 'out_for_delivery' ? 'border-2 border-primary/20 bg-primary/5' : 'bg-card'}`}>
                        <div className="flex items-start gap-4 mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${order.status === 'out_for_delivery' ? 'bg-primary/20' : 'bg-muted'}`}>
                                <MapPin className={`h-6 w-6 ${order.status === 'out_for_delivery' ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-lg">Deliver to</p>
                                <p className="font-medium">{order.customer_name}</p>
                                <p className="text-sm text-muted-foreground mt-1">{order.customer_address}</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            {order.customer_phone && (
                                <Button variant="outline" asChild className="flex-1">
                                    <a href={`tel:${order.customer_phone}`}>
                                        <Phone className="h-4 w-4 mr-2" />
                                        Call
                                    </a>
                                </Button>
                            )}
                            {getDirectionsUrl() && (
                                <Button variant="outline" asChild className="flex-1">
                                    <a href={getDirectionsUrl()!} target="_blank" rel="noopener noreferrer">
                                        <Navigation className="h-4 w-4 mr-2" />
                                        Navigate
                                    </a>
                                </Button>
                            )}
                        </div>

                        {order.status === 'out_for_delivery' && (
                            <Button
                                onClick={openDeliverDialog}
                                className="w-full mt-4 bg-green-600 hover:bg-green-700"
                                disabled={isPending}
                            >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Mark as Delivered
                            </Button>
                        )}
                    </div>
                )}

                {/* Order Items */}
                <div className="rounded-2xl border bg-card overflow-hidden">
                    <div className="px-5 py-4 bg-muted/50 border-b">
                        <h3 className="font-semibold">Order Items</h3>
                    </div>
                    <div className="divide-y">
                        {order.order_items.map((item) => (
                            <div key={item.id} className="px-5 py-3 flex justify-between">
                                <div>
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                </div>
                                <p className="font-medium">₹{item.price * item.quantity}</p>
                            </div>
                        ))}
                    </div>
                    <div className="px-5 py-4 bg-muted/50 border-t flex justify-between items-center">
                        <span className="font-semibold">Total</span>
                        <span className="font-bold text-xl">₹{order.total_amount}</span>
                    </div>
                    {order.payment_method === 'cod' && (
                        <div className="px-5 py-3 bg-amber-50 text-amber-800 text-sm flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            Collect ₹{order.total_amount} cash on delivery
                        </div>
                    )}
                </div>

                {/* Notes */}
                {order.notes && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                        <p className="text-sm"><strong>Note:</strong> {order.notes}</p>
                    </div>
                )}
            </div>

            {/* Delivery Confirmation Dialog */}
            <AlertDialog open={showDeliverDialog} onOpenChange={setShowDeliverDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Delivery</AlertDialogTitle>
                        <AlertDialogDescription className="space-y-3">
                            <span className="block">
                                Are you sure you have delivered order {order.order_number} to {order.customer_name}?
                            </span>

                            {isGettingLocation && (
                                <span className="flex items-center gap-2 text-blue-600">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Getting your location...
                                </span>
                            )}

                            {locationError && (
                                <span className="flex items-center gap-2 text-amber-600">
                                    <MapPinOff className="h-4 w-4" />
                                    {locationError}
                                </span>
                            )}

                            {riderLocation && !locationError && (
                                <span className="flex items-center gap-2 text-green-600">
                                    <MapPin className="h-4 w-4" />
                                    Location verified
                                </span>
                            )}

                            {order.payment_method === 'cod' && (
                                <span className="block font-medium text-amber-600">
                                    Make sure you've collected ₹{order.total_amount} cash.
                                </span>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeliver}
                            disabled={isPending || isGettingLocation}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Confirm Delivery
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
