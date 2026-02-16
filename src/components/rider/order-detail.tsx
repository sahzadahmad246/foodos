'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft, MapPin, Phone, Package, Store,
    Navigation, CheckCircle2, Loader2, AlertCircle, MapPinOff,
    Banknote, CreditCard, Check, XCircle, RotateCcw
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
import { pickupOrder, deliverOrder, confirmReturnOtp } from '@/app/rider/actions'
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
    ready_at?: string | null
    picked_up_at?: string | null
    delivered_at?: string | null
    order_items: OrderItem[]
    restaurant?: {
        name: string
        phone: string | null
        address_line1: string | null
        city: string | null
    }
    cancellation_reason?: string | null
    return_otp?: string | null
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
    const [returnOtp, setReturnOtp] = useState('')
    const [returnError, setReturnError] = useState('')
    const [isVerifyingReturn, setIsVerifyingReturn] = useState(false)
    const [isOtpFocused, setIsOtpFocused] = useState(false)

    const isReady = order.status === 'ready'
    const isOnTheWay = order.status === 'out_for_delivery'
    const isDelivered = order.status === 'delivered'
    const isCancelled = order.status === 'cancelled'
    const isCOD = order.payment_method === 'cod'
    const requiresLocationCheck = !!order.customer_latitude && !!order.customer_longitude

    const calculateDistanceMeters = (
        lat1: number,
        lng1: number,
        lat2: number,
        lng2: number
    ) => {
        const R = 6371000
        const toRad = (deg: number) => deg * (Math.PI / 180)
        const dLat = toRad(lat2 - lat1)
        const dLng = toRad(lng2 - lng1)
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    const riderDistanceMeters =
        requiresLocationCheck && riderLocation
            ? calculateDistanceMeters(
                riderLocation.lat,
                riderLocation.lng,
                order.customer_latitude as number,
                order.customer_longitude as number
            )
            : null

    const isLocationVerified = !requiresLocationCheck || (
        riderLocation &&
        !locationError &&
        riderDistanceMeters !== null &&
        riderDistanceMeters <= 200
    )

    const getRiderLocation = () => {
        if (!navigator.geolocation) {
            setLocationError('Location not supported by your browser')
            setRiderLocation(null)
            return
        }

        setIsGettingLocation(true)
        setLocationError(null)
        setRiderLocation(null)

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
                if (error.code === error.PERMISSION_DENIED) {
                    setLocationError('Location is blocked. Enable it in your browser settings, then tap Retry.')
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    setLocationError('Location unavailable. Please try again.')
                } else if (error.code === error.TIMEOUT) {
                    setLocationError('Location request timed out. Please try again.')
                } else {
                    setLocationError('Could not get your location. Please enable location access.')
                }
                setRiderLocation(null)
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
                if ('hasMorePickups' in result && result.hasMorePickups) {
                    const count = 'pendingPickupCount' in result ? result.pendingPickupCount : 0
                    toast.success(
                        count > 0
                            ? `${count} more order${count > 1 ? 's' : ''} waiting pickup.`
                            : 'More assigned orders are waiting pickup.'
                    )
                } else {
                    toast.success('Order picked up! Choose any order to proceed with delivery.')
                }
                router.replace('/rider')
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

    const handleConfirmReturn = async () => {
        if (returnOtp.length !== 6) {
            setReturnError('Please enter a valid 6-digit OTP')
            return
        }

        setReturnError('')
        setIsVerifyingReturn(true)

        const result = await confirmReturnOtp(order.id, riderId, returnOtp)

        setIsVerifyingReturn(false)

        if (result.error) {
            setReturnError(result.error)
            toast.error(result.error)
        } else {
            toast.success('Return confirmed! You are now available for new orders.')
            router.push('/rider')
        }
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
    const canConfirmDelivery = canMarkDelivered && isLocationVerified && !isGettingLocation

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-white dark:bg-gray-900">
                <div className="max-w-lg mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/rider/orders">
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
                    {isCancelled ? (
                        /* Cancelled Order Stepper */
                        <div className="relative flex items-start justify-between">
                            {/* Connecting Line */}
                            <div className="absolute top-5 left-5 right-5 flex items-center" style={{ transform: 'translateY(-50%)' }}>
                                <div className="w-5" />
                                <div className="flex-1 h-0.5 bg-red-500" />
                                <div className="w-5" />
                            </div>

                            {/* Step 1: Picked Up */}
                            <div className="relative z-10 flex flex-col items-center gap-1">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white dark:bg-gray-900 border-green-500 text-green-500">
                                    <Check className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                    Picked Up
                                </span>
                            </div>

                            {/* Step 2: Cancelled */}
                            <div className="relative z-10 flex flex-col items-center gap-1">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 bg-red-500 border-red-500 text-white ring-4 ring-red-100 dark:ring-red-900/30">
                                    <XCircle className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                    Cancelled
                                </span>
                            </div>
                        </div>
                    ) : (
                        /* Normal Order Stepper */
                        <div className="relative flex items-start justify-between">
                            {/* Connecting Line - absolute positioned to touch icons */}
                            <div className="absolute top-5 left-5 right-5 flex items-center" style={{ transform: 'translateY(-50%)' }}>
                                <div className="w-5" /> {/* Spacer for first icon */}
                                {/* Line is green if Pickup is completed (meaning we are at least out_for_delivery) */}
                                <div className={`flex-1 h-0.5 ${['out_for_delivery', 'delivered'].includes(order.status) ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                                <div className="w-5" /> {/* Spacer for second icon */}
                            </div>

                            {/* Step 1: Pickup */}
                            <div className="relative z-10 flex flex-col items-center gap-1">
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white dark:bg-gray-900 transition-all
                                    ${['out_for_delivery', 'delivered'].includes(order.status)
                                        ? 'border-green-500 text-green-500' // Completed
                                        : isReady
                                            ? 'border-green-500 text-green-500 ring-4 ring-green-100 dark:ring-green-900/30' // Current
                                            : 'border-gray-300 dark:border-gray-600 text-gray-400' // Pending
                                    }
                                `}>
                                    {['out_for_delivery', 'delivered'].includes(order.status) ? (
                                        <Check className="h-5 w-5" />
                                    ) : (
                                        <span className="font-semibold text-sm">1</span>
                                    )}
                                </div>
                                <span className={`text-sm font-medium ${['out_for_delivery', 'delivered'].includes(order.status) || isReady
                                    ? 'text-green-600 dark:text-green-400'
                                    : 'text-gray-500'
                                    }`}>
                                    Pickup
                                </span>
                                {order.picked_up_at && (
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(order.picked_up_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>

                            {/* Step 2: Deliver */}
                            <div className="relative z-10 flex flex-col items-center gap-1">
                                <div className={`
                                    w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white dark:bg-gray-900 transition-all
                                    ${order.status === 'delivered'
                                        ? 'border-green-500 text-green-500' // Completed
                                        : isOnTheWay
                                            ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white ring-4 ring-gray-100 dark:ring-gray-800' // Current
                                            : 'border-gray-300 dark:border-gray-600 text-gray-400' // Pending
                                    }
                                `}>
                                    {order.status === 'delivered' ? (
                                        <Check className="h-5 w-5" />
                                    ) : (
                                        <span className="font-semibold text-sm">2</span>
                                    )}
                                </div>
                                <span className={`text-sm font-medium ${order.status === 'delivered'
                                    ? 'text-green-600 dark:text-green-400'
                                    : isOnTheWay
                                        ? 'text-gray-900 dark:text-white'
                                        : 'text-gray-500'
                                    }`}>
                                    Deliver
                                </span>
                                {order.delivered_at && (
                                    <span className="text-[10px] text-gray-400">
                                        {new Date(order.delivered_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Cancelled Order Alert */}
                {isCancelled && (
                    <div className="bg-red-50 dark:bg-red-950/30 rounded-2xl p-5 border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-red-700 dark:text-red-300">Order Cancelled</h3>
                                {order.cancellation_reason && (
                                    <p className="text-sm text-red-600 dark:text-red-400">{order.cancellation_reason}</p>
                                )}
                            </div>
                        </div>

                        {/* Return Instructions with OTP Input */}
                        <div className="mt-4">
                            <div className="mb-2 flex items-center gap-2">
                                <RotateCcw className="h-4 w-4 text-amber-600" />
                                <span className="font-semibold text-amber-800 dark:text-amber-300">Return Required</span>
                            </div>
                            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                                Return the order to {order.restaurant?.name || 'the restaurant'} and enter the OTP they give you:
                            </p>

                            <div className="space-y-3">
                                <div className="relative">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={returnOtp}
                                        onFocus={() => setIsOtpFocused(true)}
                                        onBlur={() => setIsOtpFocused(false)}
                                        onChange={(e) => {
                                            setReturnOtp(e.target.value.replace(/\D/g, ''))
                                            setReturnError('')
                                        }}
                                        className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
                                        aria-label="Enter 6-digit return OTP"
                                    />
                                    <div className="grid grid-cols-6 gap-2">
                                        {Array.from({ length: 6 }).map((_, index) => (
                                            (() => {
                                                const isActiveSlot = isOtpFocused && index === Math.min(returnOtp.length, 5)
                                                const hasDigit = Boolean(returnOtp[index])
                                                return (
                                                    <div
                                                        key={index}
                                                        className={`relative flex h-12 items-center justify-center rounded-lg border bg-white text-lg font-semibold shadow-sm transition-all dark:bg-gray-950 ${
                                                            isActiveSlot
                                                                ? 'border-amber-500 ring-2 ring-amber-200 dark:border-amber-500 dark:ring-amber-900/60'
                                                                : 'border-amber-300 dark:border-amber-700'
                                                        } ${hasDigit ? 'text-amber-900 dark:text-amber-200' : 'text-amber-300 dark:text-amber-700'}`}
                                                    >
                                                        {hasDigit ? returnOtp[index] : ''}
                                                        {isActiveSlot && !hasDigit && (
                                                            <span className="absolute h-5 w-0.5 animate-pulse bg-amber-600 dark:bg-amber-300" />
                                                        )}
                                                    </div>
                                                )
                                            })()
                                        ))}
                                    </div>
                                </div>
                                <p className="text-center text-xs text-amber-700/80 dark:text-amber-300/80">
                                    Enter 6-digit OTP
                                </p>

                                {returnError && (
                                    <p className="text-sm text-red-500 text-center">{returnError}</p>
                                )}

                                <Button
                                    onClick={handleConfirmReturn}
                                    disabled={isVerifyingReturn || returnOtp.length !== 6}
                                    className="w-full bg-amber-600 hover:bg-amber-700"
                                >
                                    {isVerifyingReturn ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Confirm Return
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
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
                {(order.customer_address || isDelivered) && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-sm text-gray-900 dark:text-white">
                                {isDelivered ? 'Customer' : 'Delivery Address'}
                            </span>
                        </div>
                        <div className="p-4">
                            <p className="font-semibold text-gray-900 dark:text-white">
                                {order.customer_name}
                            </p>
                            {!isDelivered && (
                                <>
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
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Payment Section - hide for cancelled orders */}
                {!isCancelled && (
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
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {isDelivered ? 'Cash collected from customer' : 'Collect from customer'}
                                            </p>
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
                )}

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

                                {locationError && !isGettingLocation && (
                                    <div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={getRiderLocation}
                                            className="rounded-lg"
                                        >
                                            Retry location
                                        </Button>
                                    </div>
                                )}

                                {requiresLocationCheck && isLocationVerified && (
                                    <div className="flex items-center gap-2 text-sm text-green-600">
                                        <MapPin className="h-4 w-4" />
                                        Location verified
                                    </div>
                                )}

                                {requiresLocationCheck && riderLocation && !locationError && riderDistanceMeters !== null && riderDistanceMeters > 200 && (
                                    <div className="flex items-center gap-2 text-sm text-amber-600">
                                        <MapPinOff className="h-4 w-4" />
                                        Too far from customer ({Math.round(riderDistanceMeters)}m away)
                                    </div>
                                )}

                                {!requiresLocationCheck && (
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <MapPin className="h-4 w-4" />
                                        Location not required for this order
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
                            disabled={isPending || !canConfirmDelivery}
                            className={`rounded-xl ${canConfirmDelivery
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                                }`}
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
