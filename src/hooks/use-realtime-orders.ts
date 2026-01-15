'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

interface Order {
    id: string
    order_number: string
    customer_name: string
    customer_phone: string | null
    customer_address: string | null
    total_amount: number
    payment_method: string
    status: string
    created_at: string
    order_items?: any[]
}

interface UseRealtimeOrdersProps {
    restaurantId: string
    onNewOrder?: (order: Order) => void
}

export function useRealtimeOrders({ restaurantId, onNewOrder }: UseRealtimeOrdersProps) {
    const [orders, setOrders] = useState<Order[]>([])
    const supabase = createClient()

    useEffect(() => {
        if (!restaurantId) return

        // Subscribe to INSERT events for new orders
        const channel: RealtimeChannel = supabase
            .channel(`orders:${restaurantId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                async (payload) => {
                    console.log('New order received:', payload.new)
                    const newOrder = payload.new as Order

                    // Fetch order items for this order
                    const { data: items } = await supabase
                        .from('order_items')
                        .select('*')
                        .eq('order_id', newOrder.id)

                    const orderWithItems = { ...newOrder, order_items: items || [] }

                    setOrders((prev) => [orderWithItems, ...prev])
                    onNewOrder?.(orderWithItems)
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                (payload) => {
                    console.log('Order updated:', payload.new)
                    const updatedOrder = payload.new as Order
                    setOrders((prev) =>
                        prev.map((order) =>
                            order.id === updatedOrder.id ? { ...order, ...updatedOrder } : order
                        )
                    )
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [restaurantId, onNewOrder, supabase])

    return { orders, setOrders }
}

// Hook for customer order tracking
interface UseOrderTrackingProps {
    orderId: string
    initialOrder: Order
    onStatusChange?: (status: string) => void
}

export function useOrderTracking({ orderId, initialOrder, onStatusChange }: UseOrderTrackingProps) {
    const [order, setOrder] = useState<Order>(initialOrder)
    const supabase = createClient()

    useEffect(() => {
        if (!orderId) return

        const channel = supabase
            .channel(`order:${orderId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${orderId}`,
                },
                (payload) => {
                    console.log('Order status updated:', payload.new)
                    const updatedOrder = payload.new as Order
                    setOrder((prev) => ({ ...prev, ...updatedOrder }))
                    if (updatedOrder.status !== order.status) {
                        onStatusChange?.(updatedOrder.status)
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [orderId, supabase, onStatusChange, order.status])

    return { order }
}
