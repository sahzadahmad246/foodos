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

export async function verifyPickupOtp(orderId: string, otp: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Fetch the order to check the OTP
    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('pickup_otp, status')
        .eq('id', orderId)
        .single()

    if (fetchError || !order) {
        return { error: 'Order not found' }
    }

    if (order.status !== 'ready') {
        return { error: 'Order is not ready for pickup' }
    }

    if (order.pickup_otp !== otp) {
        return { error: 'Invalid OTP' }
    }

    const now = new Date().toISOString()
    const { error: updateError } = await supabase
        .from('orders')
        .update({
            status: 'delivered', // Mark as completed/delivered
            delivered_at: now,   // Reuse delivered_at for pickup completion time
            updated_at: now
        })
        .eq('id', orderId)

    if (updateError) return { error: updateError.message }

    revalidatePath('/dashboard/orders')
    return { success: true }
}

// Cancellation reasons list
export const CANCELLATION_REASONS = [
    'Customer requested cancellation',
    'Out of stock / Item unavailable',
    'Restaurant too busy',
    'Delivery address unreachable',
    'Payment issue',
    'Customer unreachable',
    'Rider unavailable',
    'Order taking too long',
    'Other'
] as const

// Generate 6-digit OTP
function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function cancelOrder(
    orderId: string,
    reason: string,
    cancelledBy: 'restaurant' | 'customer' = 'restaurant'
) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Fetch the order to check current status and rider assignment
    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('status, rider_id')
        .eq('id', orderId)
        .single()

    if (fetchError || !order) {
        return { error: 'Order not found' }
    }

    if (order.status === 'cancelled') {
        return { error: 'Order is already cancelled' }
    }

    if (order.status === 'delivered') {
        return { error: 'Cannot cancel a delivered order' }
    }

    const now = new Date().toISOString()
    const wasOutForDelivery = order.status === 'out_for_delivery'

    // Prepare update data
    const updateData: Record<string, any> = {
        status: 'cancelled',
        cancelled_at: now,
        cancellation_reason: reason,
        cancelled_by: cancelledBy,
        cancelled_step: order.status, // Store the status when cancellation occurred
        updated_at: now
    }

    // If order was out for delivery (rider has picked it up), generate return OTP
    if (wasOutForDelivery && order.rider_id) {
        updateData.return_otp = generateOtp()
        // Don't remove rider_id yet - rider needs to return the order
    } else if (order.rider_id) {
        // Rider assigned but hasn't picked up - remove rider assignment
        updateData.rider_id = null
    }

    const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

    if (error) return { error: error.message }

    // If rider was assigned but order wasn't picked up, make rider available
    if (order.rider_id && !wasOutForDelivery) {
        await supabase
            .from('riders')
            .update({ status: 'available', updated_at: now })
            .eq('id', order.rider_id)
    }

    revalidatePath('/dashboard/orders')
    revalidatePath('/rider')
    return {
        success: true,
        requiresReturn: wasOutForDelivery && order.rider_id,
        returnOtp: wasOutForDelivery && order.rider_id ? updateData.return_otp : null
    }
}

export async function verifyReturnOtp(orderId: string, otp: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Fetch the order to check the return OTP
    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('return_otp, status, rider_id')
        .eq('id', orderId)
        .single()

    if (fetchError || !order) {
        return { error: 'Order not found' }
    }

    if (order.status !== 'cancelled') {
        return { error: 'Order is not cancelled' }
    }

    if (!order.return_otp) {
        return { error: 'No return OTP set for this order' }
    }

    if (order.return_otp !== otp) {
        return { error: 'Invalid OTP' }
    }

    const now = new Date().toISOString()

    // Update order - mark return as verified, remove rider
    const { error: updateError } = await supabase
        .from('orders')
        .update({
            return_verified_at: now,
            rider_id: null,
            updated_at: now
        })
        .eq('id', orderId)

    if (updateError) return { error: updateError.message }

    // Make rider available for new orders
    if (order.rider_id) {
        await supabase
            .from('riders')
            .update({ status: 'available', updated_at: now })
            .eq('id', order.rider_id)
    }

    revalidatePath('/dashboard/orders')
    revalidatePath('/rider')
    return { success: true }
}

export async function markReturnCollected(orderId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Fetch the order to check status
    const { data: order, error: fetchError } = await supabase
        .from('orders')
        .select('status, rider_id')
        .eq('id', orderId)
        .single()

    if (fetchError || !order) {
        return { error: 'Order not found' }
    }

    if (order.status !== 'cancelled') {
        return { error: 'Order is not cancelled' }
    }

    const now = new Date().toISOString()

    // Update order - mark return as verified (without OTP), remove rider
    const { error: updateError } = await supabase
        .from('orders')
        .update({
            return_verified_at: now,
            return_otp: null, // Clear the OTP since we're bypassing it
            rider_id: null,
            updated_at: now
        })
        .eq('id', orderId)

    if (updateError) return { error: updateError.message }

    // Make rider available for new orders
    if (order.rider_id) {
        await supabase
            .from('riders')
            .update({ status: 'available', updated_at: now })
            .eq('id', order.rider_id)
    }

    revalidatePath('/dashboard/orders')
    revalidatePath('/rider')
    return { success: true }
}
