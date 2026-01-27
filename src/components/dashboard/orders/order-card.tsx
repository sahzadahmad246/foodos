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
import { AssignRiderModal } from './assign-rider-dropdown'
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
    confirmed_at?: string | null
    preparing_at?: string | null
    ready_at?: string | null
    picked_up_at?: string | null
    delivered_at?: string | null
    cancelled_at?: string | null
    notes?: string | null
    rider_id?: string | null
    restaurant_id: string
    order_items: OrderItem[]
    rider?: {
        id: string
        name: string
    } | null
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

                    {/* Rider Info */}
                    {order.customer_address && order.rider && (
                        <div className="flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-950/30 p-2.5 rounded-lg">
                            <Bike className="h-4 w-4 text-blue-600 flex-shrink-0" />
                            <span className="text-blue-700 dark:text-blue-400">
                                Rider: <strong>{order.rider.name}</strong>
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



                    {/* Progress Stepper */}
                    {order.status !== 'cancelled' && (
                        <div className="py-4 px-2">
                            <div className="relative flex items-center justify-between w-full">
                                {/* Connecting Line */}
                                <div className="absolute left-2 right-2 top-1.5 h-0.5 bg-gray-100 dark:bg-gray-800 -z-0" />
                                {/* Active Line */}
                                <div
                                    className="absolute left-2 top-1.5 h-0.5 bg-primary -z-0 transition-all duration-500"
                                    style={{
                                        right: `${100 - (['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered'].indexOf(order.status) / 4) * 100}%`
                                    }}
                                />

                                {['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered'].map((step, index) => {
                                    const steps = ['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered']
                                    const currentStepIndex = steps.indexOf(order.status)
                                    const stepIndex = steps.indexOf(step)
                                    const isCompleted = stepIndex <= currentStepIndex
                                    const isCurrent = stepIndex === currentStepIndex

                                    let stepLabel = ''
                                    let stepTime = null

                                    switch (step) {
                                        case 'pending':
                                            stepLabel = 'Placed'
                                            stepTime = order.created_at
                                            break
                                        case 'preparing':
                                            stepLabel = 'Prep'
                                            stepTime = order.preparing_at || order.confirmed_at
                                            break
                                        case 'ready':
                                            stepLabel = 'Ready'
                                            stepTime = order.ready_at
                                            break
                                        case 'out_for_delivery':
                                            stepLabel = 'Out'
                                            stepTime = order.picked_up_at
                                            break
                                        case 'delivered':
                                            stepLabel = 'Done'
                                            stepTime = order.delivered_at
                                            break
                                    }

                                    // Only show time if step is completed or current
                                    if (!isCompleted) stepTime = null

                                    return (
                                        <div key={step} className="flex flex-col items-center gap-2 z-10">
                                            <div className={`
                                                w-3.5 h-3.5 rounded-full border-[3px] transition-colors duration-300
                                                ${isCompleted
                                                    ? 'bg-primary border-primary'
                                                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                                                }
                                                ${isCurrent ? 'ring-2 ring-primary/20 ring-offset-2 dark:ring-offset-gray-900 scale-110' : ''}
                                            `} />
                                            <div className="flex flex-col items-center">
                                                <span className={`text-[10px] font-semibold tracking-tight ${isCurrent ? 'text-primary' : 'text-gray-500'}`}>
                                                    {stepLabel}
                                                </span>
                                                {stepTime && (
                                                    <span className="text-[9px] text-gray-400 font-medium mt-0.5">
                                                        {new Date(stepTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
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
                                {/* Only show Assign Rider for delivery orders */}
                                {order.customer_address && (
                                    <AssignRiderModal
                                        orderId={order.id}
                                        restaurantId={order.restaurant_id}
                                        currentRiderId={order.rider_id}
                                        currentRiderName={order.rider?.name}
                                    />
                                )}
                            </>
                        )}

                        {order.status === 'ready' && order.customer_address && (
                            <AssignRiderModal
                                orderId={order.id}
                                restaurantId={order.restaurant_id}
                                currentRiderId={order.rider_id}
                                currentRiderName={order.rider?.name}
                            />
                        )}

                        {order.status === 'ready' && !order.customer_address && (
                            <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-muted/50 rounded-lg text-muted-foreground">
                                <Store className="h-4 w-4" />
                                <span className="text-sm">Waiting for customer pickup</span>
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
