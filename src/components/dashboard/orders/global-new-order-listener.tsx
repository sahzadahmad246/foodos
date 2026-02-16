'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NewOrderModal } from './new-order-modal'

interface OrderItem {
    id: string
    name: string
    price: number
    quantity: number
}

interface NewOrder {
    id: string
    order_number: string
    customer_name: string
    customer_phone: string | null
    customer_address: string | null
    total_amount: number
    payment_method: string
    created_at: string
    order_items?: OrderItem[]
}

interface GlobalNewOrderListenerProps {
    restaurantId: string
}

export function GlobalNewOrderListener({ restaurantId }: GlobalNewOrderListenerProps) {
    const supabase = createClient()
    const [newOrder, setNewOrder] = useState<NewOrder | null>(null)
    const [showNewOrderModal, setShowNewOrderModal] = useState(false)

    useEffect(() => {
        if (!restaurantId) return

        const channel = supabase
            .channel(`global-restaurant-orders-${restaurantId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                async (payload) => {
                    const incomingOrder = payload.new as NewOrder
                    const { data: items } = await supabase
                        .from('order_items')
                        .select('id, name, price, quantity')
                        .eq('order_id', incomingOrder.id)

                    setNewOrder({
                        ...incomingOrder,
                        order_items: items || [],
                    })
                    setShowNewOrderModal(true)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [restaurantId, supabase])

    const handleCloseModal = () => {
        setShowNewOrderModal(false)
        setNewOrder(null)
    }

    return (
        <NewOrderModal
            order={newOrder}
            open={showNewOrderModal}
            onClose={handleCloseModal}
        />
    )
}
