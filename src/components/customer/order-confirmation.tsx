'use client'

import { useEffect, useState } from 'react'
import {
    CheckCircle2, MapPin, Phone, Package,
    ChefHat, Truck, PartyPopper, Store, XCircle, ArrowLeft,
    Banknote, CreditCard, Bike, User, Clock, Loader2, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface OrderItem {
    id: string
    name: string
    price: number
    quantity: number
}

interface Restaurant {
    id: string
    name: string
    logo_url?: string
    latitude?: number | null
    longitude?: number | null
    address_line1?: string | null
    address_line2?: string | null
    city?: string | null
    state?: string | null
    pincode?: string | null
}

interface Rider {
    id: string
    name: string
    phone: string
    status: string
}

interface Order {
    id: string
    order_number: string
    customer_name: string
    customer_phone: string | null
    customer_address: string | null
    items_total: number
    delivery_fee: number
    tax_amount: number
    total_amount: number
    payment_method: string
    status: string
    notes: string | null
    created_at: string
    rider_id?: string | null
    order_items: OrderItem[]
    restaurant?: Restaurant | null
    rider?: Rider | null
}

interface OrderConfirmationProps {
    order: Order
}

const DELIVERY_STEPS = [
    { key: 'pending', label: 'Placed', icon: Package },
    { key: 'preparing', label: 'Preparing', icon: ChefHat },
    { key: 'ready', label: 'Ready', icon: PartyPopper },
    { key: 'out_for_delivery', label: 'On the way', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
]

const PICKUP_STEPS = [
    { key: 'pending', label: 'Placed', icon: Package },
    { key: 'preparing', label: 'Preparing', icon: ChefHat },
    { key: 'ready', label: 'Ready', icon: PartyPopper },
    { key: 'delivered', label: 'Picked Up', icon: CheckCircle2 },
]

export default function OrderConfirmation({ order: initialOrder }: OrderConfirmationProps) {
    const [order, setOrder] = useState(initialOrder)
    const [isLoadingRider, setIsLoadingRider] = useState(false)
    const supabase = createClient()

    const isPickup = !order.customer_address
    const STATUS_STEPS = isPickup ? PICKUP_STEPS : DELIVERY_STEPS
    const restaurant = order.restaurant

    const restaurantAddress = restaurant ? [
        restaurant.address_line1,
        restaurant.address_line2,
        restaurant.city,
        restaurant.state,
        restaurant.pincode
    ].filter(Boolean).join(', ') : null

    // Fetch rider info if we have rider_id but no rider object
    useEffect(() => {
        const fetchRider = async () => {
            if (order.rider_id && !order.rider) {
                setIsLoadingRider(true)
                const { data: riderData } = await supabase
                    .from('riders')
                    .select('id, name, phone, status')
                    .eq('id', order.rider_id)
                    .single()

                if (riderData) {
                    setOrder(prev => ({ ...prev, rider: riderData }))
                }
                setIsLoadingRider(false)
            }
        }
        fetchRider()
    }, [order.rider_id, order.rider, supabase])

    // Realtime subscription for order updates
    useEffect(() => {
        const channel = supabase
            .channel(`order-tracking-${order.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${order.id}`,
                },
                async (payload) => {
                    const newOrder = payload.new as any

                    if (newOrder.rider_id) {
                        const { data: riderData } = await supabase
                            .from('riders')
                            .select('id, name, phone, status')
                            .eq('id', newOrder.rider_id)
                            .single()

                        setOrder((prev) => ({
                            ...prev,
                            ...newOrder,
                            rider: riderData || prev.rider
                        }))
                    } else {
                        setOrder((prev) => ({ ...prev, ...newOrder }))
                    }
                }
            )
            .subscribe()

        let riderChannel: any = null
        if (order.rider_id) {
            riderChannel = supabase
                .channel(`rider-status-${order.rider_id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'riders',
                        filter: `id=eq.${order.rider_id}`,
                    },
                    (payload) => {
                        const updatedRider = payload.new as Rider
                        setOrder(prev => ({
                            ...prev,
                            rider: updatedRider
                        }))
                    }
                )
                .subscribe()
        }

        return () => {
            supabase.removeChannel(channel)
            if (riderChannel) {
                supabase.removeChannel(riderChannel)
            }
        }
    }, [order.id, order.rider_id, supabase])

    const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order.status)
    const isCancelled = order.status === 'cancelled'
    const isComplete = order.status === 'delivered'

    const getStatusMessage = () => {
        switch (order.status) {
            case 'pending': return 'Order Placed'
            case 'preparing': return 'Being Prepared'
            case 'ready': return isPickup ? 'Ready for Pickup!' : 'Ready for Delivery'
            case 'out_for_delivery': return 'On the Way!'
            case 'delivered': return isPickup ? 'Order Picked Up!' : 'Order Delivered!'
            case 'cancelled': return 'Order Cancelled'
            default: return 'Processing'
        }
    }

    const getStatusDescription = () => {
        switch (order.status) {
            case 'pending': return 'Restaurant is confirming your order'
            case 'preparing': return 'Your food is being prepared'
            case 'ready': return isPickup ? 'Head to the restaurant to pick up' : 'Your order is ready for delivery'
            case 'out_for_delivery': return order.rider ? `${order.rider.name} is bringing your order` : 'Delivery partner is on the way'
            case 'delivered': return 'Thank you for your order!'
            case 'cancelled': return 'This order has been cancelled'
            default: return ''
        }
    }

    const getRiderStatusMessage = () => {
        if (!order.rider) return ''
        switch (order.status) {
            case 'preparing':
            case 'ready':
                return 'Waiting to pick up your order'
            case 'out_for_delivery':
                return 'On the way to you'
            default:
                return ''
        }
    }

    const CurrentIcon = currentStepIndex >= 0 ? STATUS_STEPS[currentStepIndex]?.icon : Package

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-white dark:bg-gray-900">
                <div className="max-w-lg mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                            </button>
                        </Link>
                        <div className="flex-1 min-w-0">
                            <h1 className="font-bold text-lg text-gray-900 dark:text-white">
                                Order #{order.order_number}
                            </h1>
                            {restaurant && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {restaurant.name}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-lg mx-auto px-4 py-5 space-y-4">
                {/* Status Card */}
                <div className={`
                    bg-white dark:bg-gray-900 rounded-2xl p-6 border text-center
                    ${isCancelled
                        ? 'border-red-200 dark:border-red-800'
                        : isComplete
                            ? 'border-green-200 dark:border-green-800'
                            : 'border-gray-200 dark:border-gray-800'
                    }
                `}>
                    <div className="mb-4">
                        {isCancelled ? (
                            <XCircle className="h-12 w-12 mx-auto text-red-500" />
                        ) : isComplete ? (
                            <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                        ) : (
                            <div className="relative inline-flex">
                                <div className="w-12 h-12 rounded-full border-2 border-gray-900 dark:border-white flex items-center justify-center">
                                    <CurrentIcon className="h-6 w-6 text-gray-900 dark:text-white" />
                                </div>
                            </div>
                        )}
                    </div>

                    <h2 className={`text-xl font-bold mb-1 ${isCancelled ? 'text-red-600 dark:text-red-400'
                            : isComplete ? 'text-green-600 dark:text-green-400'
                                : 'text-gray-900 dark:text-white'
                        }`}>
                        {getStatusMessage()}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{getStatusDescription()}</p>

                    <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-400">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(order.created_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                        })}
                    </div>
                </div>

                {/* Rider Info Card */}
                {!isPickup && !isCancelled && !isComplete && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                            <Bike className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-sm text-gray-900 dark:text-white">Delivery Partner</span>
                        </div>
                        <div className="p-4">
                            {isLoadingRider ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                                    <span className="text-sm text-gray-500">Loading...</span>
                                </div>
                            ) : order.rider ? (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{order.rider.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{getRiderStatusMessage()}</p>
                                    </div>
                                    {order.rider.phone && (
                                        <Button variant="outline" size="sm" asChild className="rounded-xl">
                                            <a href={`tel:${order.rider.phone}`}>
                                                <Phone className="h-4 w-4 mr-2" />
                                                Call
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                        <User className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">Finding a delivery partner</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Please wait...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Animated loading bar when searching */}
                        {!order.rider && !isLoadingRider && (
                            <div className="h-1 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                <div className="h-full w-1/3 bg-gray-900 dark:bg-white animate-[shimmer_1.5s_ease-in-out_infinite]"
                                    style={{
                                        animation: 'shimmer 1.5s ease-in-out infinite'
                                    }}
                                />
                            </div>
                        )}
                        <style jsx>{`
                            @keyframes shimmer {
                                0% { transform: translateX(-100%); }
                                100% { transform: translateX(400%); }
                            }
                        `}</style>
                    </div>
                )}

                {/* Progress Stepper - No box wrapper */}
                {!isCancelled && (
                    <div className="py-4">
                        <div className="flex items-start">
                            {STATUS_STEPS.map((step, index) => {
                                const isPast = index <= currentStepIndex
                                const isCurrent = index === currentStepIndex
                                const Icon = step.icon

                                return (
                                    <div key={step.key} className="flex-1 flex flex-col items-center relative">
                                        {/* Connector line - before the circle */}
                                        {index > 0 && (
                                            <div
                                                className={`absolute top-4 right-1/2 h-0.5 w-full ${isPast ? 'bg-gray-900 dark:bg-white' : 'bg-gray-200 dark:bg-gray-700'
                                                    }`}
                                            />
                                        )}

                                        <div className={`
                                            relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white dark:bg-gray-950
                                            ${isPast
                                                ? 'border-gray-900 dark:border-white'
                                                : 'border-gray-300 dark:border-gray-600'
                                            }
                                        `}>
                                            {isPast && index < currentStepIndex ? (
                                                <Check className="h-4 w-4 text-gray-900 dark:text-white" />
                                            ) : (
                                                <Icon className={`h-4 w-4 ${isPast ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`} />
                                            )}
                                        </div>
                                        <span className={`
                                            text-xs text-center mt-2 leading-tight
                                            ${isPast ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-400'}
                                        `}>
                                            {step.label}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Pickup/Delivery Address */}
                {isPickup && restaurant ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                            <Store className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-sm text-gray-900 dark:text-white">Pickup Location</span>
                        </div>
                        <div className="p-4">
                            <p className="font-semibold text-gray-900 dark:text-white">{restaurant.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{restaurantAddress}</p>
                        </div>
                    </div>
                ) : order.customer_address && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-sm text-gray-900 dark:text-white">Delivery Address</span>
                        </div>
                        <div className="p-4">
                            <p className="font-semibold text-gray-900 dark:text-white">{order.customer_name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{order.customer_address}</p>
                            {order.customer_phone && (
                                <a
                                    href={`tel:${order.customer_phone}`}
                                    className="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 mt-2 hover:text-gray-900 dark:hover:text-white"
                                >
                                    <Phone className="h-3.5 w-3.5" />
                                    {order.customer_phone}
                                </a>
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
                                    ₹{(item.price * item.quantity).toFixed(0)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bill Summary */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                        {order.payment_method === 'cod' ? (
                            <Banknote className="h-4 w-4 text-gray-500" />
                        ) : (
                            <CreditCard className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="font-medium text-sm text-gray-900 dark:text-white">Payment</span>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                            <span className="text-gray-900 dark:text-white">₹{order.items_total.toFixed(0)}</span>
                        </div>
                        {order.delivery_fee > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Delivery Fee</span>
                                <span className="text-gray-900 dark:text-white">₹{order.delivery_fee.toFixed(0)}</span>
                            </div>
                        )}
                        {order.tax_amount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Tax</span>
                                <span className="text-gray-900 dark:text-white">₹{order.tax_amount.toFixed(0)}</span>
                            </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                            <span className="font-medium text-gray-900 dark:text-white">Total</span>
                            <span className="font-bold text-gray-900 dark:text-white">₹{order.total_amount.toFixed(0)}</span>
                        </div>

                        <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-800">
                            {order.payment_method === 'cod' ? (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            Cash on {isPickup ? 'Pickup' : 'Delivery'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Pay when you receive
                                        </p>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">₹{order.total_amount.toFixed(0)}</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">Paid Online</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            via {order.payment_method.toUpperCase()}
                                        </p>
                                    </div>
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {order.notes && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                            <Package className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-sm text-gray-900 dark:text-white">Note</span>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-gray-700 dark:text-gray-300">{order.notes}</p>
                        </div>
                    </div>
                )}

                {/* Back Button */}
                <Button asChild variant="outline" className="w-full h-11 rounded-xl">
                    <Link href="/">Back to Home</Link>
                </Button>
            </div>
        </div>
    )
}