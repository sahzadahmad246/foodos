'use client'

import { useState } from 'react'
import { MapPin, Phone, User, Clock, Package, ChefHat, Bike, Check, X, Loader2, UserPlus, Store } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
import { acceptOrder, rejectOrder, markOrderReady } from '../actions/order-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

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
    payment_status: string
    status: string
    created_at: string
    notes?: string | null
    rider_id?: string | null
    order_items: OrderItem[]
}

interface OrderCardProps {
    order: Order
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
    pending: { label: 'New Order', color: 'text-yellow-700', bgColor: 'bg-yellow-100 border-yellow-300' },
    preparing: { label: 'Preparing', color: 'text-purple-700', bgColor: 'bg-purple-100 border-purple-300' },
    ready: { label: 'Ready for Pickup', color: 'text-green-700', bgColor: 'bg-green-100 border-green-300' },
    out_for_delivery: { label: 'Out for Delivery', color: 'text-blue-700', bgColor: 'bg-blue-100 border-blue-300' },
    delivered: { label: 'Delivered', color: 'text-green-800', bgColor: 'bg-green-50 border-green-200' },
    cancelled: { label: 'Cancelled', color: 'text-red-700', bgColor: 'bg-red-100 border-red-300' },
}

type LoadingAction = 'accept' | 'reject' | 'ready' | 'assign' | null

export function OrderCard({ order }: OrderCardProps) {
    const router = useRouter()
    const [loadingAction, setLoadingAction] = useState<LoadingAction>(null)
    const [showRejectDialog, setShowRejectDialog] = useState(false)

    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
    const isLoading = loadingAction !== null

    const handleAccept = async () => {
        setLoadingAction('accept')
        const result = await acceptOrder(order.id)
        setLoadingAction(null)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Order accepted! Start preparing.')
            router.refresh()
        }
    }

    const handleReject = async () => {
        setLoadingAction('reject')
        const result = await rejectOrder(order.id)
        setLoadingAction(null)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Order rejected')
            setShowRejectDialog(false)
            router.refresh()
        }
    }

    const handleMarkReady = async () => {
        setLoadingAction('ready')
        const result = await markOrderReady(order.id)
        setLoadingAction(null)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Order marked as ready!')
            router.refresh()
        }
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return 'Just now'
        if (diffMins < 60) return `${diffMins}m ago`
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
        return date.toLocaleDateString()
    }

    return (
        <>
            <Card className={`overflow-hidden border-2 ${statusConfig.bgColor}`}>
                <CardHeader className="pb-2 pt-3 px-4">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="font-mono font-bold text-lg">{order.order_number}</div>
                            <Badge variant="outline" className={statusConfig.color}>
                                {statusConfig.label}
                            </Badge>
                            {order.payment_method === 'cod' && (
                                <Badge variant="secondary" className="text-xs">COD</Badge>
                            )}
                            {order.payment_status === 'paid' && (
                                <Badge className="bg-green-500 text-xs">Paid</Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {formatTime(order.created_at)}
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-3 px-4 pb-4">
                    {/* Customer Info */}
                    <div className="flex items-start gap-4 text-sm">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium truncate">{order.customer_name}</span>
                        </div>
                        {order.customer_phone && (
                            <a href={`tel:${order.customer_phone}`} className="flex items-center gap-1.5 text-primary hover:underline">
                                <Phone className="h-4 w-4" />
                                {order.customer_phone}
                            </a>
                        )}
                    </div>

                    {order.customer_address ? (
                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{order.customer_address}</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 text-sm">
                            <Store className="h-4 w-4 text-primary" />
                            <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full text-xs">
                                🏬 Pickup Order
                            </span>
                        </div>
                    )}

                    {/* Order Items */}
                    <div className="bg-background/50 rounded-lg p-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-sm font-medium mb-2">
                            <Package className="h-4 w-4" />
                            Items ({order.order_items?.length || 0})
                        </div>
                        {(order.order_items || []).map((item) => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span>{item.quantity}x {item.name}</span>
                                <span className="font-medium">₹{(item.price * item.quantity).toFixed(0)}</span>
                            </div>
                        ))}
                        {(!order.order_items || order.order_items.length === 0) && (
                            <p className="text-xs text-muted-foreground">No items data</p>
                        )}
                        <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                            <span>Total</span>
                            <span>₹{order.total_amount.toFixed(0)}</span>
                        </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div className="text-sm text-muted-foreground bg-muted/50 rounded p-2">
                            <span className="font-medium">Note: </span>{order.notes}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                        {order.status === 'pending' && (
                            <>
                                <Button
                                    onClick={handleAccept}
                                    disabled={isLoading}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    {loadingAction === 'accept' ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Check className="h-4 w-4 mr-2" />
                                    )}
                                    Accept
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setShowRejectDialog(true)}
                                    disabled={isLoading}
                                    className="flex-1"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Reject
                                </Button>
                            </>
                        )}

                        {order.status === 'preparing' && (
                            <>
                                <Button
                                    onClick={handleMarkReady}
                                    disabled={isLoading}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    {loadingAction === 'ready' ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <ChefHat className="h-4 w-4 mr-2" />
                                    )}
                                    Mark Ready
                                </Button>
                                <Button
                                    variant="outline"
                                    disabled={true}
                                    className="flex-1"
                                    title="Rider assignment coming soon"
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Assign Rider
                                </Button>
                            </>
                        )}

                        {order.status === 'ready' && (
                            <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-muted/50 rounded-lg text-muted-foreground">
                                <Bike className="h-4 w-4" />
                                <span className="text-sm">
                                    {order.rider_id ? 'Waiting for rider pickup' : 'No rider assigned yet'}
                                </span>
                            </div>
                        )}

                        {order.status === 'out_for_delivery' && (
                            <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 rounded-lg text-blue-700">
                                <Bike className="h-4 w-4" />
                                <span className="text-sm font-medium">On the way to customer</span>
                            </div>
                        )}

                        {order.status === 'delivered' && (
                            <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-50 rounded-lg text-green-700">
                                <Check className="h-4 w-4" />
                                <span className="text-sm font-medium">Order completed</span>
                            </div>
                        )}

                        {order.status === 'cancelled' && (
                            <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 rounded-lg text-red-700">
                                <X className="h-4 w-4" />
                                <span className="text-sm font-medium">Order cancelled</span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Reject Confirmation */}
            <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reject Order {order.order_number}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will cancel the order. The customer will be notified.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loadingAction === 'reject'}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleReject}
                            disabled={loadingAction === 'reject'}
                            className="bg-destructive text-destructive-foreground"
                        >
                            {loadingAction === 'reject' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Reject Order
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
