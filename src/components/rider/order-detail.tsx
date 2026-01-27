'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, MapPin, Phone, Package, Store,
    Navigation, CheckCircle2, Loader2, AlertCircle, MapPinOff,
    Banknote, CreditCard, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
    created_at?: string
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
    const [paymentCollected, setPaymentCollected] = useState(false)

    const isReady = order.status === 'ready'
    const isOnTheWay = order.status === 'out_for_delivery'
    const isCOD = order.payment_method === 'cod'

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
        if (order.customer_latitude && order.customer_longitude) {
            return `https://www.google.com/maps/dir/?api=1&destination=${order.customer_latitude},${order.customer_longitude}`
        }
        if (order.customer_address) {
            return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer_address)}`
        }
        return null
    }

    const restaurantAddress = order.restaurant
        ? [order.restaurant.address_line1, order.restaurant.city].filter(Boolean).join(', ')
        : null

    const canMarkDelivered = !isCOD || paymentCollected

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-white dark:bg-gray-900">
                <div className="max-w-lg mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/rider">
                            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                            </button>
                        </Link>
                        <div className="flex-1">
                            <h1 className="font-bold text-lg text-gray-900 dark:text-white">
                                {order.order_number}
                            </h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {order.customer_name}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
                {/* Simple Stepper */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
                    <div className="relative flex items-start justify-between">
                        {/* Connecting Line - absolute positioned to touch icons */}
                        <div className="absolute top-5 left-5 right-5 flex items-center" style={{ transform: 'translateY(-50%)' }}>
                            <div className="w-5" /> {/* Spacer for first icon */}
                            <div className={`flex-1 h-0.5 ${isOnTheWay ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                            <div className="w-5" /> {/* Spacer for second icon */}
                        </div>

                        {/* Step 1: Pickup */}
                        <div className="relative z-10 flex flex-col items-center gap-2">
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white dark:bg-gray-900 transition-all
                                ${!isReady
                                    ? 'border-green-500 text-green-500'
                                    : 'border-gray-300 dark:border-gray-600 text-gray-400'
                                }
                            `}>
                                {!isReady ? <Check className="h-5 w-5" /> : <span className="font-semibold text-sm">1</span>}
                            </div>
                            <span className={`text-sm font-medium ${!isReady ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                                Pickup
                            </span>
                        </div>

                        {/* Step 2: Deliver */}
                        <div className="relative z-10 flex flex-col items-center gap-2">
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white dark:bg-gray-900 transition-all
                                ${isOnTheWay
                                    ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                                    : 'border-gray-300 dark:border-gray-600 text-gray-400'
                                }
                            `}>
                                <span className="font-semibold text-sm">2</span>
                            </div>
                            <span className={`text-sm font-medium ${isOnTheWay ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                                Deliver
                            </span>
                        </div>
                    </div>
                </div>

                {/* Restaurant Pickup Card */}
                {isReady && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Store className="h-4 w-4 text-gray-500" />
                                <span className="font-medium text-sm text-gray-900 dark:text-white">Pickup Location</span>
                            </div>
                            {order.restaurant?.phone && (
                                <a
                                    href={`tel:${order.restaurant.phone}`}
                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <Phone className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                                </a>
                            )}
                        </div>
                        <div className="p-4">
                            <p className="font-semibold text-gray-900 dark:text-white">
                                {order.restaurant?.name}
                            </p>
                            {restaurantAddress && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {restaurantAddress}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Delivery Destination Card */}
                {order.customer_address && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-sm text-gray-900 dark:text-white">Delivery Address</span>
                        </div>
                        <div className="p-4">
                            <p className="font-semibold text-gray-900 dark:text-white">
                                {order.customer_name}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                {order.customer_address}
                            </p>

                            <div className="flex gap-3 mt-4">
                                {order.customer_phone && (
                                    <Button variant="outline" asChild className="flex-1 h-10 rounded-xl text-sm">
                                        <a href={`tel:${order.customer_phone}`}>
                                            <Phone className="h-4 w-4 mr-2" />
                                            Call
                                        </a>
                                    </Button>
                                )}
                                {getDirectionsUrl() && (
                                    <Button variant="outline" asChild className="flex-1 h-10 rounded-xl text-sm">
                                        <a href={getDirectionsUrl()!} target="_blank" rel="noopener noreferrer">
                                            <Navigation className="h-4 w-4 mr-2" />
                                            Navigate
                                        </a>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment Section */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                        {isCOD ? <Banknote className="h-4 w-4 text-gray-500" /> : <CreditCard className="h-4 w-4 text-gray-500" />}
                        <span className="font-medium text-sm text-gray-900 dark:text-white">Payment</span>
                    </div>
                    <div className="p-4">
                        {isCOD ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">Cash on Delivery</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Collect from customer</p>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        ₹{order.total_amount}
                                    </p>
                                </div>

                                {isOnTheWay && (
                                    <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <Checkbox
                                            id="payment-collected"
                                            checked={paymentCollected}
                                            onCheckedChange={(checked) => setPaymentCollected(checked === true)}
                                            className="h-5 w-5"
                                        />
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            I have collected ₹{order.total_amount}
                                        </span>
                                    </label>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Paid Online</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">No collection needed</p>
                                </div>
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Order Items */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                        <Package className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-sm text-gray-900 dark:text-white">Order Items</span>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {order.order_items.map((item) => (
                            <div key={item.id} className="px-4 py-3 flex justify-between items-start">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {item.quantity} × ₹{item.price}
                                    </p>
                                </div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    ₹{item.price * item.quantity}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Total</span>
                        <span className="font-bold text-gray-900 dark:text-white">₹{order.total_amount}</span>
                    </div>
                </div>

                {/* Notes */}
                {order.notes && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-sm text-gray-900 dark:text-white">Customer Note</span>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-gray-700 dark:text-gray-300">{order.notes}</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Bottom Button */}
            {isReady && (
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 z-50">
                    <div className="max-w-lg mx-auto">
                        <Button
                            onClick={handlePickup}
                            disabled={isPending}
                            size="lg"
                            className="w-full h-12 rounded-xl font-semibold"
                        >
                            {isPending ? (
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            ) : (
                                <Package className="h-5 w-5 mr-2" />
                            )}
                            Confirm Pickup
                        </Button>
                    </div>
                </div>
            )}

            {isOnTheWay && (
                <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 p-4 z-50">
                    <div className="max-w-lg mx-auto">
                        <Button
                            onClick={openDeliverDialog}
                            disabled={isPending || !canMarkDelivered}
                            size="lg"
                            className={`w-full h-12 rounded-xl font-semibold ${canMarkDelivered
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                                }`}
                        >
                            {!canMarkDelivered ? (
                                'Collect payment to continue'
                            ) : (
                                <>
                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                    Mark as Delivered
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Delivery Confirmation Dialog */}
            <AlertDialog open={showDeliverDialog} onOpenChange={setShowDeliverDialog}>
                <AlertDialogContent className="rounded-2xl mx-4">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Delivery</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p className="text-gray-600 dark:text-gray-400">
                                    Confirm delivery of <span className="font-medium text-gray-900 dark:text-white">{order.order_number}</span> to <span className="font-medium text-gray-900 dark:text-white">{order.customer_name}</span>?
                                </p>

                                {isGettingLocation && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Getting location...
                                    </div>
                                )}

                                {locationError && (
                                    <div className="flex items-center gap-2 text-sm text-amber-600">
                                        <MapPinOff className="h-4 w-4" />
                                        {locationError}
                                    </div>
                                )}

                                {riderLocation && !locationError && (
                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                        <MapPin className="h-4 w-4" />
                                        Location verified
                                    </div>
                                )}

                                {isCOD && (
                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                        <CheckCircle2 className="h-4 w-4" />
                                        ₹{order.total_amount} collected
                                    </div>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel disabled={isPending} className="rounded-xl">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeliver}
                            disabled={isPending || isGettingLocation}
                            className="rounded-xl bg-green-600 hover:bg-green-700"
                        >
                            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Confirm
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
