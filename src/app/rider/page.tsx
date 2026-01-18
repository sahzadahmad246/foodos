import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Package, MapPin, Phone, Navigation, Banknote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <h1 className="text-2xl font-bold mb-4">No Rider Access</h1>
                    <p className="text-muted-foreground mb-4">
                        You don't have rider access. Please contact your restaurant manager.
                    </p>
                    <Button asChild>
                        <Link href="/">Go Home</Link>
                    </Button>
                </div>
            </div>
        )
    }

    // Get assigned orders for this rider
    const { data: orders } = await supabase
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
            restaurant: restaurants(name, phone)
            `)
        .eq("rider_id", rider.id)
        .in("status", ["ready", "out_for_delivery"])
        .order("created_at", { ascending: false })

    return (
        <RealtimeRiderOrders riderId={rider.id}>
            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-10">
                    <div className="max-w-2xl mx-auto px-4 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-xl font-bold">Rider Dashboard</h1>
                                <p className="text-sm text-muted-foreground">
                                    {rider.restaurant?.name}
                                </p>
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

                <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
                    {/* Status Card */}
                    <div className="p-5 rounded-2xl border bg-card">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-lg">Your Status</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {rider.status === 'online' ? 'You are available for deliveries' :
                                        rider.status === 'on_delivery' ? 'You have an active delivery' :
                                            rider.status === 'returning' ? 'Return to restaurant to take new orders' :
                                                'Go online to receive orders'}
                                </p>
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

                    {/* Assigned Orders */}
                    <div>
                        <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Active Deliveries ({orders?.length || 0})
                        </h2>

                        {!orders || orders.length === 0 ? (
                            <div className="rounded-2xl border-2 border-dashed p-10 text-center">
                                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">
                                    {rider.status === 'offline'
                                        ? 'Go online to receive delivery orders'
                                        : 'No orders assigned yet. Check back soon!'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <div
                                        key={order.id}
                                        className={`p - 5 rounded - 2xl border bg - card ${order.payment_method === 'cod' ? 'border-2 border-amber-400 bg-amber-50/50 dark:bg-amber-950/20' : ''}`}
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-mono font-bold text-lg">{order.order_number}</p>
                                                    {order.payment_method === 'cod' && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-semibold">
                                                            <Banknote className="h-3 w-3" />
                                                            COD
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {order.customer_name}
                                                </p>
                                            </div>
                                            <Badge variant={order.status === 'out_for_delivery' ? 'default' : 'secondary'}>
                                                {order.status === 'out_for_delivery' ? 'On the way' : 'Ready for pickup'}
                                            </Badge>
                                        </div>

                                        {/* Customer Address */}
                                        <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 mb-4">
                                            <MapPin className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">Deliver to</p>
                                                <p className="text-sm text-muted-foreground mt-0.5">
                                                    {order.customer_address}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Contact & Actions */}
                                        <div className="flex items-center gap-3">
                                            {order.customer_phone && (
                                                <Button variant="outline" size="sm" asChild className="flex-1">
                                                    <a href={`tel: ${order.customer_phone}`}>
                                                        <Phone className="h-4 w-4 mr-2" />
                                                        Call Customer
                                                    </a>
                                                </Button>
                                            )}
                                            <Button size="sm" asChild className="flex-1">
                                                <a
                                                    href={order.customer_latitude && order.customer_longitude
                                                        ? `https://www.google.com/maps/dir/?api=1&destination=${order.customer_latitude},${order.customer_longitude}`
                                                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer_address || '')}`
                                                    }
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <Navigation className="h-4 w-4 mr-2" />
                                                    Navigate
                                                </a >
                                            </Button >
                                        </div >

                                        {/* Order Amount & Action */}
                                        < div className="mt-4 pt-4 border-t flex items-center justify-between" >
                                            <div>
                                                <p className="text-sm text-muted-foreground">Order Total</p>
                                                <p className="font-bold text-xl">₹{order.total_amount}</p>
                                            </div>
                                            <Button asChild>
                                                <Link href={`/rider/orders/${order.id}`}>
                                                    {order.status === 'ready' ? 'Pick Up Order' : 'Mark Delivered'}
                                                </Link>
                                            </Button>
                                        </div >
                                    </div >
                                ))}
                            </div >
                        )}
                    </div >
                </div >
            </div >
        </RealtimeRiderOrders >
    )
}
