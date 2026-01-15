'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OrdersList } from './orders-list'
import { NewOrderModal } from './new-order-modal'

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
    notes?: string | null
    rider_id?: string | null
    order_items: OrderItem[]
}

interface RealtimeOrdersWrapperProps {
    initialOrders: Order[]
    restaurantId: string
}

export function RealtimeOrdersWrapper({ initialOrders, restaurantId }: RealtimeOrdersWrapperProps) {
    const [orders, setOrders] = useState<Order[]>(initialOrders)
    const [newOrder, setNewOrder] = useState<Order | null>(null)
    const [showNewOrderModal, setShowNewOrderModal] = useState(false)
    const supabase = createClient()

    const handleNewOrder = useCallback((order: Order) => {
        setNewOrder(order)
        setShowNewOrderModal(true)
    }, [])

    const handleCloseModal = useCallback(() => {
        setShowNewOrderModal(false)
        setNewOrder(null)
    }, [])

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

                    // Show modal
                    handleNewOrder(orderWithItems)
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
                    console.log('📝 Order updated:', payload.new)
                    const updatedOrder = payload.new as Order
                    setOrders((prev) =>
                        prev.map((order) =>
                            order.id === updatedOrder.id
                                ? { ...order, ...updatedOrder }
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
    }, [restaurantId, supabase, handleNewOrder])

    return (
        <>
            <OrdersList orders={orders} />
            <NewOrderModal
                order={newOrder}
                open={showNewOrderModal}
                onClose={handleCloseModal}
            />
        </>
    )
}
