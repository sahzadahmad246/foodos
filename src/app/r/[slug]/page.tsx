import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { RestaurantMenu } from "@/components/customer/restaurant-menu"

export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function RestaurantPage({ params }: PageProps) {
    const { slug } = await params
    const supabase = await createClient()

    // Get current user (optional, for logged-in experience)
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch restaurant by slug
    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .single()

    if (!restaurant) {
        notFound()
    }

    // Fetch categories
    const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })

    // Fetch menu items
    const { data: menuItems } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .eq("is_available", true)
        .order("sort_order", { ascending: true })

    // Buy again items for logged-in customer (recent delivered orders from this restaurant)
    let buyAgainItems: Array<{ id: string; name: string; orderCount: number }> = []
    let activeOrder: { id: string; status: string } | null = null
    if (user?.id) {
        const { data: latestActiveOrder } = await supabase
            .from("orders")
            .select("id, status")
            .eq("customer_id", user.id)
            .eq("restaurant_id", restaurant.id)
            .in("status", ["pending", "confirmed", "preparing", "ready", "out_for_delivery"])
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle()

        if (latestActiveOrder) {
            activeOrder = {
                id: latestActiveOrder.id,
                status: latestActiveOrder.status,
            }
        }

        const { data: recentDeliveredOrders } = await supabase
            .from("orders")
            .select("id")
            .eq("restaurant_id", restaurant.id)
            .eq("customer_id", user.id)
            .eq("status", "delivered")
            .order("created_at", { ascending: false })
            .limit(20)

        const deliveredOrderIds = (recentDeliveredOrders || []).map((o) => o.id)
        if (deliveredOrderIds.length > 0) {
            const { data: orderItems } = await supabase
                .from("order_items")
                .select("menu_item_id, name")
                .in("order_id", deliveredOrderIds)

            const counts = new Map<string, { id: string; name: string; orderCount: number }>()
            for (const item of orderItems || []) {
                const id = item.menu_item_id || `name:${item.name}`
                const prev = counts.get(id)
                if (prev) {
                    prev.orderCount += 1
                } else {
                    counts.set(id, {
                        id: item.menu_item_id || '',
                        name: item.name,
                        orderCount: 1,
                    })
                }
            }

            buyAgainItems = Array.from(counts.values())
                .filter((item) => !!item.id)
                .sort((a, b) => b.orderCount - a.orderCount)
                .slice(0, 10)
        }
    }

    return (
        <RestaurantMenu
            restaurant={restaurant}
            categories={categories || []}
            menuItems={menuItems || []}
            buyAgainItems={buyAgainItems}
            activeOrder={activeOrder}
            user={user}
            mode="home"
        />
    )
}
