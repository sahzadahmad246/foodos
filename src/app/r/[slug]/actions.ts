'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface OrderItem {
    menuItemId: string
    name: string
    price: number
    quantity: number
}

interface CreateOrderData {
    restaurantId: string
    customerName: string
    customerPhone: string
    customerAddress: string | null
    itemsTotal: number
    deliveryFee: number
    taxAmount: number
    totalAmount: number
    paymentMethod: string
    notes: string | null
    items: OrderItem[]
}

export async function createOrder(data: CreateOrderData) {
    try {
        const supabase = await createClient()

        // Generate order number
        const orderNumber = `ORD-${Date.now().toString().slice(-8)}`

        // Create order
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                restaurant_id: data.restaurantId,
                order_number: orderNumber,
                customer_name: data.customerName,
                customer_phone: data.customerPhone,
                customer_address: data.customerAddress,
                items_total: data.itemsTotal,
                delivery_fee: data.deliveryFee,
                tax_amount: data.taxAmount,
                total_amount: data.totalAmount,
                payment_method: data.paymentMethod,
                notes: data.notes,
                status: 'pending',
                payment_status: 'pending',
            })
            .select()
            .single()

        if (orderError) {
            console.error('Order creation error:', orderError)
            return { error: 'Failed to create order' }
        }

        // Create order items
        const orderItems = data.items.map(item => ({
            order_id: order.id,
            menu_item_id: item.menuItemId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
        }))

        const { error: itemsError } = await supabase
            .from('order_items')
            .insert(orderItems)

        if (itemsError) {
            console.error('Order items creation error:', itemsError)
            // Rollback order if items fail
            await supabase.from('orders').delete().eq('id', order.id)
            return { error: 'Failed to create order items' }
        }

        revalidatePath('/dashboard/orders')

        return { data: order }
    } catch (error) {
        console.error('Create order error:', error)
        return { error: 'An unexpected error occurred' }
    }
}
