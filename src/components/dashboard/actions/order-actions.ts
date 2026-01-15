'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateOrderStatus(orderId: string, status: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('orders')
        .update({
            status,
            updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/orders')
    return { success: true }
}

export async function acceptOrder(orderId: string) {
    return updateOrderStatus(orderId, 'preparing')
}

export async function rejectOrder(orderId: string, reason?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('orders')
        .update({
            status: 'cancelled',
            notes: reason ? `Rejected: ${reason}` : 'Rejected by restaurant',
            updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/orders')
    return { success: true }
}

export async function markOrderReady(orderId: string) {
    return updateOrderStatus(orderId, 'ready')
}

export async function assignRider(orderId: string, riderId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('orders')
        .update({
            rider_id: riderId,
            updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/orders')
    return { success: true }
}

export async function markOrderPickedUp(orderId: string) {
    return updateOrderStatus(orderId, 'out_for_delivery')
}

export async function markOrderDelivered(orderId: string) {
    return updateOrderStatus(orderId, 'delivered')
}
