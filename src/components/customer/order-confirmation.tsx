'use client'

import { useEffect, useState } from 'react'
import {
    CheckCircle2, Clock, MapPin, Phone, User, Package,
    ChefHat, Truck, PartyPopper, Store, XCircle, ArrowLeft,
    Banknote, CreditCard
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface OrderItem {
    id: string
    name: string
    price: number
    quantity: number
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
}

interface OrderConfirmationProps {
    order: Order
}

const STATUS_STEPS = [
    { key: 'pending', label: 'Placed', icon: Package, color: 'text-yellow-600' },
    { key: 'preparing', label: 'Preparing', icon: ChefHat, color: 'text-purple-600' },
    { key: 'ready', label: 'Ready', icon: PartyPopper, color: 'text-green-600' },
    { key: 'out_for_delivery', label: 'On the way', icon: Truck, color: 'text-blue-600' },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2, color: 'text-green-700' },
]

export function OrderConfirmation({ order: initialOrder }: OrderConfirmationProps) {
    const [order, setOrder] = useState(initialOrder)
    const supabase = createClient()

    // Realtime subscription for order updates
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
                    console.log('Order status updated:', payload.new)
                    setOrder((prev) => ({ ...prev, ...payload.new }))
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [order.id, supabase])

    const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === order.status)
    const isPickup = !order.customer_address
    const isCancelled = order.status === 'cancelled'

    const getStatusMessage = () => {
        switch (order.status) {
            case 'pending': return 'Waiting for restaurant to confirm...'
            case 'preparing': return 'Your food is being prepared 👨‍🍳'
            case 'ready': return isPickup ? 'Ready for pickup! 🎉' : 'Ready for delivery!'
            case 'out_for_delivery': return 'Your order is on the way! 🚴'
            case 'delivered': return 'Enjoy your meal! 🎉'
            default: return ''
        }
    }

    return (
        <div className="space-y-6 pb-8">
            {/* Header */}
            <div className="flex items-center gap-4 py-2">
                <Link href="/">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="font-bold text-lg">Order #{order.order_number}</h1>
                    <p className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleString('en-IN', {
                            dateStyle: 'medium',
                            timeStyle: 'short'
                        })}
                    </p>
                </div>
            </div>

            {/* Status Banner */}
            <div className={`rounded-2xl p-6 text-center ${isCancelled
                ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900'
                : order.status === 'delivered'
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900'
                    : 'bg-primary/5 border border-primary/20'
                }`}>
                {isCancelled ? (
                    <>
                        <XCircle className="h-14 w-14 text-red-500 mx-auto mb-3" />
                        <h2 className="text-xl font-bold text-red-700 dark:text-red-400">Order Cancelled</h2>
                    </>
                ) : order.status === 'delivered' ? (
                    <>
                        <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-3" />
                        <h2 className="text-xl font-bold text-green-700 dark:text-green-400">Order Delivered!</h2>
                    </>
                ) : (() => {
                    const CurrentIcon = currentStepIndex >= 0 ? STATUS_STEPS[currentStepIndex].icon : Package
                    const currentColor = currentStepIndex >= 0 ? STATUS_STEPS[currentStepIndex].color : 'text-muted-foreground'
                    return (
                        <>
                            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 animate-pulse">
                                <CurrentIcon className={`h-7 w-7 ${currentColor}`} />
                            </div>
                            <h2 className="text-xl font-bold">{getStatusMessage()}</h2>
                        </>
                    )
                })()}
            </div>

            {/* Progress Steps */}
            {!isCancelled && (
                <div className="py-4">
                    <div className="flex items-center justify-between relative">
                        {/* Progress Line Background */}
                        <div className="absolute top-5 left-6 right-6 h-1 bg-muted rounded-full" />
                        {/* Progress Line Fill */}
                        <div
                            className="absolute top-5 left-6 h-1 bg-primary rounded-full transition-all duration-500"
                            style={{
                                width: currentStepIndex >= 0
                                    ? `calc(${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}% - 24px)`
                                    : '0%'
                            }}
                        />

                        {STATUS_STEPS.map((step, index) => {
                            const isPast = index <= currentStepIndex
                            const isCurrent = index === currentStepIndex
                            const Icon = step.icon

                            return (
                                <div key={step.key} className="flex flex-col items-center z-10">
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center
                                        transition-all duration-300 shadow-sm
                                        ${isPast
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-background border-2 border-muted text-muted-foreground'
                                        }
                                        ${isCurrent ? 'ring-4 ring-primary/20 scale-110' : ''}
                                    `}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <span className={`text-xs mt-2 font-medium ${isPast ? 'text-foreground' : 'text-muted-foreground'
                                        }`}>
                                        {step.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Delivery/Pickup Info */}
            <div className="rounded-xl border p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                    {isPickup ? <Store className="h-4 w-4" /> : <Truck className="h-4 w-4" />}
                    {isPickup ? 'Pickup' : 'Delivery'} Details
                </h3>
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{order.customer_name}</span>
                    </div>
                    {order.customer_phone && (
                        <a href={`tel:${order.customer_phone}`} className="flex items-center gap-3 text-primary">
                            <Phone className="h-4 w-4" />
                            <span>{order.customer_phone}</span>
                        </a>
                    )}
                    {order.customer_address ? (
                        <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="text-sm text-muted-foreground">{order.customer_address}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Store className="h-4 w-4 text-primary" />
                            <Badge variant="secondary" className="bg-primary/10 text-primary">Pickup Order</Badge>
                        </div>
                    )}
                </div>
            </div>

            {/* Order Items */}
            <div className="rounded-xl border overflow-hidden">
                <div className="px-4 py-3 bg-muted/50 border-b">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Order Items ({order.order_items.length})
                    </h3>
                </div>
                <div className="divide-y">
                    {order.order_items.map((item) => (
                        <div key={item.id} className="p-4 flex justify-between items-center">
                            <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">Qty: {item.quantity} × ₹{item.price}</p>
                            </div>
                            <span className="font-semibold">₹{(item.price * item.quantity).toFixed(0)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payment Summary */}
            <div className="rounded-xl border p-4 space-y-3">
                <h3 className="font-semibold pb-3 border-b">Payment Summary</h3>
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{order.items_total.toFixed(0)}</span>
                </div>
                {order.delivery_fee > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery Fee</span>
                        <span>₹{order.delivery_fee.toFixed(0)}</span>
                    </div>
                )}
                {order.tax_amount > 0 && (
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">GST</span>
                        <span>₹{order.tax_amount.toFixed(0)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-3 border-t">
                    <span>Total Paid</span>
                    <span className="text-primary">₹{order.total_amount.toFixed(0)}</span>
                </div>
                <div className="flex items-center gap-2 pt-2">
                    {order.payment_method === 'cod' ? (
                        <>
                            <Banknote className="h-4 w-4 text-green-600" />
                            <span className="text-sm">Cash on Delivery</span>
                        </>
                    ) : (
                        <>
                            <CreditCard className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-green-600 font-medium">Paid Online ✓</span>
                        </>
                    )}
                </div>
            </div>

            {order.notes && (
                <div className="rounded-xl border p-4">
                    <h3 className="font-semibold mb-2">Special Instructions</h3>
                    <p className="text-sm text-muted-foreground">{order.notes}</p>
                </div>
            )}

            {/* Back Button */}
            <Button asChild variant="outline" className="w-full">
                <Link href="/">Back to Home</Link>
            </Button>
        </div>
    )
}
