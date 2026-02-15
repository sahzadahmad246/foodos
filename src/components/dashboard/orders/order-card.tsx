'use client'

import { useState } from 'react'
import { MapPin, Phone, User, Clock, Package, ChefHat, Bike, Check, X, Loader2, UserPlus, Store, Banknote, CheckCircle2, XCircle, RotateCcw, MoreHorizontal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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
import { acceptOrder, rejectOrder, markOrderReady, cancelOrder, verifyReturnOtp, markReturnCollected } from '../actions/order-actions'
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
        phone?: string | null
    } | null
    cancellation_reason?: string | null
    cancelled_by?: string | null
    cancelled_step?: string | null
    return_otp?: string | null
    return_verified_at?: string | null
}

interface OrderCardProps {
    order: Order
}

const STATUS_CONFIG: Record<string, { label: string; pill: string; accent: string }> = {
    pending: { label: 'New Order', pill: 'text-yellow-700 bg-yellow-50 border-yellow-200', accent: 'bg-yellow-400' },
    preparing: { label: 'Preparing', pill: 'text-purple-700 bg-purple-50 border-purple-200', accent: 'bg-purple-500' },
    ready: { label: 'Ready for Pickup', pill: 'text-green-700 bg-green-50 border-green-200', accent: 'bg-green-500' },
    out_for_delivery: { label: 'Out for Delivery', pill: 'text-blue-700 bg-blue-50 border-blue-200', accent: 'bg-blue-500' },
    delivered: { label: 'Delivered', pill: 'text-emerald-700 bg-emerald-50 border-emerald-200', accent: 'bg-emerald-500' },
    cancelled: { label: 'Cancelled', pill: 'text-red-700 bg-red-50 border-red-200', accent: 'bg-red-500' },
}

const CANCELLATION_REASONS = [
    'Customer requested cancellation',
    'Out of stock / Item unavailable',
    'Restaurant too busy',
    'Delivery address unreachable',
    'Payment issue',
    'Customer unreachable',
    'Rider unavailable',
    'Order taking too long',
    'Other'
] as const

type LoadingAction = 'accept' | 'reject' | 'ready' | 'assign' | 'cancel' | 'returnVerify' | 'returnCollect' | null

export function OrderCard({ order }: OrderCardProps) {
    const router = useRouter()
    const [loadingAction, setLoadingAction] = useState<LoadingAction>(null)
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [showVerifyDialog, setShowVerifyDialog] = useState(false)
    const [otp, setOtp] = useState('')
    const [verifyError, setVerifyError] = useState('')
    const [isCashCollected, setIsCashCollected] = useState(false)
    // Cancel order state
    const [showCancelDialog, setShowCancelDialog] = useState(false)
    const [cancelReason, setCancelReason] = useState('')
    const [customReason, setCustomReason] = useState('')
    // Return OTP verification state
    const [showReturnDialog, setShowReturnDialog] = useState(false)
    const [returnOtp, setReturnOtp] = useState('')
    const [returnError, setReturnError] = useState('')

    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
    const paymentMethodLabel = order.payment_method === 'cod'
        ? 'Cash on Delivery'
        : (order.payment_method?.toUpperCase() || 'Online')
    const isLoading = loadingAction !== null

    // Reset state when dialog opens
    const openVerifyDialog = () => {
        setOtp('')
        setVerifyError('')
        setIsCashCollected(false)
        setShowVerifyDialog(true)
    }

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

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) {
            setVerifyError('Please enter a valid 6-digit OTP')
            return
        }

        if (order.payment_method === 'cod' && order.payment_status === 'pending' && !isCashCollected) {
            setVerifyError('Please confirm cash collection')
            return
        }

        setVerifyError('')
        setLoadingAction('verify' as any)

        // Dynamically import to avoid circular dependencies if any, or just use the action
        const { verifyPickupOtp } = await import('../actions/order-actions')
        const result = await verifyPickupOtp(order.id, otp)

        setLoadingAction(null)

        if (result.error) {
            setVerifyError(result.error)
            toast.error(result.error)
        } else {
            toast.success('OTP Verified! Order handover complete.')
            setShowVerifyDialog(false)
            setOtp('')
            router.refresh()
        }
    }

    const handleCancelOrder = async () => {
        const reason = cancelReason === 'Other' ? customReason : cancelReason
        if (!reason.trim()) {
            toast.error('Please select or enter a cancellation reason')
            return
        }

        setLoadingAction('cancel')
        const result = await cancelOrder(order.id, reason)
        setLoadingAction(null)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Order cancelled')
            setShowCancelDialog(false)
            setCancelReason('')
            setCustomReason('')
            router.refresh()
        }
    }

    const openCancelDialog = () => {
        setCancelReason('')
        setCustomReason('')
        setShowCancelDialog(true)
    }

    const handleVerifyReturn = async () => {
        if (returnOtp.length !== 6) {
            setReturnError('Please enter a valid 6-digit OTP')
            return
        }

        setReturnError('')
        setLoadingAction('returnVerify')
        const result = await verifyReturnOtp(order.id, returnOtp)
        setLoadingAction(null)

        if (result.error) {
            setReturnError(result.error)
            toast.error(result.error)
        } else {
            toast.success('Return verified! Rider is now available.')
            setShowReturnDialog(false)
            setReturnOtp('')
            router.refresh()
        }
    }

    const handleMarkReturnCollected = async () => {
        setLoadingAction('returnCollect')
        const result = await markReturnCollected(order.id)
        setLoadingAction(null)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Return marked as collected. Rider is now available.')
            setShowReturnDialog(false)
            router.refresh()
        }
    }

    const openReturnDialog = () => {
        setReturnOtp('')
        setReturnError('')
        setShowReturnDialog(true)
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
            <Card data-testid="order-card" className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white/90 dark:bg-gray-900/80 shadow-sm transition hover:shadow-md">
                <CardHeader className="pb-3 pt-4 px-4 sm:px-5">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="font-mono font-bold text-lg sm:text-xl tracking-tight">{order.order_number}</div>
                                <Badge variant="outline" className={`border ${statusConfig.pill} text-[11px] font-semibold`}>
                                    {statusConfig.label}
                                </Badge>
                                {order.payment_method === 'cod' && (
                                    <Badge variant="secondary" className="text-[11px]">COD</Badge>
                                )}
                                {order.payment_status === 'paid' && (
                                    <Badge className="bg-emerald-600 text-[11px]">Paid</Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Clock className="h-3.5 w-3.5" />
                                {formatTime(order.created_at)}
                            </div>
                        </div>
                        {!['delivered', 'cancelled'].includes(order.status) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 rounded-full"
                                        disabled={isLoading}
                                    >
                                        <MoreHorizontal className="h-5 w-5" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem
                                        onClick={openCancelDialog}
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        Cancel Order
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-4 px-4 sm:px-5 pb-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-border/60 bg-background/60 p-3 sm:p-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-semibold truncate">{order.customer_name}</span>
                            </div>
                            {order.customer_phone && (
                                <a href={`tel:${order.customer_phone}`} className="flex items-center gap-2 text-sm text-primary hover:underline">
                                    <Phone className="h-4 w-4" />
                                    {order.customer_phone}
                                </a>
                            )}
                            {order.customer_address ? (
                                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                    <span className="line-clamp-2">{order.customer_address}</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-xs">
                                    <Store className="h-4 w-4 text-primary" />
                                    <span className="font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                        Pickup Order
                                    </span>
                                </div>
                            )}

                            {order.customer_address && order.rider && (
                                <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/70 dark:bg-blue-950/30 p-2.5 sm:p-3">
                                    <div className="flex items-center gap-2 text-xs sm:text-sm">
                                        <div className="h-7 w-7 rounded-full bg-blue-600/10 flex items-center justify-center">
                                            <Bike className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="leading-tight">
                                            <div className="text-blue-800 dark:text-blue-300 font-semibold">{order.rider.name}</div>
                                            <div className="text-[11px] text-blue-700/70 dark:text-blue-400/70">Assigned rider</div>
                                        </div>
                                    </div>
                                    {order.rider.phone ? (
                                        <a
                                            href={`tel:${order.rider.phone}`}
                                            className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 dark:border-blue-800 bg-white/70 dark:bg-gray-900 px-2.5 py-1 text-[11px] font-semibold text-blue-700 hover:bg-white"
                                        >
                                            <Phone className="h-3.5 w-3.5 text-blue-700 shrink-0" />
                                            Call
                                        </a>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-100 dark:border-blue-900/40 bg-white/60 dark:bg-gray-900/60 px-2.5 py-1 text-[11px] text-blue-700/60">
                                            <Phone className="h-3.5 w-3.5 text-blue-700/60 shrink-0" />
                                            No phone
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="rounded-xl border border-border/60 bg-background/60 p-3 sm:p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</span>
                                <span className="text-xl font-bold">₹{order.total_amount.toFixed(0)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Items</span>
                                <span>₹{order.items_total.toFixed(0)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Delivery</span>
                                <span>₹{order.delivery_fee.toFixed(0)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Tax</span>
                                <span>₹{order.tax_amount.toFixed(0)}</span>
                            </div>
                            <div className="pt-2 border-t text-xs flex items-center gap-2 text-muted-foreground">
                                <Banknote className="h-4 w-4" />
                                <span className="font-medium text-foreground">{paymentMethodLabel}</span>
                                <span className="text-muted-foreground">• {order.payment_status}</span>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-background/60 p-3 sm:p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <Package className="h-4 w-4" />
                            Items ({order.order_items?.length || 0})
                        </div>
                        <div className="mt-2 space-y-2">
                            {(order.order_items || []).map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                                    <span className="font-medium">₹{(item.price * item.quantity).toFixed(0)}</span>
                                </div>
                            ))}
                            {(!order.order_items || order.order_items.length === 0) && (
                                <p className="text-xs text-muted-foreground">No items data</p>
                            )}
                        </div>
                    </div>

                    {order.notes && (
                        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                            <span className="font-medium">Note: </span>{order.notes}
                        </div>
                    )}

                    {/* Progress Stepper */}
                    {(() => {
                        const isCancelled = order.status === 'cancelled'
                        const steps = ['pending', 'preparing', 'ready', 'out_for_delivery', 'delivered']

                        // For cancelled orders, determine what step it was cancelled at
                        const cancelledAtStep = isCancelled ? (order.cancelled_step || 'pending') : null
                        const cancelledAtIndex = cancelledAtStep ? steps.indexOf(cancelledAtStep) : -1

                        // Current step index - for non-cancelled orders
                        const currentStepIndex = isCancelled ? cancelledAtIndex : steps.indexOf(order.status)

                        const stepConfig = [
                            { key: 'pending', label: 'Placed', time: order.created_at },
                            { key: 'preparing', label: 'Prep', time: order.preparing_at || order.confirmed_at },
                            { key: 'ready', label: 'Ready', time: order.ready_at },
                            { key: 'out_for_delivery', label: 'Pickup', time: order.picked_up_at },
                            { key: 'delivered', label: 'Done', time: order.delivered_at },
                        ]

                        // For cancelled orders, filter steps to show only up to cancelled point + cancelled step
                        const displaySteps = isCancelled
                            ? [...stepConfig.slice(0, cancelledAtIndex + 1), { key: 'cancelled', label: 'Cancelled', time: order.cancelled_at }]
                            : stepConfig

                        return (
                            <div className="py-3 bg-gradient-to-r from-gray-50/50 via-white to-gray-50/50 dark:from-gray-900/50 dark:via-gray-800/30 dark:to-gray-900/50 rounded-lg">
                                {/* Stepper Container */}
                                <div className="relative px-4">
                                    {/* Track Line - Background */}
                                    <div className="absolute top-[11px] left-[10%] right-[10%] h-[2px] bg-gray-200 dark:bg-gray-700" />

                                    {/* Track Line - Progress */}
                                    <div
                                        className={`absolute top-[11px] left-[10%] h-[2px] transition-all duration-500 ease-out ${isCancelled
                                            ? 'bg-gradient-to-r from-primary via-primary to-red-500'
                                            : 'bg-gradient-to-r from-primary to-primary/80'
                                            }`}
                                        style={{
                                            width: `${(Math.min(displaySteps.length - 1, currentStepIndex + (isCancelled ? 1 : 0)) / (displaySteps.length - 1)) * 80}%`
                                        }}
                                    />

                                    {/* Steps Grid */}
                                    <div className={`grid relative`} style={{ gridTemplateColumns: `repeat(${displaySteps.length}, 1fr)` }}>
                                        {displaySteps.map((step, index) => {
                                            const isCancelledStep = step.key === 'cancelled'
                                            const isCompleted = isCancelledStep || index <= currentStepIndex
                                            const isCurrent = isCancelledStep || index === currentStepIndex
                                            const showTime = isCompleted && step.time

                                            return (
                                                <div key={step.key} className="flex flex-col items-center">
                                                    {/* Circle */}
                                                    <div className={`
                                                        relative z-10 flex items-center justify-center
                                                        w-6 h-6 rounded-full transition-all duration-300
                                                        ${isCancelledStep
                                                            ? 'bg-red-500 shadow-sm shadow-red-500/30'
                                                            : isCompleted
                                                                ? 'bg-primary shadow-sm shadow-primary/30'
                                                                : 'bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600'
                                                        }
                                                        ${isCurrent && !isCancelledStep ? 'ring-4 ring-primary/20 scale-110' : ''}
                                                        ${isCancelledStep ? 'ring-4 ring-red-500/20 scale-110' : ''}
                                                    `}>
                                                        {isCancelledStep ? (
                                                            <X className="w-3 h-3 text-white" />
                                                        ) : isCompleted ? (
                                                            <Check className="w-3 h-3 text-white" />
                                                        ) : null}
                                                    </div>

                                                    {/* Label */}
                                                    <span className={`
                                                        mt-2 text-[10px] font-semibold uppercase tracking-wider text-center
                                                        ${isCancelledStep
                                                            ? 'text-red-500'
                                                            : isCurrent
                                                                ? 'text-primary'
                                                                : isCompleted
                                                                    ? 'text-gray-600 dark:text-gray-400'
                                                                    : 'text-gray-400 dark:text-gray-500'
                                                        }
                                                    `}>
                                                        {step.label}
                                                    </span>

                                                    {/* Time - Fixed height container */}
                                                    <div className="h-4 flex items-center">
                                                        {showTime ? (
                                                            <span className={`text-[9px] font-medium ${isCancelledStep ? 'text-red-400' : 'text-gray-400 dark:text-gray-500'}`}>
                                                                {new Date(step.time as string).toLocaleTimeString('en-IN', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                    hour12: true
                                                                })}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[9px] text-transparent">--:--</span>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>
                        )
                    })()}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
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
                            <div className="grid grid-cols-2 gap-2 w-full">
                                <Button
                                    onClick={handleMarkReady}
                                    disabled={isLoading}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {loadingAction === 'ready' ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <ChefHat className="h-4 w-4 mr-2" />
                                    )}
                                    Mark Ready
                                </Button>
                                {/* Only show Assign Rider for delivery orders */}
                                {order.customer_address ? (
                                    <AssignRiderModal
                                        orderId={order.id}
                                        restaurantId={order.restaurant_id}
                                        currentRiderId={order.rider_id}
                                        currentRiderName={order.rider?.name}
                                    />
                                ) : (
                                    <Button
                                        onClick={openVerifyDialog}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        <Store className="h-4 w-4 mr-2" />
                                        Handover
                                    </Button>
                                )}
                            </div>
                        )}

                        {order.status === 'ready' && order.customer_address && (
                            <div className="w-full sm:w-auto">
                                <AssignRiderModal
                                    orderId={order.id}
                                    restaurantId={order.restaurant_id}
                                    currentRiderId={order.rider_id}
                                    currentRiderName={order.rider?.name}
                                />
                            </div>
                        )}

                        {order.status === 'ready' && !order.customer_address && (
                            <Button
                                onClick={openVerifyDialog}
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Store className="h-4 w-4 mr-2" />
                                Handover Order
                            </Button>
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
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="flex items-center justify-center gap-2 py-2 bg-red-50 rounded-lg text-red-700">
                                    <X className="h-4 w-4" />
                                    <span className="text-sm font-medium">Order cancelled</span>
                                </div>
                                {order.cancellation_reason && (
                                    <p className="text-xs text-center text-muted-foreground">
                                        Reason: {order.cancellation_reason}
                                    </p>
                                )}
                                {/* If cancelled while out for delivery and return not verified, show return OTP */}
                                {order.cancelled_step === 'out_for_delivery' && order.rider_id && !order.return_verified_at && (
                                    <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <RotateCcw className="h-4 w-4 text-amber-600" />
                                            <span className="font-semibold text-amber-700 dark:text-amber-400 text-sm">Awaiting Order Return</span>
                                        </div>
                                        <p className="text-xs text-amber-600 mb-3">Give this OTP to the rider when they return the order:</p>
                                        {order.return_otp && (
                                            <div className="text-center py-3 bg-white dark:bg-gray-900 rounded-lg border border-amber-200 dark:border-amber-700">
                                                <p className="text-3xl font-mono font-bold text-amber-700 tracking-widest">{order.return_otp}</p>
                                            </div>
                                        )}
                                        <p className="text-xs text-center text-muted-foreground mt-2">Rider will enter this OTP to confirm return</p>
                                    </div>
                                )}
                                {order.return_verified_at && (
                                    <div className="text-xs text-green-600 flex items-center justify-center gap-1">
                                        <CheckCircle2 className="h-3 w-3" />
                                        Return verified
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Cancel Order moved to dropdown in header */}
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

            {/* OTP Verification Modal */}
            <AlertDialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Handover Order {order.order_number}</AlertDialogTitle>
                        <AlertDialogDescription>
                            Ask the customer for the Pickup OTP to complete the order.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="py-4 space-y-4">
                        {/* Payment Status Section */}
                        {order.payment_method === 'cod' && order.payment_status === 'pending' ? (
                            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-6 w-6 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600">
                                        <Banknote className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="font-semibold text-amber-700 dark:text-amber-400">Collect Cash</span>
                                </div>
                                <div className="text-2xl font-bold text-amber-900 dark:text-amber-200 pl-1">
                                    ₹{order.total_amount.toFixed(0)}
                                </div>

                                <div className="mt-3 flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="confirm-cash"
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        checked={isCashCollected}
                                        onChange={(e) => {
                                            setIsCashCollected(e.target.checked)
                                            if (e.target.checked) setVerifyError('')
                                        }}
                                    />
                                    <label htmlFor="confirm-cash" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none">
                                        I have collected the cash
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="font-semibold text-green-700 dark:text-green-400">Payment Verified</p>
                                    <p className="text-xs text-green-600/80 dark:text-green-500/80">
                                        {order.payment_method === 'cod' && order.payment_status === 'paid' ? 'Paid via Cash' : `Paid via ${order.payment_method.toUpperCase()}`}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 pt-4">
                            <p className="text-sm font-medium text-center text-muted-foreground">Enter 6-digit Customer OTP</p>
                            <div className="flex justify-center gap-2">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <input
                                        key={index}
                                        id={`otp-input-${index}`}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={otp[index] || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (!/^\d*$/.test(val)) return;

                                            const newOtp = otp.split('');
                                            newOtp[index] = val;
                                            const newOtpStr = newOtp.join('').slice(0, 6);
                                            setOtp(newOtpStr);
                                            setVerifyError('');

                                            if (val && index < 5) {
                                                document.getElementById(`otp-input-${index + 1}`)?.focus();
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace' && !otp[index] && index > 0) {
                                                document.getElementById(`otp-input-${index - 1}`)?.focus();
                                            }
                                        }}
                                        className="h-12 w-10 text-center text-xl font-bold rounded-lg border border-input bg-background/50 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm"
                                        autoComplete="off"
                                    />
                                ))}
                            </div>

                            {verifyError && (
                                <p className="text-sm text-red-500 font-medium text-center animate-in fade-in slide-in-from-top-1 bg-red-50 dark:bg-red-950/20 py-2 rounded-md">
                                    {verifyError}
                                </p>
                            )}
                        </div>
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loadingAction === 'verify' as any}>Cancel</AlertDialogCancel>
                        <Button
                            onClick={handleVerifyOtp}
                            disabled={
                                (loadingAction === 'verify' as any) ||
                                otp.length !== 6 ||
                                (order.payment_method === 'cod' && order.payment_status === 'pending' && !isCashCollected)
                            }
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {(loadingAction === 'verify' as any) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verify & Complete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cancel Order Dialog */}
            <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Order {order.order_number}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Select a reason for cancellation. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="py-4 space-y-3">
                        {CANCELLATION_REASONS.map((reason) => (
                            <label
                                key={reason}
                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${cancelReason === reason
                                    ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="cancel-reason"
                                    value={reason}
                                    checked={cancelReason === reason}
                                    onChange={(e) => setCancelReason(e.target.value)}
                                    className="h-4 w-4 text-red-500 focus:ring-red-500"
                                />
                                <span className="text-sm font-medium">{reason}</span>
                            </label>
                        ))}

                        {cancelReason === 'Other' && (
                            <input
                                type="text"
                                placeholder="Specify reason..."
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                            />
                        )}
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loadingAction === 'cancel'}>Back</AlertDialogCancel>
                        <Button
                            onClick={handleCancelOrder}
                            disabled={loadingAction === 'cancel' || !cancelReason || (cancelReason === 'Other' && !customReason.trim())}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {loadingAction === 'cancel' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Cancel Order
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Return OTP Verification Dialog */}
            <AlertDialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Verify Order Return</AlertDialogTitle>
                        <AlertDialogDescription>
                            Enter the 6-digit OTP from the rider to confirm order return.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="py-4 space-y-4">
                        {order.return_otp && (
                            <div className="text-center p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                                <p className="text-xs text-amber-600 mb-1">Return OTP (Share with rider)</p>
                                <p className="text-3xl font-mono font-bold text-amber-700 tracking-widest">{order.return_otp}</p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <p className="text-sm font-medium text-center text-muted-foreground">Enter OTP from Rider</p>
                            <div className="flex justify-center gap-2">
                                {Array.from({ length: 6 }).map((_, index) => (
                                    <input
                                        key={index}
                                        id={`return-otp-input-${index}`}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={returnOtp[index] || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (!/^\d*$/.test(val)) return;

                                            const newOtp = returnOtp.split('');
                                            newOtp[index] = val;
                                            const newOtpStr = newOtp.join('').slice(0, 6);
                                            setReturnOtp(newOtpStr);
                                            setReturnError('');

                                            if (val && index < 5) {
                                                document.getElementById(`return-otp-input-${index + 1}`)?.focus();
                                            }
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Backspace' && !returnOtp[index] && index > 0) {
                                                document.getElementById(`return-otp-input-${index - 1}`)?.focus();
                                            }
                                        }}
                                        className="h-12 w-10 text-center text-xl font-bold rounded-lg border border-input bg-background/50 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 transition-all shadow-sm"
                                        autoComplete="off"
                                    />
                                ))}
                            </div>

                            {returnError && (
                                <p className="text-sm text-red-500 font-medium text-center bg-red-50 dark:bg-red-950/20 py-2 rounded-md">
                                    {returnError}
                                </p>
                            )}
                        </div>
                    </div>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loadingAction === 'returnVerify'}>Cancel</AlertDialogCancel>
                        <Button
                            onClick={handleVerifyReturn}
                            disabled={loadingAction === 'returnVerify' || returnOtp.length !== 6}
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            {loadingAction === 'returnVerify' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Verify Return
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
