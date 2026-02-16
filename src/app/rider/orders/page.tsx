import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserDropdown } from '@/components/user-dropdown'
import { RealtimeRiderOrders } from '@/components/rider/realtime-rider-orders'
import { OrdersDateNav } from '@/components/rider/orders-date-nav'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, MapPin } from 'lucide-react'

export const dynamic = 'force-dynamic'

function getStatusLabel(status: string) {
    switch (status) {
        case 'preparing':
            return 'Preparing'
        case 'ready':
            return 'Ready'
        case 'out_for_delivery':
            return 'Out for delivery'
        case 'delivered':
            return 'Delivered'
        case 'cancelled':
            return 'Cancelled'
        default:
            return status
    }
}

function getPaymentLabel(paymentMethod: string, paymentStatus: string) {
    if (paymentMethod === 'cod') return 'COD'
    return paymentStatus === 'paid' ? 'Paid Online' : 'Online Pending'
}

function getTodayDateString() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

interface PageProps {
    searchParams: Promise<{ date?: string }>
}

export default async function RiderOrdersPage({ searchParams }: PageProps) {
    const { date } = await searchParams
    const todayDate = getTodayDateString()
    const validDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null
    const selectedDate = validDate && validDate <= todayDate ? validDate : todayDate
    const rangeStart = new Date(`${selectedDate}T00:00:00`)
    const rangeEnd = new Date(rangeStart)
    rangeEnd.setDate(rangeEnd.getDate() + 1)

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: rider } = await supabase
        .from('riders')
        .select('id, name')
        .eq('email', user.email)
        .single()

    if (!rider) redirect('/rider')

    const { data: orders } = await supabase
        .from('orders')
        .select(`
            id,
            order_number,
            customer_name,
            customer_phone,
            customer_address,
            total_amount,
            payment_method,
            payment_status,
            status,
            created_at
        `)
        .eq('rider_id', rider.id)
        .in('status', ['preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'])
        .gte('created_at', rangeStart.toISOString())
        .lt('created_at', rangeEnd.toISOString())
        .order('created_at', { ascending: false })
        .limit(100)

    return (
        <RealtimeRiderOrders riderId={rider.id}>
            <div className="min-h-screen bg-muted/30 pb-24">
                <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
                    <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
                        <div>
                            <h1 className="text-lg font-bold">Orders</h1>
                            <p className="text-sm text-muted-foreground">Date-wise rider orders</p>
                        </div>
                        <UserDropdown
                            user={{
                                email: user.email,
                                name: rider.name || user.user_metadata?.full_name,
                                avatarUrl: user.user_metadata?.avatar_url,
                            }}
                        />
                    </div>
                </header>

                <main className="mx-auto max-w-lg space-y-3 px-4 py-5">
                    <OrdersDateNav selectedDate={selectedDate} todayDate={todayDate} />

                    {!orders || orders.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-sm text-muted-foreground">
                                No orders found for this date.
                            </CardContent>
                        </Card>
                    ) : (
                        orders.map((order) => (
                            <Link key={order.id} href={`/rider/orders/${order.id}`} className="block">
                                <Card className="border-border/70 bg-background/80 transition-shadow hover:shadow-md">
                                    <CardContent className="space-y-3 pt-4">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-semibold">{order.order_number}</p>
                                                <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold">₹{Number(order.total_amount || 0).toFixed(2)}</p>
                                                <p className="text-xs text-muted-foreground">{getPaymentLabel(order.payment_method, order.payment_status || 'pending')}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">{getStatusLabel(order.status)}</Badge>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5" />
                                                {new Date(order.created_at).toLocaleString('en-IN')}
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                                            <span className="line-clamp-2">{order.customer_address || 'Address unavailable'}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    )}
                </main>
            </div>
        </RealtimeRiderOrders>
    )
}
