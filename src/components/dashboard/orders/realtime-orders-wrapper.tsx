'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OrdersList } from './orders-list'
import type { BillRestaurantInfo } from './thermal-bill'

interface OrderItem {
    id: string
    name: string
    price: number
    quantity: number
}

interface Order {
    id: string
    order_number: string
    customer_name: string
    customer_phone: string | null
    customer_address: string | null
    items_total: number
    delivery_fee: number
    tax_amount: number
    total_amount: number
    payment_method: string
    payment_status: string
    status: string
    created_at: string
    confirmed_at?: string | null
    preparing_at?: string | null
    ready_at?: string | null
    picked_up_at?: string | null
    delivered_at?: string | null
    cancelled_at?: string | null
    notes?: string | null
    rider_id?: string | null
    restaurant_id: string
    order_items: OrderItem[]
    rider?: {
        id: string
        name: string
        phone?: string | null
    } | null
}

interface RealtimeOrdersWrapperProps {
    initialOrders: Order[]
    restaurantId: string
    restaurantInfo: BillRestaurantInfo
}

export function RealtimeOrdersWrapper({
    initialOrders,
    restaurantId,
    restaurantInfo,
}: RealtimeOrdersWrapperProps) {
    const [orders, setOrders] = useState<Order[]>(initialOrders)
    const supabase = createClient()
    const ordersRef = useRef<Order[]>(initialOrders)

    useEffect(() => {
        ordersRef.current = orders
    }, [orders])

    useEffect(() => {
        setOrders(initialOrders)
        ordersRef.current = initialOrders
    }, [initialOrders])

    useEffect(() => {
        if (!restaurantId) return

        console.log('Setting up realtime subscription for restaurant:', restaurantId)

        const channel = supabase
            .channel(`restaurant-orders-${restaurantId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                async (payload) => {
                    console.log('🔔 New order received:', payload.new)
                    const newOrderData = payload.new as Order

                    // Fetch order items
                    const { data: items } = await supabase
                        .from('order_items')
                        .select('*')
                        .eq('order_id', newOrderData.id)

                    const orderWithItems = {
                        ...newOrderData,
                        order_items: items || []
                    }

                    // Add to orders list
                    setOrders((prev) => [orderWithItems, ...prev])

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
                async (payload) => {
                    console.log('📝 Order updated:', payload.new)
                    const updatedOrder = payload.new as Order

                    // If order has a rider_id, fetch rider info
                    let riderInfo = null
                    if (updatedOrder.rider_id) {
                        const { data: rider } = await supabase
                            .from('riders')
                            .select('id, name, phone')
                            .eq('id', updatedOrder.rider_id)
                            .single()
                        riderInfo = rider
                    }
                    const hasOrder = ordersRef.current.some((order) => order.id === updatedOrder.id)

                    if (!hasOrder) {
                        const { data: items } = await supabase
                            .from('order_items')
                            .select('*')
                            .eq('order_id', updatedOrder.id)

                        setOrders((prev) => [
                            { ...updatedOrder, order_items: items || [], rider: riderInfo },
                            ...prev
                        ])
                        return
                    }

                    setOrders((prev) =>
                        prev.map((order) =>
                            order.id === updatedOrder.id
                                ? { ...order, ...updatedOrder, rider: riderInfo || order.rider }
                                : order
                        )
                    )
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status)
            })

        return () => {
            console.log('Cleaning up realtime subscription')
            supabase.removeChannel(channel)
        }
    }, [restaurantId, supabase])

    return (
        <OrdersList orders={orders} restaurantInfo={restaurantInfo} />
    )
}
