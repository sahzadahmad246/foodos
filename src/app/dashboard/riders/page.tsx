import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RidersList } from "@/components/dashboard/riders/riders-list"
import { RiderTeamHeaderActions } from "@/components/dashboard/riders/rider-team-header-actions"
import { Banknote, ArrowDownCircle, ArrowUpCircle, CheckCircle2 } from "lucide-react"

export const dynamic = "force-dynamic"

interface Rider {
    id: string
    name: string
    email: string
    phone: string
    vehicle_type: string
    vehicle_number: string
    status: 'online' | 'offline' | 'on_delivery'
    is_active: boolean
    cash_in_hand?: number | null
    cash_collected_total?: number | null
    cash_deposited_total?: number | null
    delivered_count?: number | null
}

interface CashLedgerEntry {
    id: string
    rider_id: string
    type: 'collect' | 'deposit'
    amount: number
    created_at: string
    order?: { order_number?: string | null } | null
}

interface DepositRequestEntry {
    id: string
    rider_id: string
    amount: number
    status: 'pending' | 'approved' | 'rejected' | 'cancelled'
    note?: string | null
    requested_at: string
    created_at: string
}

function StatCard({
    title,
    value,
    note,
    icon: Icon,
    glow,
}: {
    title: string
    value: string
    note: string
    icon: React.ElementType
    glow: string
}) {
    return (
        <div className="relative overflow-hidden rounded-lg border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold">
                <Icon className="h-4 w-4 text-primary" />
                {title}
            </div>
            <div className="mt-2 text-2xl font-bold">{value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{note}</div>
            <div
                className="absolute bottom-0 left-1/2 h-10 w-[70%] -translate-x-1/2 blur-2xl"
                style={{ background: glow }}
            />
        </div>
    )
}

function Section({
    title,
    description,
    children,
    glow,
    action,
}: {
    title: string
    description?: string
    children: React.ReactNode
    glow: string
    action?: React.ReactNode
}) {
    return (
        <section className="relative overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/40 px-4 py-4 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="font-semibold text-foreground">{title}</h3>
                        {description && <p className="text-sm text-muted-foreground">{description}</p>}
                    </div>
                    {action && <div>{action}</div>}
                </div>
            </div>
            <div className="relative px-4 py-4 sm:px-6">{children}</div>
            <div
                className="absolute bottom-0 left-1/2 h-10 w-[70%] -translate-x-1/2 blur-2xl"
                style={{ background: glow }}
            />
        </section>
    )
}

export default async function RidersPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("owner_id", user.id)
        .single()

    if (!restaurant) redirect("/onboarding")

    // Fetch riders
    const { data: riders } = await supabase
        .from("riders")
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
            delivered_count
        `)
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false })

    const { data: cashLedger } = await supabase
        .from("rider_cash_ledger")
        .select(`
            id,
            rider_id,
            type,
            amount,
            created_at,
            order:orders(order_number)
        `)
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false })
        .limit(200)

    const { data: depositRequests } = await supabase
        .from("rider_cash_deposit_requests")
        .select(`
            id,
            rider_id,
            amount,
            status,
            note,
            requested_at,
            created_at
        `)
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false })
        .limit(200)

    const typedRiders = (riders || []) as Rider[]
    const typedCashLedger = (cashLedger || []) as CashLedgerEntry[]
    const typedDepositRequests = (depositRequests || []) as DepositRequestEntry[]

    const ledgerByRider = typedCashLedger.reduce((acc: Record<string, CashLedgerEntry[]>, entry) => {
        if (!acc[entry.rider_id]) acc[entry.rider_id] = []
        acc[entry.rider_id].push(entry)
        return acc
    }, {})

    const requestsByRider = typedDepositRequests.reduce((acc: Record<string, DepositRequestEntry[]>, entry) => {
        if (!acc[entry.rider_id]) acc[entry.rider_id] = []
        acc[entry.rider_id].push(entry)
        return acc
    }, {})

    const totalCashInHand = typedRiders.reduce((sum, r) => sum + Number(r.cash_in_hand || 0), 0)
    const totalCollected = typedRiders.reduce((sum, r) => sum + Number(r.cash_collected_total || 0), 0)
    const totalDeposited = typedRiders.reduce((sum, r) => sum + Number(r.cash_deposited_total || 0), 0)
    const totalDelivered = typedRiders.reduce((sum, r) => sum + Number(r.delivered_count || 0), 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayDeposits = typedCashLedger
        .filter((entry) => entry.type === 'deposit' && new Date(entry.created_at) >= today)
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
    const todayCollections = typedCashLedger
        .filter((entry) => entry.type === 'collect' && new Date(entry.created_at) >= today)
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
    const onlineCount = typedRiders.filter((r) => r.status === 'online' && r.is_active).length
    const onDeliveryCount = typedRiders.filter((r) => r.status === 'on_delivery').length

    return (
        <div className="space-y-5 pb-8">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <StatCard
                    title="Cash in Hand"
                    value={`₹${totalCashInHand.toFixed(2)}`}
                    note={`Today collected: ₹${todayCollections.toFixed(2)}`}
                    icon={Banknote}
                    glow="rgba(16, 185, 129, 0.25)"
                />
                <StatCard
                    title="Total Collected"
                    value={`₹${totalCollected.toFixed(2)}`}
                    note={`Today: ₹${todayCollections.toFixed(2)}`}
                    icon={ArrowDownCircle}
                    glow="rgba(59, 130, 246, 0.25)"
                />
                <StatCard
                    title="Total Deposited"
                    value={`₹${totalDeposited.toFixed(2)}`}
                    note={`Today: ₹${todayDeposits.toFixed(2)}`}
                    icon={ArrowUpCircle}
                    glow="rgba(245, 158, 11, 0.24)"
                />
                <StatCard
                    title="Delivered Orders"
                    value={`${totalDelivered}`}
                    note="All-time deliveries"
                    icon={CheckCircle2}
                    glow="rgba(236, 72, 153, 0.2)"
                />
            </div>

            <Section
                title="Rider Team"
                description={`${riders?.length || 0} active rider records`}
                glow="rgba(96, 165, 250, 0.2)"
                action={
                    <RiderTeamHeaderActions
                        restaurantId={restaurant.id}
                        onlineCount={onlineCount}
                        onDeliveryCount={onDeliveryCount}
                    />
                }
            >
                <RidersList
                    riders={typedRiders}
                    ledgerByRider={ledgerByRider}
                    requestsByRider={requestsByRider}
                />
            </Section>
        </div>
    )
}
