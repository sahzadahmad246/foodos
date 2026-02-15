import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RidersList } from "@/components/dashboard/riders/riders-list"
import { Bike, Banknote, ArrowDownCircle, ArrowUpCircle, CheckCircle2 } from "lucide-react"

export const dynamic = "force-dynamic"

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

    const ledgerByRider = (cashLedger || []).reduce((acc: Record<string, any[]>, entry: any) => {
        if (!acc[entry.rider_id]) acc[entry.rider_id] = []
        acc[entry.rider_id].push(entry)
        return acc
    }, {})

    const requestsByRider = (depositRequests || []).reduce((acc: Record<string, any[]>, entry: any) => {
        if (!acc[entry.rider_id]) acc[entry.rider_id] = []
        acc[entry.rider_id].push(entry)
        return acc
    }, {})

    const totalCashInHand = (riders || []).reduce((sum: number, r: any) => sum + Number(r.cash_in_hand || 0), 0)
    const totalCollected = (riders || []).reduce((sum: number, r: any) => sum + Number(r.cash_collected_total || 0), 0)
    const totalDeposited = (riders || []).reduce((sum: number, r: any) => sum + Number(r.cash_deposited_total || 0), 0)
    const totalDelivered = (riders || []).reduce((sum: number, r: any) => sum + Number(r.delivered_count || 0), 0)

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayDeposits = (cashLedger || [])
        .filter((entry: any) => entry.type === 'deposit' && new Date(entry.created_at) >= today)
        .reduce((sum: number, entry: any) => sum + Number(entry.amount || 0), 0)
    const todayCollections = (cashLedger || [])
        .filter((entry: any) => entry.type === 'collect' && new Date(entry.created_at) >= today)
        .reduce((sum: number, entry: any) => sum + Number(entry.amount || 0), 0)

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                    <Bike className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                    Riders
                </h2>
                <p className="text-muted-foreground mt-1">
                    Manage your delivery partners
                </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <Banknote className="h-4 w-4 text-emerald-600" />
                        Cash in Hand
                    </div>
                    <div className="mt-2 text-2xl font-bold">₹{totalCashInHand.toFixed(0)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        Today collected: ₹{todayCollections.toFixed(0)}
                    </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <ArrowDownCircle className="h-4 w-4 text-emerald-600" />
                        Total Collected
                    </div>
                    <div className="mt-2 text-2xl font-bold">₹{totalCollected.toFixed(0)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        Today: ₹{todayCollections.toFixed(0)}
                    </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <ArrowUpCircle className="h-4 w-4 text-blue-600" />
                        Total Deposited
                    </div>
                    <div className="mt-2 text-2xl font-bold">₹{totalDeposited.toFixed(0)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        Today: ₹{todayDeposits.toFixed(0)}
                    </div>
                </div>

                <div className="rounded-xl border border-border/60 bg-background/60 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Delivered Orders
                    </div>
                    <div className="mt-2 text-2xl font-bold">{totalDelivered}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                        All-time deliveries
                    </div>
                </div>
            </div>

            <RidersList
                riders={(riders || []) as any}
                ledgerByRider={ledgerByRider}
                requestsByRider={requestsByRider}
                restaurantId={restaurant.id}
            />
        </div>
    )
}
