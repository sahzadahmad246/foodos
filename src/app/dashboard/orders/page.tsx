import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OrdersList } from "@/components/dashboard/orders/orders-list"
import { Package } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function OrdersPage() {
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

    // Get start of today in UTC
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    // Fetch orders:
    // 1. All orders from today (any status)
    // 2. Previous orders that are still pending/preparing/ready/out_for_delivery
    const { data: orders } = await supabase
        .from("orders")
        .select(`
            *,
            order_items(*)
        `)
        .eq("restaurant_id", restaurant.id)
        .or(`created_at.gte.${todayISO},status.in.(pending,preparing,ready,out_for_delivery)`)
        .order("created_at", { ascending: false })

    // Count by status for header
    const statusCounts = {
        pending: 0,
        preparing: 0,
        ready: 0,
        total: orders?.length || 0
    }

    orders?.forEach(order => {
        if (order.status === 'pending') statusCounts.pending++
        if (order.status === 'preparing') statusCounts.preparing++
        if (order.status === 'ready') statusCounts.ready++
    })

    const activeOrders = statusCounts.pending + statusCounts.preparing + statusCounts.ready

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                        <Package className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                        Orders
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        {activeOrders > 0 ? (
                            <>
                                <span className="font-semibold text-foreground">{activeOrders}</span> active orders
                                {statusCounts.pending > 0 && (
                                    <span className="text-yellow-600"> · {statusCounts.pending} new</span>
                                )}
                            </>
                        ) : (
                            <>No active orders right now</>
                        )}
                    </p>
                </div>
            </div>

            <OrdersList orders={orders || []} />
        </div>
    )
}
