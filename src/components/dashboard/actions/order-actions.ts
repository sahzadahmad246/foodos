'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function acceptOrder(orderId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const now = new Date().toISOString()
    const { error } = await supabase
        .from('orders')
        .update({
            status: 'preparing',
            confirmed_at: now,
            preparing_at: now,
            updated_at: now
        })
        .eq('id', orderId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/orders')
    return { success: true }
}

export async function rejectOrder(orderId: string, reason?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const now = new Date().toISOString()
    const { error } = await supabase
        .from('orders')
        .update({
            status: 'cancelled',
            cancelled_at: now,
            notes: reason ? `Rejected: ${reason}` : 'Rejected by restaurant',
            updated_at: now
        })
        .eq('id', orderId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/orders')
    return { success: true }
}

export async function markOrderReady(orderId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const now = new Date().toISOString()
    const { error } = await supabase
        .from('orders')
        .update({
            status: 'ready',
            ready_at: now,
            updated_at: now
        })
        .eq('id', orderId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/orders')
    return { success: true }
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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const now = new Date().toISOString()
    const { error } = await supabase
        .from('orders')
        .update({
            status: 'out_for_delivery',
            picked_up_at: now,
            updated_at: now
        })
        .eq('id', orderId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/orders')
    return { success: true }
}

export async function markOrderDelivered(orderId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const now = new Date().toISOString()
    const { error } = await supabase
        .from('orders')
        .update({
            status: 'delivered',
            delivered_at: now,
            updated_at: now
        })
        .eq('id', orderId)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/orders')
    return { success: true }
}
