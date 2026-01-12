import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OrdersList } from "@/components/dashboard/orders/orders-list"

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

    // Fetch orders with items
    const { data: orders } = await supabase
        .from("orders")
        .select(`
            *,
            order_items(*)
        `)
        .eq("restaurant_id", restaurant.id)
        .order("created_at", { ascending: false })

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Orders</h2>
                <p className="text-muted-foreground">
                    Manage and track all your orders
                </p>
            </div>

            <OrdersList orders={orders || []} />
        </div>
    )
}
