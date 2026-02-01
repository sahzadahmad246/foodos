import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import {
    Package, MapPin, Phone, Navigation, Banknote,
    Bike, Clock, CheckCircle2, ChefHat, ChevronRight, XCircle, RotateCcw
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { RiderStatusToggle } from "@/components/rider/status-toggle"
import { RealtimeRiderOrders } from "@/components/rider/realtime-rider-orders"
import { RiderReturnCard } from "@/components/rider/return-card"
import { UserDropdown } from "@/components/user-dropdown"

export const dynamic = "force-dynamic"

export default async function RiderDashboardPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    // Get rider record by email
    const { data: rider } = await supabase
        .from("riders")
        .select(`
            *,
            restaurant:restaurants(id, name, latitude, longitude, address_line1)
        `)
        .eq("email", user.email)
        .single()

    if (!rider) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                        <Bike className="h-10 w-10 text-gray-500 dark:text-gray-400" />
                    </div>
                    <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">No Rider Access</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        You don't have rider access. Please contact your restaurant manager.
                    </p>
                    <Button asChild size="lg" className="rounded-full px-8">
                        <Link href="/">Go Home</Link>
                    </Button>
                </div>
            </div>
        )
    }

    // Get assigned orders for this rider (including cancelled orders needing return)
    const { data: activeOrders } = await supabase
        .from("orders")
        .select(`
            id,
            order_number,
            customer_name,
            customer_phone,
            customer_address,
            customer_latitude,
            customer_longitude,
            total_amount,
            payment_method,
            status,
            created_at,
            cancellation_reason,
            return_verified_at,
            restaurant: restaurants(name, phone)
            `)
        .eq("rider_id", rider.id)
        .in("status", ["preparing", "ready", "out_for_delivery"])
        .order("created_at", { ascending: false })

    // Also get cancelled orders that need to be returned (return not verified)
    const { data: cancelledOrders } = await supabase
        .from("orders")
        .select(`
            id,
            order_number,
            customer_name,
            customer_phone,
            customer_address,
            customer_latitude,
            customer_longitude,
            total_amount,
            payment_method,
            status,
            created_at,
            cancellation_reason,
            return_verified_at,
            restaurant: restaurants(name, phone)
            `)
        .eq("rider_id", rider.id)
        .eq("status", "cancelled")
        .is("return_verified_at", null)
        .order("created_at", { ascending: false })

    // Combine orders - cancelled orders first (more urgent)
    const orders = [...(cancelledOrders || []), ...(activeOrders || [])]

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'online':
                return {
                    gradient: 'from-emerald-500 to-green-600',
                    bgLight: 'bg-emerald-50 dark:bg-emerald-950/30',
                    borderColor: 'border-emerald-200 dark:border-emerald-800',
                    textColor: 'text-emerald-700 dark:text-emerald-400',
                    dot: 'bg-emerald-500',
                    message: 'You are available for deliveries'
                }
            case 'on_delivery':
                return {
                    gradient: 'from-blue-500 to-indigo-600',
                    bgLight: 'bg-blue-50 dark:bg-blue-950/30',
                    borderColor: 'border-blue-200 dark:border-blue-800',
                    textColor: 'text-blue-700 dark:text-blue-400',
                    dot: 'bg-blue-500',
                    message: 'You have an active delivery'
                }
            case 'returning':
                return {
                    gradient: 'from-amber-500 to-orange-600',
                    bgLight: 'bg-amber-50 dark:bg-amber-950/30',
                    borderColor: 'border-amber-200 dark:border-amber-800',
                    textColor: 'text-amber-700 dark:text-amber-400',
                    dot: 'bg-amber-500',
                    message: 'Return to restaurant'
                }
            default:
                return {
                    gradient: 'from-gray-400 to-gray-500',
                    bgLight: 'bg-gray-100 dark:bg-gray-800/50',
                    borderColor: 'border-gray-200 dark:border-gray-700',
                    textColor: 'text-gray-600 dark:text-gray-400',
                    dot: 'bg-gray-400',
                    message: 'Go online to receive orders'
                }
        }
    }

    const statusConfig = getStatusConfig(rider.status)

    const getOrderStatusLabel = (status: string) => {
        switch (status) {
            case 'preparing': return 'Preparing'
            case 'ready': return 'Ready for pickup'
            case 'out_for_delivery': return 'On the way'
            case 'cancelled': return 'Return Required'
            default: return status
        }
    }

    return (
        <RealtimeRiderOrders riderId={rider.id}>
            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
                {/* Header with Glassmorphism */}
                <header className="sticky top-0 z-50 border-b border-white/20 dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                    <div className="max-w-lg mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${statusConfig.gradient} flex items-center justify-center shadow-lg`}>
                                    <Bike className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {rider.name || 'Rider'}
                                    </h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {rider.restaurant?.name}
                                    </p>
                                </div>
                            </div>
                            <UserDropdown
                                user={{
                                    email: user.email,
                                    name: rider.name || user.user_metadata?.full_name,
                                    avatarUrl: user.user_metadata?.avatar_url,
                                }}
                            />
                        </div>
                    </div>
                </header>

                <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
                    {/* Status Card - Modern Design */}
                    <div className={`relative overflow-hidden rounded-3xl border-2 ${statusConfig.borderColor} ${statusConfig.bgLight} p-6`}>
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <div className={`w-4 h-4 rounded-full ${statusConfig.dot} animate-pulse`} />
                                    <div className={`absolute inset-0 w-4 h-4 rounded-full ${statusConfig.dot} animate-ping opacity-75`} />
                                </div>
                                <div>
                                    <p className="font-bold text-lg text-gray-900 dark:text-white capitalize">
                                        {rider.status === 'on_delivery' ? 'On Delivery' : rider.status}
                                    </p>
                                    <p className={`text-sm ${statusConfig.textColor}`}>
                                        {statusConfig.message}
                                    </p>
                                </div>
                            </div>
                            <RiderStatusToggle
                                riderId={rider.id}
                                currentStatus={rider.status}
                            />
                        </div>
                    </div>

                    {/* Returning Card */}
                    {rider.status === 'returning' && (
                        <RiderReturnCard riderId={rider.id} restaurant={rider.restaurant} />
                    )}

                    {/* Active Deliveries Section */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Package className="h-5 w-5 text-white" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg text-gray-900 dark:text-white">
                                    Active Deliveries
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {orders?.length || 0} order{(orders?.length || 0) !== 1 ? 's' : ''} pending
                                </p>
                            </div>
                        </div>

                        {!orders || orders.length === 0 ? (
                            <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                                <div className="p-10 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                        <Package className="h-8 w-8 text-gray-400 dark:text-gray-500" />
                                    </div>
                                    <p className="text-gray-900 dark:text-white font-medium">
                                        {rider.status === 'offline'
                                            ? 'Go online to receive orders'
                                            : 'Waiting for orders'}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        {rider.status === 'offline'
                                            ? 'Toggle your status above'
                                            : 'New orders will appear here'}
                                    </p>
                                </div>
                                {/* Animated searching bar when online */}
                                {rider.status !== 'offline' && (
                                    <>
                                        <div className="h-1 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                            <div
                                                className="h-full w-1/3 bg-gray-900 dark:bg-white"
                                                style={{
                                                    animation: 'shimmer 1.5s ease-in-out infinite'
                                                }}
                                            />
                                        </div>
                                        <style>{`
                                            @keyframes shimmer {
                                                0% { transform: translateX(-100%); }
                                                100% { transform: translateX(400%); }
                                            }
                                        `}</style>
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => {
                                    const isPreparing = order.status === 'preparing'
                                    const isReady = order.status === 'ready'
                                    const isOnTheWay = order.status === 'out_for_delivery'
                                    const isCancelled = order.status === 'cancelled'
                                    const isCOD = order.payment_method === 'cod'

                                    return (
                                        <Link
                                            key={order.id}
                                            href={isPreparing ? '#' : `/rider/orders/${order.id}`}
                                            className={`block ${isPreparing ? 'cursor-not-allowed' : ''}`}
                                        >
                                            <div
                                                className={`
                                                    relative overflow-hidden rounded-2xl border bg-white dark:bg-gray-900 
                                                    shadow-sm hover:shadow-md transition-all
                                                    ${isPreparing ? 'opacity-70' : 'active:scale-[0.99]'}
                                                    ${isCancelled
                                                        ? 'border-red-300 dark:border-red-700'
                                                        : isCOD
                                                            ? 'border-amber-300 dark:border-amber-700'
                                                            : 'border-gray-200 dark:border-gray-800'}
                                                `}
                                            >
                                                <div className={`
                                                    px-4 py-2 flex items-center justify-between text-sm font-medium
                                                    ${isCancelled
                                                        ? 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400'
                                                        : isPreparing
                                                            ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                                                            : isReady
                                                                ? 'bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                                                                : 'bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400'
                                                    }
                                                `}>
                                                    <div className="flex items-center gap-2">
                                                        {isCancelled ? (
                                                            <RotateCcw className="h-4 w-4" />
                                                        ) : isPreparing ? (
                                                            <ChefHat className="h-4 w-4" />
                                                        ) : isReady ? (
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        ) : (
                                                            <Bike className="h-4 w-4" />
                                                        )}
                                                        {getOrderStatusLabel(order.status)}
                                                    </div>
                                                    {!isPreparing && (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </div>

                                                <div className="p-4">
                                                    {/* Order Header */}
                                                    <div className="flex items-start justify-between mb-3">
                                                        <div>
                                                            <p className="font-mono font-bold text-lg text-gray-900 dark:text-white">
                                                                {order.order_number}
                                                            </p>
                                                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                                                <Clock className="h-3.5 w-3.5" />
                                                                {new Date(order.created_at).toLocaleTimeString('en-IN', {
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xl font-bold text-gray-900 dark:text-white">
                                                                ₹{order.total_amount}
                                                            </p>
                                                            {isCancelled ? (
                                                                <p className="text-xs font-semibold text-red-600 dark:text-red-400">
                                                                    Cancelled
                                                                </p>
                                                            ) : isCOD && (
                                                                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                                                    Collect Cash
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Customer & Address */}
                                                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                                                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {order.customer_name}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                                                                {order.customer_address}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* COD Collection Highlight - hide for cancelled */}
                                                    {isCOD && !isCancelled && (
                                                        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                                                            <Banknote className="h-4 w-4 text-amber-600" />
                                                            <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                                                                Collect ₹{order.total_amount}
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* Return to restaurant message for cancelled */}
                                                    {isCancelled && (
                                                        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                                                            <RotateCcw className="h-4 w-4 text-red-600" />
                                                            <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                                                                Return to restaurant
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </RealtimeRiderOrders>
    )
}
