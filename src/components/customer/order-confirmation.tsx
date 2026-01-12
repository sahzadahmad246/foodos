'use client'

import { CheckCircle2, Clock, MapPin, Phone, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'bg-yellow-500' },
    confirmed: { label: 'Confirmed', color: 'bg-blue-500' },
    preparing: { label: 'Preparing', color: 'bg-purple-500' },
    ready: { label: 'Ready', color: 'bg-green-500' },
    out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-500' },
    delivered: { label: 'Delivered', color: 'bg-green-600' },
    cancelled: { label: 'Cancelled', color: 'bg-red-500' },
}

export function OrderConfirmation({ order }: OrderConfirmationProps) {
    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending

    return (
        <div className="space-y-6">
            {/* Success Message */}
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-6 text-center">
                <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">
                    Order Placed Successfully!
                </h1>
                <p className="text-green-700 dark:text-green-300 mb-4">
                    Your order has been received and is being processed
                </p>
                <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-900 px-4 py-2 rounded-lg border">
                    <span className="text-sm text-muted-foreground">Order Number:</span>
                    <span className="font-mono font-bold text-lg">{order.order_number}</span>
                </div>
            </div>

            {/* Order Status */}
            <div className="bg-card border rounded-lg p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="font-semibold">Order Status</p>
                            <p className="text-sm text-muted-foreground">
                                {new Date(order.created_at).toLocaleString()}
                            </p>
                        </div>
                    </div>
                    <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                </div>
            </div>

            {/* Customer Details */}
            <div className="bg-card border rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold">Customer Details</h2>
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{order.customer_name}</span>
                    </div>
                    {order.customer_phone && (
                        <div className="flex items-center gap-3">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span>{order.customer_phone}</span>
                        </div>
                    )}
                    {order.customer_address && (
                        <div className="flex items-start gap-3">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                            <span className="text-sm">{order.customer_address}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Order Items */}
            <div className="bg-card border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Order Items</h2>
                <div className="space-y-3">
                    {order.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b last:border-0">
                            <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                            </div>
                            <span className="font-semibold">₹{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Order Summary */}
            <div className="bg-card border rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4">Payment Summary</h2>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>₹{order.items_total.toFixed(2)}</span>
                    </div>
                    {order.delivery_fee > 0 && (
                        <div className="flex justify-between text-sm">
                            <span>Delivery Fee</span>
                            <span>₹{order.delivery_fee.toFixed(2)}</span>
                        </div>
                    )}
                    {order.tax_amount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span>Tax</span>
                            <span>₹{order.tax_amount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span>₹{order.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2">
                        <span className="text-muted-foreground">Payment Method</span>
                        <span className="font-medium capitalize">{order.payment_method}</span>
                    </div>
                </div>
            </div>

            {order.notes && (
                <div className="bg-card border rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-2">Special Instructions</h2>
                    <p className="text-sm text-muted-foreground">{order.notes}</p>
                </div>
            )}

            <div className="flex gap-3">
                <Button variant="outline" asChild className="flex-1">
                    <Link href="/">Back to Home</Link>
                </Button>
                <Button asChild className="flex-1">
                    <Link href={`/orders/${order.id}`}>Track Order</Link>
                </Button>
            </div>
        </div>
    )
}
