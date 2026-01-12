'use client'

import { useState } from 'react'
import { MapPin, Phone, User, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { updateOrderStatus } from '../actions/order-actions'
import { toast } from 'sonner'

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
    created_at: string
    order_items: OrderItem[]
}

interface OrderCardProps {
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

export function OrderCard({ order }: OrderCardProps) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)

    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending

    const handleStatusChange = async (newStatus: string) => {
        setIsUpdating(true)
        const result = await updateOrderStatus(order.id, newStatus)
        setIsUpdating(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Order status updated')
        }
    }

    return (
        <div className="border rounded-lg bg-card overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-muted/30">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono font-bold">{order.order_number}</span>
                            <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(order.created_at).toLocaleString()}
                            </div>
                            <div className="font-semibold text-foreground">
                                ₹{order.total_amount.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            {/* Details (Expandable) */}
            {isExpanded && (
                <div className="p-4 space-y-4 border-t">
                    {/* Customer Info */}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Customer Details</h4>
                        <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2">
                                <User className="h-3 w-3 text-muted-foreground" />
                                <span>{order.customer_name}</span>
                            </div>
                            {order.customer_phone && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                    <span>{order.customer_phone}</span>
                                </div>
                            )}
                            {order.customer_address && (
                                <div className="flex items-start gap-2">
                                    <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
                                    <span className="text-xs">{order.customer_address}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Items</h4>
                        <div className="space-y-1">
                            {order.order_items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm">
                                    <span>
                                        {item.quantity}x {item.name}
                                    </span>
                                    <span className="font-medium">
                                        ₹{(item.price * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="space-y-1 pt-3 border-t text-sm">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>₹{order.items_total.toFixed(2)}</span>
                        </div>
                        {order.delivery_fee > 0 && (
                            <div className="flex justify-between">
                                <span>Delivery Fee</span>
                                <span>₹{order.delivery_fee.toFixed(2)}</span>
                            </div>
                        )}
                        {order.tax_amount > 0 && (
                            <div className="flex justify-between">
                                <span>Tax</span>
                                <span>₹{order.tax_amount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-semibold pt-1 border-t">
                            <span>Total</span>
                            <span>₹{order.total_amount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs pt-2">
                            <span className="text-muted-foreground">Payment</span>
                            <span className="font-medium capitalize">{order.payment_method}</span>
                        </div>
                    </div>

                    {/* Status Update */}
                    <div className="pt-3 border-t">
                        <label className="text-sm font-medium mb-2 block">Update Status</label>
                        <Select
                            value={order.status}
                            onValueChange={handleStatusChange}
                            disabled={isUpdating}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="preparing">Preparing</SelectItem>
                                <SelectItem value="ready">Ready</SelectItem>
                                <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                                <SelectItem value="delivered">Delivered</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}
        </div>
    )
}
