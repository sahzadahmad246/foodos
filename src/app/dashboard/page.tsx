import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, UtensilsCrossed, DollarSign, Users, Timer, Target, TrendingUp, Activity } from 'lucide-react'
import { ProfileCompletionCard } from '@/components/dashboard/profile-completion-card'
import { calculateProfileCompletion } from '@/lib/profile-completion'
import Link from 'next/link'
import type { ReactNode } from 'react'

function DashboardSection({
    title,
    description,
    children,
}: {
    title: string
    description?: string
    children: ReactNode
}) {
    return (
        <section className="relative overflow-hidden rounded-lg border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <div className="border-b border-border bg-muted/40 px-4 py-4 sm:px-6">
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
            </div>
            <div className="relative px-4 py-5 sm:px-6">
                {children}
            </div>
            <div
                className="absolute bottom-0 left-1/2 h-10 w-[70%] -translate-x-1/2 blur-2xl"
                style={{ background: 'rgba(117, 242, 190, 0.25)' }}
            />
        </section>
    )
}

interface DashboardPageProps {
    searchParams?: Promise<{ range?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const params = searchParams ? await searchParams : {}
    const selectedRange = params?.range === '7d' || params?.range === '30d' ? params.range : 'today'

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*, restaurant_settings(*)')
        .eq('owner_id', user?.id)
        .single()

    if (!restaurant) return null

    const settingsRelation = (restaurant as any).restaurant_settings
    const settings = Array.isArray(settingsRelation)
        ? (settingsRelation[0] ?? null)
        : (settingsRelation ?? null)
    const { percentage, missing } = calculateProfileCompletion(restaurant, settings)

    const now = new Date()
    const dayStart = new Date(now)
    dayStart.setHours(0, 0, 0, 0)

    const last30Start = new Date(now)
    last30Start.setDate(last30Start.getDate() - 29)
    last30Start.setHours(0, 0, 0, 0)

    const last7Start = new Date(now)
    last7Start.setDate(last7Start.getDate() - 6)
    last7Start.setHours(0, 0, 0, 0)

    const rangeStart = selectedRange === '30d'
        ? last30Start
        : selectedRange === '7d'
            ? last7Start
            : dayStart
    const rangeLabel = selectedRange === '30d' ? 'Last 30 Days' : selectedRange === '7d' ? 'Last 7 Days' : 'Today'

    const [{ data: ordersRaw }, { count: menuItemsCount }, { count: activeRidersCount }] = await Promise.all([
        supabase
            .from('orders')
            .select(`
                id,
                status,
                total_amount,
                payment_method,
                payment_status,
                created_at,
                confirmed_at,
                preparing_at,
                ready_at,
                delivered_at,
                cancelled_at
            `)
            .eq('restaurant_id', restaurant.id)
            .gte('created_at', last30Start.toISOString())
            .order('created_at', { ascending: true }),
        supabase
            .from('menu_items')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', restaurant.id)
            .eq('is_available', true),
        supabase
            .from('riders')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', restaurant.id)
            .in('status', ['online', 'on_delivery', 'delivering', 'returning']),
    ])

    const orders = ordersRaw || []
    const periodOrders = orders.filter((order) => new Date(order.created_at) >= rangeStart)
    const deliveredInPeriod = periodOrders.filter((order) => order.status === 'delivered')
    const activeOrders = orders.filter((order) =>
        ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'].includes(order.status)
    )
    const acceptedInPeriod = periodOrders.filter((order) => !!(order.confirmed_at || order.preparing_at))
    const rejectedInPeriod = periodOrders.filter((order) => order.status === 'cancelled' && !order.confirmed_at && !order.preparing_at)
    const acceptedOrRejectedInPeriod = acceptedInPeriod.length + rejectedInPeriod.length
    const acceptanceRate = acceptedOrRejectedInPeriod > 0
        ? Math.round((acceptedInPeriod.length / acceptedOrRejectedInPeriod) * 100)
        : 0
    const avgOrderValue = deliveredInPeriod.length > 0
        ? deliveredInPeriod.reduce((sum, order) => sum + Number(order.total_amount || 0), 0) / deliveredInPeriod.length
        : 0
    const periodRevenue = deliveredInPeriod.reduce((sum, order) => sum + Number(order.total_amount || 0), 0)

    const prepDurations = periodOrders
        .map((order) => {
            const start = order.preparing_at || order.confirmed_at
            const end = order.ready_at
            if (!start || !end) return null
            const minutes = (new Date(end).getTime() - new Date(start).getTime()) / 60000
            return Number.isFinite(minutes) && minutes >= 0 ? minutes : null
        })
        .filter((value): value is number => value !== null)

    const avgActualPrepMins = prepDurations.length > 0
        ? prepDurations.reduce((sum, m) => sum + m, 0) / prepDurations.length
        : 0

    const periodOrderIds = periodOrders.map((order) => order.id)
    let avgExpectedPrepMins = 0
    let topItems: Array<{ name: string; qty: number; revenue: number }> = []

    if (periodOrderIds.length > 0) {
        const [{ data: todayItemsRaw }, { data: menuPrepRaw }] = await Promise.all([
            supabase
                .from('order_items')
                .select('order_id, menu_item_id, name, quantity, price')
                .in('order_id', periodOrderIds),
            supabase
                .from('menu_items')
                .select('id, preparation_time_mins')
                .eq('restaurant_id', restaurant.id),
        ])

        const todayItems = todayItemsRaw || []
        const menuPrep = new Map((menuPrepRaw || []).map((m) => [m.id, Number(m.preparation_time_mins || 20)]))
        const defaultPrep = Number(settings?.avg_prep_time_mins || 30)

        let prepWeightedSum = 0
        let prepQtySum = 0
        const topItemsMap = new Map<string, { qty: number; revenue: number }>()

        for (const item of todayItems) {
            const qty = Number(item.quantity || 0)
            if (qty <= 0) continue
            const prep = item.menu_item_id ? (menuPrep.get(item.menu_item_id) ?? defaultPrep) : defaultPrep
            prepWeightedSum += prep * qty
            prepQtySum += qty

            const name = item.name || 'Unnamed Item'
            const revenue = qty * Number(item.price || 0)
            const existing = topItemsMap.get(name) || { qty: 0, revenue: 0 }
            topItemsMap.set(name, { qty: existing.qty + qty, revenue: existing.revenue + revenue })
        }

        avgExpectedPrepMins = prepQtySum > 0 ? prepWeightedSum / prepQtySum : 0
        topItems = Array.from(topItemsMap.entries())
            .map(([name, value]) => ({ name, qty: value.qty, revenue: value.revenue }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5)
    }

    const trendDays = selectedRange === '30d' ? 30 : 7
    const trendStart = selectedRange === '30d' ? last30Start : last7Start
    const trendMap = new Map<string, { orders: number; revenue: number }>()
    for (let i = 0; i < trendDays; i++) {
        const d = new Date(trendStart)
        d.setDate(trendStart.getDate() + i)
        const key = d.toISOString().slice(0, 10)
        trendMap.set(key, { orders: 0, revenue: 0 })
    }

    for (const order of orders) {
        const date = new Date(order.created_at)
        if (date < trendStart) continue
        const key = date.toISOString().slice(0, 10)
        const bucket = trendMap.get(key)
        if (!bucket) continue
        bucket.orders += 1
        if (order.status === 'delivered') {
            bucket.revenue += Number(order.total_amount || 0)
        }
    }

    const trendData = Array.from(trendMap.entries()).map(([date, value]) => ({
        date,
        label: new Date(date).toLocaleDateString('en-IN', { weekday: 'short' }),
        orders: value.orders,
        revenue: value.revenue,
    }))
    const maxTrendOrders = Math.max(1, ...trendData.map((d) => d.orders))

    const funnel = {
        pending: periodOrders.filter((o) => o.status === 'pending').length,
        preparing: periodOrders.filter((o) => ['confirmed', 'preparing'].includes(o.status)).length,
        ready: periodOrders.filter((o) => o.status === 'ready').length,
        onTheWay: periodOrders.filter((o) => o.status === 'out_for_delivery').length,
        delivered: periodOrders.filter((o) => o.status === 'delivered').length,
        cancelled: periodOrders.filter((o) => o.status === 'cancelled').length,
    }

    const codOrders = periodOrders.filter((o) => (o.payment_method || '').toLowerCase() === 'cod')
    const onlineOrders = periodOrders.filter((o) => (o.payment_method || '').toLowerCase() === 'online')
    const codRevenue = deliveredInPeriod
        .filter((o) => (o.payment_method || '').toLowerCase() === 'cod')
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
    const onlineRevenue = deliveredInPeriod
        .filter((o) => (o.payment_method || '').toLowerCase() === 'online')
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
    const pendingOnlinePayments = periodOrders.filter(
        (o) => (o.payment_method || '').toLowerCase() === 'online' && (o.payment_status || '').toLowerCase() === 'pending'
    ).length

    const stats = [
        { title: `${rangeLabel} Orders`, value: String(periodOrders.length), icon: ClipboardList, color: 'text-blue-600' },
        { title: 'Menu Items', value: String(menuItemsCount || 0), icon: UtensilsCrossed, color: 'text-green-600' },
        { title: `${rangeLabel} Revenue`, value: `₹${periodRevenue.toFixed(0)}`, icon: DollarSign, color: 'text-amber-600' },
        { title: 'Active Riders', value: String(activeRidersCount || 0), icon: Users, color: 'text-purple-600' },
        { title: 'Acceptance Rate', value: `${acceptanceRate}%`, icon: Target, color: 'text-emerald-600' },
        { title: 'Avg Order Value', value: `₹${avgOrderValue.toFixed(0)}`, icon: TrendingUp, color: 'text-indigo-600' },
        { title: 'Actual Prep Time', value: `${avgActualPrepMins.toFixed(0)} min`, icon: Timer, color: 'text-rose-600' },
        { title: 'Expected Prep', value: `${avgExpectedPrepMins.toFixed(0)} min`, icon: Activity, color: 'text-cyan-600' },
    ]

    return (
        <div className="w-full space-y-4 pb-8">
            <ProfileCompletionCard percentage={percentage} missing={missing} />

            <div className="rounded-lg border border-border bg-card px-4 py-4 sm:px-6">
                <h2 className="text-xl font-bold sm:text-2xl">Welcome back!</h2>
                <p className="mt-1 text-sm text-muted-foreground sm:text-base">
                    Here&apos;s what&apos;s happening at {restaurant?.name}
                </p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
                {[
                    { key: 'today', label: 'Today' },
                    { key: '7d', label: '7 Days' },
                    { key: '30d', label: '30 Days' },
                ].map((option) => {
                    const isActive = selectedRange === option.key
                    return (
                        <Link
                            key={option.key}
                            href={`/dashboard?range=${option.key}`}
                            className={`whitespace-nowrap rounded-md border px-3 py-1.5 text-sm ${isActive
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border bg-background hover:bg-muted'
                                }`}
                        >
                            {option.label}
                        </Link>
                    )
                })}
            </div>

            <DashboardSection title="Performance Snapshot" description={`Overview for ${rangeLabel}`}>
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                    {stats.map((stat) => (
                        <div
                            key={stat.title}
                            className="rounded-lg border border-border/70 bg-gradient-to-br from-muted/60 to-muted/20 p-3 sm:p-4"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground sm:text-xs">
                                    {stat.title}
                                </p>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </div>
                            <p className="mt-2 text-xl font-bold sm:text-2xl">{stat.value}</p>
                        </div>
                    ))}
                </div>
            </DashboardSection>

            <div className="grid gap-4 xl:grid-cols-2">
                <DashboardSection
                    title={selectedRange === '30d' ? '30-Day Orders Trend' : '7-Day Orders Trend'}
                    description="Orders and delivered revenue by day"
                >
                    <div className="space-y-3">
                        {trendData.map((point) => (
                            <div key={point.date} className="space-y-1">
                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>{point.label}</span>
                                    <span>{point.orders} orders • ₹{point.revenue.toFixed(0)}</span>
                                </div>
                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full"
                                        style={{ width: `${Math.max(6, (point.orders / maxTrendOrders) * 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </DashboardSection>

                <DashboardSection
                    title={`${rangeLabel} Order Funnel`}
                    description="Pipeline from new to completion"
                >
                    <div className="space-y-3">
                        {[
                            { label: 'Pending', value: funnel.pending },
                            { label: 'Preparing', value: funnel.preparing },
                            { label: 'Ready', value: funnel.ready },
                            { label: 'On The Way', value: funnel.onTheWay },
                            { label: 'Delivered', value: funnel.delivered },
                            { label: 'Cancelled', value: funnel.cancelled },
                        ].map((row) => (
                            <div key={row.label} className="flex items-center justify-between rounded-lg border p-3">
                                <span className="text-sm font-medium">{row.label}</span>
                                <span className="text-lg font-bold">{row.value}</span>
                            </div>
                        ))}
                        <div className="rounded-lg border p-3 bg-muted/40">
                            <p className="text-xs text-muted-foreground">Active right now</p>
                            <p className="text-lg font-bold">{activeOrders.length} orders in pipeline</p>
                        </div>
                    </div>
                </DashboardSection>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
                <DashboardSection
                    title={`Payment Split (${rangeLabel})`}
                    description="COD vs Online order mix and delivered revenue"
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">COD Orders</p>
                            <p className="text-2xl font-bold">{codOrders.length}</p>
                            <p className="text-sm text-muted-foreground">Delivered Revenue ₹{codRevenue.toFixed(0)}</p>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-xs text-muted-foreground">Online Orders</p>
                            <p className="text-2xl font-bold">{onlineOrders.length}</p>
                            <p className="text-sm text-muted-foreground">Delivered Revenue ₹{onlineRevenue.toFixed(0)}</p>
                            <p className="mt-1 text-xs text-amber-600">Pending online payments: {pendingOnlinePayments}</p>
                        </div>
                    </div>
                </DashboardSection>

                <DashboardSection
                    title={`Top Items (${rangeLabel})`}
                    description="Best-selling menu items by quantity"
                >
                    {topItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No item sales in selected range.</p>
                    ) : (
                        <div className="space-y-2">
                            {topItems.map((item, idx) => (
                                <div key={`${item.name}-${idx}`} className="flex items-center justify-between rounded-lg border p-3">
                                    <div>
                                        <p className="font-medium">{item.name}</p>
                                        <p className="text-xs text-muted-foreground">Qty {item.qty}</p>
                                    </div>
                                    <p className="font-semibold">₹{item.revenue.toFixed(0)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </DashboardSection>
            </div>
        </div>
    )
}
