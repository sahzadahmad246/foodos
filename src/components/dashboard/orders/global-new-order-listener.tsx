'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { NewOrderModal } from './new-order-modal'
import { toast } from 'sonner'
import { acceptOrder } from '../actions/order-actions'
import { printThermalBill, printThermalKot, type BillRestaurantInfo } from './thermal-bill'

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
    items_total?: number
    delivery_fee?: number
    tax_amount?: number
    total_amount: number
    payment_method: string
    payment_status?: string
    created_at: string
    order_items?: OrderItem[]
}

interface GlobalNewOrderListenerProps {
    restaurantId: string
    restaurantInfo: BillRestaurantInfo
    autoAcceptOrders: boolean
}

export function GlobalNewOrderListener({
    restaurantId,
    restaurantInfo,
    autoAcceptOrders,
}: GlobalNewOrderListenerProps) {
    const supabase = createClient()
    const [newOrder, setNewOrder] = useState<NewOrder | null>(null)
    const [showNewOrderModal, setShowNewOrderModal] = useState(false)
    const [pendingCount, setPendingCount] = useState(0)
    const reminderIntervalRef = useRef<number | null>(null)
    const requestedNotificationPermissionRef = useRef(false)

    const fetchPendingCount = useCallback(async () => {
        const { count } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('restaurant_id', restaurantId)
            .eq('status', 'pending')

        setPendingCount(count || 0)
    }, [restaurantId, supabase])

    const speakReminder = useCallback((count: number) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

        window.speechSynthesis.cancel()
        const message = `You have ${count} new ${count === 1 ? 'order' : 'orders'}. Please accept or reject.`
        const utterance = new SpeechSynthesisUtterance(message)
        utterance.rate = 1
        utterance.pitch = 1
        window.speechSynthesis.speak(utterance)
    }, [])

    const notifyReminder = useCallback((count: number) => {
        const message = `You have ${count} pending ${count === 1 ? 'order' : 'orders'}. Please accept or reject.`
        toast.warning(message, { id: 'pending-order-reminder' })

        if (typeof window === 'undefined' || !('Notification' in window)) return

        if (Notification.permission === 'granted') {
            new Notification('New order reminder', { body: message })
            return
        }

        if (Notification.permission === 'default' && !requestedNotificationPermissionRef.current) {
            requestedNotificationPermissionRef.current = true
            void Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    new Notification('New order reminder', { body: message })
                }
            })
        }
    }, [])

    useEffect(() => {
        if (!restaurantId) return

        void fetchPendingCount()

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

                    const orderWithItems = {
                        ...incomingOrder,
                        order_items: items || [],
                    }

                    if (autoAcceptOrders) {
                        const result = await acceptOrder(orderWithItems.id)
                        if (result.error) {
                            toast.error(`Auto-accept failed for ${orderWithItems.order_number}`)
                        } else {
                            const printed = printThermalBill(restaurantInfo, {
                                ...orderWithItems,
                                items_total: Number((orderWithItems as any).items_total || orderWithItems.total_amount || 0),
                                delivery_fee: Number((orderWithItems as any).delivery_fee || 0),
                                tax_amount: Number((orderWithItems as any).tax_amount || 0),
                                payment_status: (orderWithItems as any).payment_status || 'pending',
                            })
                            const kotPrinted = printThermalKot(restaurantInfo, {
                                ...orderWithItems,
                                items_total: Number((orderWithItems as any).items_total || orderWithItems.total_amount || 0),
                                delivery_fee: Number((orderWithItems as any).delivery_fee || 0),
                                tax_amount: Number((orderWithItems as any).tax_amount || 0),
                                payment_status: (orderWithItems as any).payment_status || 'pending',
                            })
                            if (!printed) {
                                toast.warning('Auto-accepted. Please enable popups to print or save as PDF.')
                            }
                            if (!kotPrinted) {
                                toast.warning('Auto-accepted. Please enable popups to print KOT.')
                            }
                            if (printed || kotPrinted) {
                                toast.success(`Auto-accepted ${orderWithItems.order_number} and opened bill print.`)
                            }
                        }
                    } else {
                        setNewOrder(orderWithItems)
                        setShowNewOrderModal(true)
                    }

                    void fetchPendingCount()
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
                async () => {
                    await fetchPendingCount()
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'DELETE',
                    schema: 'public',
                    table: 'orders',
                    filter: `restaurant_id=eq.${restaurantId}`,
                },
                async () => {
                    await fetchPendingCount()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [restaurantId, supabase, fetchPendingCount, autoAcceptOrders, restaurantInfo])

    useEffect(() => {
        if (pendingCount <= 0) {
            if (reminderIntervalRef.current) {
                window.clearInterval(reminderIntervalRef.current)
                reminderIntervalRef.current = null
            }
            return
        }

        notifyReminder(pendingCount)
        speakReminder(pendingCount)

        reminderIntervalRef.current = window.setInterval(() => {
            notifyReminder(pendingCount)
            speakReminder(pendingCount)
        }, 60000)

        return () => {
            if (reminderIntervalRef.current) {
                window.clearInterval(reminderIntervalRef.current)
                reminderIntervalRef.current = null
            }
        }
    }, [pendingCount, notifyReminder, speakReminder])

    const handleCloseModal = () => {
        setShowNewOrderModal(false)
        setNewOrder(null)
    }

    return (
        <NewOrderModal
            order={newOrder}
            open={showNewOrderModal}
            onClose={handleCloseModal}
            restaurantInfo={restaurantInfo}
        />
    )
}
