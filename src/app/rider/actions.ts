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

    // Check for other active deliveries
    const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('rider_id', riderId)
        .eq('status', 'out_for_delivery')
        .neq('id', orderId)

    // Only set to returning if no other active deliveries
    if (!count) {
        await supabase
            .from('riders')
            .update({ status: 'returning' })
            .eq('id', riderId)
    }

    revalidatePath('/rider')
    revalidatePath('/dashboard/orders')
    return { success: true }
}

export async function arrivedAtRestaurant(
    riderId: string,
    riderLat?: number,
    riderLng?: number
) {
    const supabase = await createClient()

    // Get rider's restaurant coordinates
    const { data: rider } = await supabase
        .from('riders')
        .select('restaurant_id, restaurants(latitude, longitude)')
        .eq('id', riderId)
        .single()

    if (!rider || !rider.restaurants) {
        return { error: 'Restaurant not found' }
    }

    const restaurant = rider.restaurants as any

    // If rider provided location and restaurant has coordinates, check proximity
    if (restaurant.latitude && restaurant.longitude && riderLat && riderLng) {
        const distance = calculateDistance(
            riderLat, riderLng,
            restaurant.latitude, restaurant.longitude
        )

        // Must be within 100 meters
        if (distance > 100) {
            return {
                error: 'You must be at the restaurant to mark as arrived',
                distance: Math.round(distance)
            }
        }
    }

    // Update rider status to online
    const { error } = await supabase
        .from('riders')
        .update({ status: 'online' })
        .eq('id', riderId)

    if (error) {
        console.error('Error updating rider status:', error)
        return { error: 'Failed to update status' }
    }

    revalidatePath('/rider')
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

// Rider confirms return by entering OTP given by restaurant
export async function confirmReturnOtp(orderId: string, riderId: string, otp: string) {
    const supabase = await createClient()

    // Get order and verify OTP
    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('return_otp, rider_id')
        .eq('id', orderId)
        .single()

    if (fetchError || !order) {
        return { error: 'Order not found' }
    }

    if (order.rider_id !== riderId) {
        return { error: 'Not authorized for this order' }
    }

    if (order.return_otp !== otp) {
        return { error: 'Invalid OTP. Please check with the restaurant.' }
    }

    // OTP is correct - update order and release rider
    const { error: updateError } = await supabase
        .from('orders')
        .update({
            return_verified_at: new Date().toISOString()
        })
        .eq('id', orderId)

    if (updateError) {
        return { error: 'Failed to verify return' }
    }

    // Check for other active deliveries
    const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('rider_id', riderId)
        .eq('status', 'out_for_delivery')

    // Only set to online if no other active deliveries
    if (!count) {
        await supabase
            .from('riders')
            .update({ status: 'online' })
            .eq('id', riderId)
    }

    revalidatePath('/rider')
    revalidatePath('/dashboard/orders')
    return { success: true }
}

export async function requestCashDeposit(amount: number, note?: string) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const normalizedAmount = Math.round(Number(amount) * 100) / 100
    if (!normalizedAmount || normalizedAmount <= 0) {
        return { error: 'Invalid amount' }
    }

    const riderByEmail = user.email
        ? await supabase
            .from('riders')
            .select('id, restaurant_id, cash_in_hand')
            .eq('email', user.email)
            .maybeSingle()
            .then((res) => res.data)
        : null

    const riderByUserId = await supabase
        .from('riders')
        .select('id, restaurant_id, cash_in_hand')
        .eq('user_id', user.id)
        .maybeSingle()
        .then((res) => res.data)

    const rider = riderByEmail || riderByUserId

    if (!rider) {
        return { error: 'Rider not found' }
    }

    const cashInHand = Number(rider.cash_in_hand || 0)
    if (normalizedAmount - cashInHand > 0.001) {
        return { error: 'Amount exceeds cash in hand' }
    }

    const { error } = await supabase
        .from('rider_cash_deposit_requests')
        .insert({
            rider_id: rider.id,
            restaurant_id: rider.restaurant_id,
            amount: normalizedAmount,
            note: note || null,
            status: 'pending'
        })

    if (error) {
        console.error('Error creating deposit request:', error)
        return { error: 'Failed to create request' }
    }

    revalidatePath('/rider')
    return { success: true }
}
