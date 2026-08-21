import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export interface StorefrontBuyAgainItem {
    id: string
    name: string
    orderCount: number
    totalQuantity: number
    lastOrderedAt: string | null
}

export interface StorefrontActiveOrder {
    id: string
    status: string
    order_number?: string | null
}

export async function getRestaurantStorefront(slug: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*')
        .eq('slug', slug)
        .single()

    if (!restaurant) {
        return {
            restaurant: null,
            categories: [],
            menuItems: [],
            buyAgainItems: [] as StorefrontBuyAgainItem[],
            activeOrders: [] as StorefrontActiveOrder[],
            user: user as User | null,
        }
    }

    const [{ data: categories }, { data: menuItems }] = await Promise.all([
        supabase
            .from('categories')
            .select('*')
            .eq('restaurant_id', restaurant.id)
            .eq('is_active', true)
            .order('sort_order', { ascending: true }),
        supabase
            .from('menu_items')
            .select('*')
            .eq('restaurant_id', restaurant.id)
            .eq('is_available', true)
            .order('sort_order', { ascending: true }),
    ])

    let buyAgainItems: StorefrontBuyAgainItem[] = []
    let activeOrders: StorefrontActiveOrder[] = []

    if (user?.id) {
        const { data: latestActiveOrders } = await supabase
            .from('orders')
            .select('id, status, order_number')
            .eq('user_id', user.id)
            .in('status', ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery'])
            .order('created_at', { ascending: false })
            .limit(5)

        if (latestActiveOrders?.length) {
            activeOrders = latestActiveOrders.map((order) => ({
                id: order.id,
                status: order.status,
                order_number: order.order_number,
            }))
        }

        const { data: recentDeliveredOrders } = await supabase
            .from('orders')
            .select('id, created_at')
            .eq('restaurant_id', restaurant.id)
            .or(`user_id.eq.${user.id},customer_id.eq.${user.id}`)
            .neq('status', 'cancelled')
            .order('created_at', { ascending: false })

        const deliveredOrderIds = (recentDeliveredOrders || []).map((o) => o.id)
        const orderDateById = new Map((recentDeliveredOrders || []).map((o) => [o.id, o.created_at]))
        if (deliveredOrderIds.length > 0) {
            const { data: orderItems } = await supabase
                .from('order_items')
                .select('menu_item_id, name, quantity, order_id')
                .in('order_id', deliveredOrderIds)

            const counts = new Map<string, StorefrontBuyAgainItem>()
            for (const item of orderItems || []) {
                const id = item.menu_item_id || `name:${item.name}`
                const orderedAt = orderDateById.get(item.order_id) || null
                const prev = counts.get(id)
                if (prev) {
                    prev.orderCount += 1
                    prev.totalQuantity += Number(item.quantity || 0)
                    if (orderedAt && (!prev.lastOrderedAt || new Date(orderedAt) > new Date(prev.lastOrderedAt))) {
                        prev.lastOrderedAt = orderedAt
                    }
                } else {
                    counts.set(id, {
                        id: item.menu_item_id || '',
                        name: item.name,
                        orderCount: 1,
                        totalQuantity: Number(item.quantity || 0),
                        lastOrderedAt: orderedAt,
                    })
                }
            }

            buyAgainItems = Array.from(counts.values())
                .filter((item) => !!item.id)
                .sort((a, b) => {
                    const aDate = a.lastOrderedAt ? new Date(a.lastOrderedAt).getTime() : 0
                    const bDate = b.lastOrderedAt ? new Date(b.lastOrderedAt).getTime() : 0
                    if (bDate !== aDate) return bDate - aDate
                    return b.orderCount - a.orderCount
                })
        }
    }

    return {
        restaurant,
        categories: categories || [],
        menuItems: menuItems || [],
        buyAgainItems,
        activeOrders,
        user: user as User | null,
    }
}
