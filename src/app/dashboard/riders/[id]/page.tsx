import type React from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RiderOrdersFilter } from '@/components/dashboard/riders/rider-orders-filter'
import {
    ArrowLeft,
    Bike,
    Car,
    Phone,
    Mail,
    Wallet,
    ArrowDownCircle,
    ArrowUpCircle,
    CheckCircle2,
    Clock3,
    LucideIcon,
    UserRound,
    NotebookTabs,
    Banknote,
    PackageCheck,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
    searchParams: Promise<{ date?: string; q?: string }>
}

function formatMoney(value: number | null | undefined) {
    return `₹${Number(value || 0).toFixed(2)}`
}

function formatDateTime(value: string | null | undefined) {
    if (!value) return '—'
    return new Date(value).toLocaleString('en-IN')
}

function getTodayDateString() {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function getStatusBadge(status: string, isActive: boolean) {
    const base = 'text-white'
    if (!isActive) return <Badge className={`${base} bg-gray-500`}>Inactive</Badge>
    if (status === 'online') return <Badge className={`${base} bg-green-600`}>Online</Badge>
    if (status === 'on_delivery') return <Badge className={`${base} bg-blue-600`}>Pickup Phase</Badge>
    if (status === 'delivering') return <Badge className={`${base} bg-indigo-600`}>Delivering</Badge>
    if (status === 'returning') return <Badge className={`${base} bg-amber-600`}>Returning</Badge>
    return <Badge className={`${base} bg-gray-500`}>Offline</Badge>
}

function Section({
    icon: Icon,
    title,
    subtitle,
    children,
    action,
    glow = 'rgba(117, 242, 190, 0.3)',
}: {
    icon: LucideIcon
    title: string
    subtitle?: string
    children: React.ReactNode
    action?: React.ReactNode
    glow?: string
}) {
    return (
        <section className="relative overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-4 sm:px-6">
                <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-primary" />
                    <div>
                        <h3 className="font-semibold text-foreground">{title}</h3>
                        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
                    </div>
                </div>
                {action && <div>{action}</div>}
            </div>
            <div className="relative px-4 py-5 sm:px-6">{children}</div>
            <div
                className="absolute bottom-0 left-1/2 h-10 w-[70%] -translate-x-1/2 blur-2xl"
                style={{ background: glow }}
            />
        </section>
    )
}

function StatCard({
    label,
    value,
    icon: Icon,
    glow,
}: {
    label: string
    value: string
    icon: LucideIcon
    glow: string
}) {
    return (
        <div className="relative overflow-hidden rounded-lg border border-border/70 bg-background/70 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <Icon className="h-4 w-4" />
                {label}
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
            <div
                className="absolute bottom-0 left-1/2 h-10 w-[70%] -translate-x-1/2 blur-2xl"
                style={{ background: glow }}
            />
        </div>
    )
}

export default async function RiderDetailPage({ params, searchParams }: PageProps) {
    const { id } = await params
    const query = await searchParams
    const todayDate = getTodayDateString()
    const validDate = query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : null
    const selectedDate = validDate && validDate <= todayDate ? validDate : todayDate
    const searchTerm = (query.q || '').trim()

    const rangeStart = new Date(`${selectedDate}T00:00:00`)
    const rangeEnd = new Date(rangeStart)
    rangeEnd.setDate(rangeEnd.getDate() + 1)

    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!restaurant) redirect('/onboarding')

    const { data: rider } = await supabase
        .from('riders')
        .select(`
            id,
            name,
            email,
            phone,
            vehicle_type,
            vehicle_number,
            status,
            is_active,
            cash_in_hand,
            cash_collected_total,
            cash_deposited_total,
            delivered_count,
            created_at
        `)
        .eq('id', id)
        .eq('restaurant_id', restaurant.id)
        .single()

    if (!rider) notFound()

    const { data: cashLedger } = await supabase
        .from('rider_cash_ledger')
        .select(`
            id,
            type,
            amount,
            note,
            created_at,
            order:orders(
                id,
                order_number,
                customer_name,
                customer_address
            )
        `)
        .eq('rider_id', rider.id)
        .order('created_at', { ascending: false })
        .limit(200)

    const { data: depositRequests } = await supabase
        .from('rider_cash_deposit_requests')
        .select(`
            id,
            amount,
            status,
            note,
            requested_at,
            decided_at
        `)
        .eq('rider_id', rider.id)
        .order('created_at', { ascending: false })
        .limit(200)

    let deliveredOrdersQuery = supabase
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
            delivered_at,
            created_at
        `)
        .eq('rider_id', rider.id)
        .eq('status', 'delivered')
        .gte('delivered_at', rangeStart.toISOString())
        .lt('delivered_at', rangeEnd.toISOString())
        .order('delivered_at', { ascending: false })
        .limit(300)

    if (searchTerm) {
        const safeTerm = searchTerm.replace(/[%_,]/g, ' ').trim()
        if (safeTerm) {
            deliveredOrdersQuery = deliveredOrdersQuery.or(
                `order_number.ilike.%${safeTerm}%,customer_name.ilike.%${safeTerm}%,customer_phone.ilike.%${safeTerm}%,customer_address.ilike.%${safeTerm}%`
            )
        }
    }

    const { data: deliveredOrders } = await deliveredOrdersQuery

    const collectEntries = (cashLedger || []).filter((entry) => entry.type === 'collect')
    const depositEntries = (cashLedger || []).filter((entry) => entry.type === 'deposit')
    const pendingRequests = (depositRequests || []).filter((req) => req.status === 'pending')
    const approvedRequests = (depositRequests || []).filter((req) => req.status === 'approved')

    const vehicleIcon =
        rider.vehicle_type === 'car'
            ? <Car className="h-4 w-4 text-muted-foreground" />
            : <Bike className="h-4 w-4 text-muted-foreground" />

    return (
        <div className="space-y-5 pb-8">
            <div className="flex items-center justify-between gap-3">
                <Button variant="ghost" asChild className="px-0 hover:bg-transparent">
                    <Link href="/dashboard/riders">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Riders
                    </Link>
                </Button>
                <div>{getStatusBadge(rider.status, rider.is_active)}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                <StatCard label="Cash in Hand" value={formatMoney(rider.cash_in_hand)} icon={Banknote} glow="rgba(16, 185, 129, 0.25)" />
                <StatCard label="Total Collected" value={formatMoney(rider.cash_collected_total)} icon={ArrowDownCircle} glow="rgba(59, 130, 246, 0.22)" />
                <StatCard label="Total Deposited" value={formatMoney(rider.cash_deposited_total)} icon={ArrowUpCircle} glow="rgba(245, 158, 11, 0.24)" />
                <StatCard label="Delivered Orders" value={`${Number(rider.delivered_count || 0)}`} icon={PackageCheck} glow="rgba(236, 72, 153, 0.2)" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <Section icon={UserRound} title="Rider Info" glow="rgba(59, 130, 246, 0.2)">
                    <div className="grid gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-4 w-4" />
                            <span>{rider.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Phone className="h-4 w-4" />
                            <span>{rider.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            {vehicleIcon}
                            <span className="capitalize">{rider.vehicle_type}</span>
                            {rider.vehicle_number && (
                                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                                    {rider.vehicle_number}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock3 className="h-4 w-4" />
                            <span>Joined: {formatDateTime(rider.created_at)}</span>
                        </div>
                    </div>
                </Section>

                <Section icon={NotebookTabs} title="Deposit Requests Summary" glow="rgba(245, 158, 11, 0.2)">
                    <div className="grid grid-cols-3 gap-3">
                        <div className="rounded-md border border-border/70 bg-background/70 p-3 text-center">
                            <p className="text-xs text-muted-foreground">Pending</p>
                            <p className="mt-1 text-xl font-semibold">{pendingRequests.length}</p>
                        </div>
                        <div className="rounded-md border border-border/70 bg-background/70 p-3 text-center">
                            <p className="text-xs text-muted-foreground">Approved</p>
                            <p className="mt-1 text-xl font-semibold">{approvedRequests.length}</p>
                        </div>
                        <div className="rounded-md border border-border/70 bg-background/70 p-3 text-center">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="mt-1 text-xl font-semibold">{(depositRequests || []).length}</p>
                        </div>
                    </div>
                </Section>
            </div>

            <Section
                icon={PackageCheck}
                title="Delivered Orders"
                subtitle={`Showing ${deliveredOrders?.length || 0} orders for ${selectedDate}${searchTerm ? ` • search: "${searchTerm}"` : ''}`}
                glow="rgba(168, 85, 247, 0.18)"
            >
                <div className="space-y-4">
                    <RiderOrdersFilter
                        riderId={rider.id}
                        riderName={rider.name}
                        selectedDate={selectedDate}
                        todayDate={todayDate}
                        initialQuery={searchTerm}
                    />

                    {!deliveredOrders || deliveredOrders.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No delivered orders found for this filter.</p>
                    ) : (
                        <div className="space-y-2">
                            {deliveredOrders.map((order) => (
                                <div key={order.id} className="rounded-lg border border-border/70 bg-background/70 p-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-medium">{order.order_number}</p>
                                            <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {order.customer_phone || 'No phone'} • {order.customer_address || 'No address'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{formatMoney(order.total_amount)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {order.payment_method === 'cod'
                                                    ? 'COD'
                                                    : order.payment_status === 'paid'
                                                        ? 'Paid Online'
                                                        : 'Online Pending'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                                        Delivered: {formatDateTime(order.delivered_at)}
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        Created: {formatDateTime(order.created_at)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Section>

            <Section
                icon={Wallet}
                title="Cash Ledger"
                subtitle={cashLedger && cashLedger.length > 0 ? `${collectEntries.length} collections • ${depositEntries.length} deposits` : undefined}
                glow="rgba(16, 185, 129, 0.2)"
            >
                {!cashLedger || cashLedger.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No cash ledger entries.</p>
                ) : (
                    <div className="space-y-2">
                        {cashLedger.map((entry) => {
                            const relatedOrder = Array.isArray(entry.order) ? entry.order[0] : entry.order
                            return (
                                <div key={entry.id} className="rounded-lg border border-border/70 bg-background/70 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            {entry.type === 'collect' ? (
                                                <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                                            ) : (
                                                <ArrowUpCircle className="h-4 w-4 text-blue-600" />
                                            )}
                                            <span className="font-medium">{entry.type === 'collect' ? 'Collected' : 'Deposited'}</span>
                                            {relatedOrder?.order_number && (
                                                <span className="text-muted-foreground">• {relatedOrder.order_number}</span>
                                            )}
                                        </div>
                                        <span className={entry.type === 'collect' ? 'font-semibold text-emerald-700' : 'font-semibold text-blue-700'}>
                                            {formatMoney(entry.amount)}
                                        </span>
                                    </div>
                                    <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(entry.created_at)}</div>
                                    {relatedOrder && (
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            {relatedOrder.customer_name} • {relatedOrder.customer_address || 'No address'}
                                        </div>
                                    )}
                                    {entry.note && <div className="mt-1 text-xs text-muted-foreground">Note: {entry.note}</div>}
                                </div>
                            )
                        })}
                    </div>
                )}
            </Section>

            <Section icon={NotebookTabs} title="Deposit Request History" glow="rgba(236, 72, 153, 0.16)">
                {!depositRequests || depositRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No deposit requests.</p>
                ) : (
                    <div className="space-y-2">
                        {depositRequests.map((request) => (
                            <div key={request.id} className="rounded-lg border border-border/70 bg-background/70 p-3">
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Wallet className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{formatMoney(request.amount)}</span>
                                    </div>
                                    <Badge variant="secondary" className="capitalize">
                                        {request.status}
                                    </Badge>
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    Requested: {formatDateTime(request.requested_at)}
                                </div>
                                {request.decided_at && (
                                    <div className="mt-1 text-xs text-muted-foreground">
                                        Updated: {formatDateTime(request.decided_at)}
                                    </div>
                                )}
                                {request.note && <div className="mt-1 text-xs text-muted-foreground">Note: {request.note}</div>}
                            </div>
                        ))}
                    </div>
                )}
            </Section>
        </div>
    )
}
