'use client'

import { useEffect, useState } from 'react'
import {
    CheckCircle2, MapPin, Phone, Package,
    ChefHat, Truck, PartyPopper, Store, XCircle, ArrowLeft,
    Banknote, CreditCard, Navigation
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
    order_items: OrderItem[]
    restaurant?: Restaurant | null
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

    useEffect(() => {
        const channel = supabase
            .channel(`order-${order.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${order.id}`,
                },
                (payload) => {
                    setOrder((prev) => ({ ...prev, ...payload.new }))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [order.id, supabase])

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
            case 'out_for_delivery': return 'Delivery partner is on the way'
            case 'delivered': return 'Thank you for your order!'
            case 'cancelled': return 'This order has been cancelled'
            default: return ''
        }
    }

    const getDirectionsUrl = () => {
        if (restaurant?.latitude && restaurant?.longitude) {
            return `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`
        }
        return null
    }

    const CurrentIcon = currentStepIndex >= 0 ? STATUS_STEPS[currentStepIndex]?.icon : Package

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                        </Link>
                        <div className="flex-1 min-w-0">
                            <h1 className="font-bold text-lg">Order #{order.order_number}</h1>
                            {restaurant && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {restaurant.name}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                {/* Status Box with Animation */}
                <div className={`
                    rounded-2xl p-8 text-center transition-all
                    ${isCancelled
                        ? 'bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900'
                        : isComplete
                            ? 'bg-green-50 dark:bg-green-950/20 border-2 border-green-200 dark:border-green-900'
                            : 'bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800'
                    }
                `}>
                    <div className="mb-4 relative">
                        {isCancelled ? (
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30">
                                <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
                            </div>
                        ) : isComplete ? (
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30">
                                <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                            </div>
                        ) : (
                            <div className="relative inline-flex items-center justify-center">
                                <div className="absolute w-20 h-20 rounded-full bg-primary/20 animate-ping" />
                                <div className="relative w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                                    <CurrentIcon className="h-10 w-10 text-primary animate-bounce" />
                                </div>
                            </div>
                        )}
                    </div>
                    <h2 className={`text-2xl font-bold mb-2 ${
                        isCancelled ? 'text-red-600 dark:text-red-400'
                            : isComplete ? 'text-green-600 dark:text-green-400'
                                : 'text-gray-900 dark:text-white'
                    }`}>
                        {getStatusMessage()}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">{getStatusDescription()}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-3">
                        {new Date(order.created_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                        })}
                    </p>
                </div>

                {/* Beautiful Stepper */}
                {!isCancelled && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
                        <div className="relative">
                            {/* Background line */}
                            <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-800 rounded-full" />
                            
                            {/* Progress line */}
                            <div 
                                className="absolute top-6 left-0 h-1 bg-primary rounded-full transition-all duration-700 ease-out"
                                style={{
                                    width: currentStepIndex >= 0
                                        ? `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%`
                                        : '0%'
                                }}
                            />

                            {/* Steps */}
                            <div className="relative flex justify-between">
                                {STATUS_STEPS.map((step, index) => {
                                    const isPast = index <= currentStepIndex
                                    const Icon = step.icon

                                    return (
                                        <div key={step.key} className="flex flex-col items-center z-10">
                                            <div className={`
                                                w-12 h-12 rounded-full flex items-center justify-center mb-3
                                                transition-all duration-500 shadow-lg
                                                ${isPast
                                                    ? 'bg-primary text-white'
                                                    : 'bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-700 text-gray-400'
                                                }
                                            `}>
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <span className={`
                                                text-xs text-center max-w-[70px] leading-tight transition-all
                                                ${isPast ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-500'}
                                            `}>
                                                {step.label}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Pickup/Delivery Info */}
                {isPickup && restaurant ? (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                                <Store className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-white mb-1">Pickup Location</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {restaurantAddress || restaurant.name}
                                </p>
                            </div>
                        </div>
                        {getDirectionsUrl() && (
                            <a
                                href={getDirectionsUrl()!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
                            >
                                <Navigation className="h-4 w-4" />
                                Get Directions
                            </a>
                        )}
                    </div>
                ) : order.customer_address && (
                    <div className="bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 rounded-2xl p-6 border-2 border-primary/20">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0 shadow-lg shadow-primary/10">
                                <MapPin className="h-7 w-7 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-gray-900 dark:text-white mb-2 text-lg">Delivering to</p>
                                <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 backdrop-blur-sm">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{order.customer_name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">{order.customer_address}</p>
                                    {order.customer_phone && (
                                        <a
                                            href={`tel:${order.customer_phone}`}
                                            className="inline-flex items-center gap-2 text-sm font-medium text-primary mt-2 hover:underline"
                                        >
                                            <Phone className="h-4 w-4" />
                                            {order.customer_phone}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Order Items */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                    <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Order Items</h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-800">
                        {order.order_items.map((item) => (
                            <div key={item.id} className="px-5 py-4 flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                        Qty: {item.quantity} × ₹{item.price}
                                    </p>
                                </div>
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    ₹{(item.price * item.quantity).toFixed(0)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bill Summary */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-200 dark:border-gray-800">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Bill Summary</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                            <span className="text-gray-900 dark:text-white">₹{order.items_total.toFixed(0)}</span>
                        </div>
                        {order.delivery_fee > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Delivery Fee</span>
                                <span className="text-gray-900 dark:text-white">₹{order.delivery_fee.toFixed(0)}</span>
                            </div>
                        )}
                        {order.tax_amount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">Tax</span>
                                <span className="text-gray-900 dark:text-white">₹{order.tax_amount.toFixed(0)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-200 dark:border-gray-800">
                            <span className="text-gray-900 dark:text-white">Total</span>
                            <span className="text-primary">₹{order.total_amount.toFixed(0)}</span>
                        </div>
                        <div className="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-800">
                            {order.payment_method === 'cod' ? (
                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-2 border-amber-300 dark:border-amber-800 w-full">
                                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
                                        <Banknote className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-amber-900 dark:text-amber-100">
                                            Cash on {isPickup ? 'Pickup' : 'Delivery'}
                                        </p>
                                        <p className="text-xs text-amber-700 dark:text-amber-300">
                                            Pay ₹{order.total_amount.toFixed(0)} when you receive
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-300 dark:border-green-800 w-full">
                                    <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-green-900 dark:text-green-100">
                                            Payment Successful
                                        </p>
                                        <p className="text-xs text-green-700 dark:text-green-300">
                                            Paid online via {order.payment_method.toUpperCase()}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {order.notes && (
                    <div className="bg-amber-50 dark:bg-amber-950/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-900">
                        <p className="text-sm text-gray-900 dark:text-white">
                            <strong className="font-semibold">Note:</strong> {order.notes}
                        </p>
                    </div>
                )}

                {/* Back Button */}
                <Button asChild variant="outline" className="w-full h-12 text-base">
                    <Link href="/">Back to Home</Link>
                </Button>
            </div>
        </div>
    )
}