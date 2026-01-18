'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleRiderStatus(riderId: string, newStatus: 'online' | 'offline') {
    const supabase = await createClient()

    const { error } = await supabase
        .from('riders')
        .update({ status: newStatus })
        .eq('id', riderId)

    if (error) {
        console.error('Error toggling rider status:', error)
        return { error: 'Failed to update status' }
    }

    revalidatePath('/rider')
    return { success: true }
}

export async function pickupOrder(orderId: string, riderId: string) {
    const supabase = await createClient()

    console.log('Picking up order:', orderId, 'by rider:', riderId)

    // Update order status to out_for_delivery
    const { data, error: orderError } = await supabase
        .from('orders')
        .update({
            status: 'out_for_delivery',
            picked_up_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('rider_id', riderId)
        .select()

    console.log('Order update result:', data, 'Error:', orderError)

    if (orderError) {
        console.error('Error picking up order:', orderError)
        return { error: 'Failed to pick up order' }
    }

    if (!data || data.length === 0) {
        console.error('No order updated - RLS may be blocking')
        return { error: 'Order not found or not assigned to you' }
    }

    // Update rider status to on_delivery
    const { error: riderError } = await supabase
        .from('riders')
        .update({ status: 'on_delivery' })
        .eq('id', riderId)

    if (riderError) {
        console.error('Error updating rider status:', riderError)
    }

    revalidatePath('/rider')
    revalidatePath('/dashboard/orders')
    return { success: true }
}

export async function deliverOrder(
    orderId: string,
    riderId: string,
    riderLat?: number,
    riderLng?: number
) {
    const supabase = await createClient()

    // Get order to check customer location
    const { data: order } = await supabase
        .from('orders')
        .select('customer_latitude, customer_longitude')
        .eq('id', orderId)
        .eq('rider_id', riderId)
        .single()

    if (!order) {
        return { error: 'Order not found' }
    }

    // If customer has location and rider provided location, check proximity
    if (order.customer_latitude && order.customer_longitude && riderLat && riderLng) {
        const distance = calculateDistance(
            riderLat, riderLng,
            order.customer_latitude, order.customer_longitude
        )

        // Must be within 200 meters
        if (distance > 200) {
            return {
                error: 'You must be near the customer to mark as delivered',
                distance: Math.round(distance)
            }
        }
    }

    // Update order status to delivered
    const { error: orderError } = await supabase
        .from('orders')
        .update({
            status: 'delivered',
            delivered_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .eq('rider_id', riderId)

    if (orderError) {
        console.error('Error delivering order:', orderError)
        return { error: 'Failed to mark as delivered' }
    }

    // Update rider status back to online
    await supabase
        .from('riders')
        .update({ status: 'online' })
        .eq('id', riderId)

    revalidatePath('/rider')
    revalidatePath('/dashboard/orders')
    return { success: true }
}

// Calculate distance between two coordinates in meters (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000 // Earth's radius in meters
    const dLat = toRad(lat2 - lat1)
    const dLng = toRad(lng2 - lng1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180)
}
