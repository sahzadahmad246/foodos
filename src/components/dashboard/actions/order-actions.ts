'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateOrderStatus(orderId: string, status: string) {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('orders')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)

        if (error) {
            console.error('Order status update error:', error)
            return { error: 'Failed to update order status' }
        }

        revalidatePath('/dashboard/orders')

        return { success: true }
    } catch (error) {
        console.error('Update order status error:', error)
        return { error: 'An unexpected error occurred' }
    }
}
