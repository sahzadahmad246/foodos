'use client'

import { useEffect, useState } from 'react'
import {
    CheckCircle2, MapPin, Phone, Package,
    ChefHat, Truck, PartyPopper, Store, XCircle,
    Banknote, CreditCard, Bike, User, Clock, Loader2, Check, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BackButton } from './back-button'
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
    confirmed_at?: string | null
    preparing_at?: string | null
    ready_at?: string | null
    picked_up_at?: string | null
    delivered_at?: string | null
    cancelled_at?: string | null
    rider_id?: string | null
    cancellation_reason?: string | null
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
            case 'cancelled': return order.cancellation_reason ? `Reason: ${order.cancellation_reason}` : 'This order has been cancelled'
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
        <div className="mx-auto min-h-screen w-full max-w-lg border-x border-border/60 bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b border-border/70 bg-background/95 backdrop-blur">
                <div className="px-4 py-4">
                    <div className="flex items-center gap-4">
                        <BackButton fallbackHref="/customer/orders" />
                        <div className="min-w-0 flex-1">
                            <h1 className="truncate text-lg font-bold text-foreground">
                                Order #{order.order_number}
                            </h1>
                            {restaurant && (
                                <p className="truncate text-sm text-muted-foreground">
                                    {restaurant.name}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="space-y-4 px-4 py-5">
                {/* Status Card */}
                <div className={`
                    bg-card/70 rounded-2xl p-6 border text-center
                    ${isCancelled
                        ? 'border-red-200 dark:border-red-800'
                        : isComplete
                            ? 'border-primary/40'
                            : 'border-border/70'
                    }
                `}>
                    <div className="mb-4">
                        {isCancelled ? (
                            <XCircle className="h-12 w-12 mx-auto text-red-500" />
                        ) : isComplete ? (
                            <CheckCircle2 className="h-12 w-12 mx-auto text-primary" />
                        ) : (
                            <div className="relative inline-flex">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary text-primary">
                                    <CurrentIcon className="h-6 w-6 text-foreground" />
                                </div>
                            </div>
                        )}
                    </div>

                    <h2 className={`text-xl font-bold mb-1 ${isCancelled ? 'text-red-600 dark:text-red-400'
                        : isComplete ? 'text-primary'
                            : 'text-foreground'
                        }`}>
                        {getStatusMessage()}
                    </h2>
                    <p className="text-sm text-muted-foreground">{getStatusDescription()}</p>

                    <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(order.created_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                        })}
                    </div>
                </div>

                {/* Rider Info Card */}
                {!isPickup && !isCancelled && !isComplete && (
                    <div className="bg-card/70 rounded-2xl border border-border/70 overflow-hidden">
                        <div className="px-4 py-3 border-b border-border/70 flex items-center gap-2">
                            <Bike className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm text-foreground">Delivery Partner</span>
                        </div>
                        <div className="p-4">
                            {isLoadingRider ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Loading...</span>
                                </div>
                            ) : order.rider ? (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-semibold text-foreground">{order.rider.name}</p>
                                        <p className="text-sm text-muted-foreground">{getRiderStatusMessage()}</p>
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
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">Finding a delivery partner</p>
                                        <p className="text-sm text-muted-foreground">Please wait...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {/* Animated loading bar when searching */}
                        {!order.rider && !isLoadingRider && (
                            <div className="h-1 bg-muted overflow-hidden">
                                <div className="h-full w-1/3 bg-primary animate-[shimmer_1.5s_ease-in-out_infinite]"
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

                {/* Progress Stepper - Show for both active and cancelled orders */}
                <div className="py-4">
                    <div className="flex items-start">
                        {(() => {
                            // For cancelled orders, determine how far the order got before cancellation
                            const getCancelledStepIndex = () => {
                                if (order.picked_up_at) return STATUS_STEPS.findIndex(s => s.key === 'out_for_delivery')
                                if (order.ready_at) return STATUS_STEPS.findIndex(s => s.key === 'ready')
                                if (order.preparing_at || order.confirmed_at) return STATUS_STEPS.findIndex(s => s.key === 'preparing')
                                return 0 // pending
                            }

                            const cancelledAtIndex = isCancelled ? getCancelledStepIndex() : -1

                            // Filter steps for cancelled - show only steps up to where cancelled, plus Cancelled step
                            const displaySteps = isCancelled
                                ? [...STATUS_STEPS.slice(0, cancelledAtIndex + 1), { key: 'cancelled', label: 'Cancelled', icon: X }]
                                : STATUS_STEPS

                            return displaySteps.map((step, index) => {
                                const isPast = isCancelled
                                    ? index < displaySteps.length - 1 // All before "Cancelled" are completed
                                    : index <= currentStepIndex
                                const isCurrent = isCancelled
                                    ? index === displaySteps.length - 1 // "Cancelled" is current
                                    : index === currentStepIndex
                                const isCancelledStep = step.key === 'cancelled'
                                const Icon = step.icon

                                // Get timestamp for this step
                                const getStepTime = () => {
                                    switch (step.key) {
                                        case 'pending': return order.created_at
                                        case 'preparing': return order.preparing_at || order.confirmed_at
                                        case 'ready': return order.ready_at
                                        case 'out_for_delivery': return order.picked_up_at
                                        case 'delivered': return order.delivered_at
                                        case 'cancelled': return order.cancelled_at
                                        default: return null
                                    }
                                }
                                const stepTime = isPast || isCurrent ? getStepTime() : null

                                return (
                                    <div key={step.key} className="flex-1 flex flex-col items-center relative">
                                        {/* Connector line - before the circle */}
                                        {index > 0 && (
                                            <div
                                                className={`absolute top-4 right-1/2 h-0.5 w-full ${isCancelledStep
                                                    ? 'bg-red-500'
                                                    : isPast
                                                        ? 'bg-primary'
                                                        : 'bg-muted'
                                                    }`}
                                            />
                                        )}

                                        <div className={`
                                            relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2
                                            ${isCancelledStep
                                                ? 'border-red-500 bg-red-500 dark:bg-red-500'
                                                : isPast
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : 'border-border bg-background'
                                            }
                                        `}>
                                            {isCancelledStep ? (
                                                <Icon className="h-4 w-4 text-white" />
                                            ) : isPast && !isCurrent ? (
                                                <Check className="h-4 w-4 text-primary-foreground" />
                                            ) : (
                                                <Icon className={`h-4 w-4 ${isPast ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                                            )}
                                        </div>
                                        <span className={`
                                            text-xs text-center mt-2 leading-tight
                                            ${isCancelledStep
                                                ? 'font-medium text-red-600 dark:text-red-400'
                                                : isPast
                                                    ? 'font-medium text-foreground'
                                                    : 'text-muted-foreground'}
                                        `}>
                                            {step.label}
                                        </span>
                                        {/* Timestamp */}
                                        {stepTime && (
                                            <span className="text-[10px] text-muted-foreground mt-0.5">
                                                {new Date(stepTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                )
                            })
                        })()}
                    </div>
                </div>

                {/* Pickup/Delivery Address */}
                {isPickup && restaurant ? (
                    <div className="bg-card/70 rounded-2xl border border-border/70 overflow-hidden">
                        <div className="px-4 py-3 border-b border-border/70 flex items-center gap-2">
                            <Store className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm text-foreground">Pickup Location</span>
                        </div>
                        <div className="p-4">
                            <p className="font-semibold text-foreground">{restaurant.name}</p>
                            <p className="text-sm text-muted-foreground mt-1">{restaurantAddress}</p>
                        </div>

                        {/* Merged OTP Section */}
                        {(order as any).pickup_otp && !isComplete && !isCancelled && (
                            <div className="border-t border-border/70 bg-muted/40 p-6 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mb-3">
                                    Pickup OTP
                                </p>
                                <div className="text-4xl font-mono font-bold tracking-[0.3em] text-primary">
                                    {(order as any).pickup_otp}
                                </div>
                                <div className="mt-4 flex justify-center">
                                    <div className="flex items-center gap-2 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-full border border-amber-100 dark:border-amber-900/50">
                                        <div className="min-w-3">⚠️</div>
                                        <p className="leading-tight">
                                            Only share at counter
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : order.customer_address && (
                    <div className="bg-card/70 rounded-2xl border border-border/70 overflow-hidden">
                        <div className="px-4 py-3 border-b border-border/70 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm text-foreground">Delivery Address</span>
                        </div>
                        <div className="p-4">
                            <p className="font-semibold text-foreground">{order.customer_name}</p>
                            <p className="text-sm text-muted-foreground mt-1">{order.customer_address}</p>
                            {order.customer_phone && (
                                <a
                                    href={`tel:${order.customer_phone}`}
                                    className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                                >
                                    <Phone className="h-3.5 w-3.5" />
                                    {order.customer_phone}
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Order Items */}
                <div className="bg-card/70 rounded-2xl border border-border/70 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border/70 flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm text-foreground">Order Items</span>
                    </div>
                    <div className="divide-y divide-border/70">
                        {order.order_items.map((item) => (
                            <div key={item.id} className="px-4 py-3 flex justify-between items-start">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.quantity} × ₹{item.price}
                                    </p>
                                </div>
                                <p className="text-sm font-medium text-foreground">
                                    ₹{(item.price * item.quantity).toFixed(0)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bill Summary */}
                <div className="bg-card/70 rounded-2xl border border-border/70 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border/70 flex items-center gap-2">
                        {order.payment_method === 'cod' ? (
                            <Banknote className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium text-sm text-foreground">Payment</span>
                    </div>
                    <div className="p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="text-foreground">₹{order.items_total.toFixed(0)}</span>
                        </div>
                        {order.delivery_fee > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Delivery Fee</span>
                                <span className="text-foreground">₹{order.delivery_fee.toFixed(0)}</span>
                            </div>
                        )}
                        {order.tax_amount > 0 && (
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Tax</span>
                                <span className="text-foreground">₹{order.tax_amount.toFixed(0)}</span>
                            </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-border/70">
                            <span className="font-medium text-foreground">Total</span>
                            <span className="font-bold text-foreground">₹{order.total_amount.toFixed(0)}</span>
                        </div>

                        <div className="pt-3 mt-2 border-t border-border/70">
                            {order.payment_method === 'cod' ? (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            Cash on {isPickup ? 'Pickup' : 'Delivery'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Pay when you receive
                                        </p>
                                    </div>
                                    <span className="font-bold text-foreground">₹{order.total_amount.toFixed(0)}</span>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-foreground">Paid Online</p>
                                        <p className="text-xs text-muted-foreground">
                                            via {order.payment_method.toUpperCase()}
                                        </p>
                                    </div>
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notes */}
                {order.notes && (
                    <div className="bg-card/70 rounded-2xl border border-border/70 overflow-hidden">
                        <div className="px-4 py-3 border-b border-border/70 flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm text-foreground">Note</span>
                        </div>
                        <div className="p-4">
                            <p className="text-sm text-foreground/80">{order.notes}</p>
                        </div>
                    </div>
                )}

                {/* Back Button */}
                <Button asChild variant="outline" className="h-11 w-full rounded-xl">
                    <Link href="/customer/orders">View all orders</Link>
                </Button>
            </div>
        </div >
    )
}