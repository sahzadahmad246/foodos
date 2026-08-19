'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface RiderData {
    name: string
    email: string
    phone: string
    vehicleType: string
    vehicleNumber: string
}

export async function addRider(restaurantId: string, data: RiderData) {
    const supabase = await createClient()

    // Check if already a rider for this restaurant with this email
    const { data: existingRider } = await supabase
        .from('riders')
        .select('id')
        .eq('email', data.email)
        .eq('restaurant_id', restaurantId)
        .single()

    if (existingRider) {
        return { error: 'A rider with this email already exists for this restaurant' }
    }

    // Create rider
    const { data: rider, error } = await supabase
        .from('riders')
        .insert({
            restaurant_id: restaurantId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            vehicle_type: data.vehicleType,
            vehicle_number: data.vehicleNumber,
            status: 'offline',
            is_active: true
        })
        .select()
        .single()

    if (error) {
        console.error('Error adding rider:', error)
        return { error: 'Failed to add rider' }
    }

    revalidatePath('/dashboard/riders')
    return { rider }
}

export async function updateRider(riderId: string, data: Partial<RiderData>) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('riders')
        .update({
            name: data.name,
            phone: data.phone,
            vehicle_type: data.vehicleType,
            vehicle_number: data.vehicleNumber
        })
        .eq('id', riderId)

    if (error) {
        console.error('Error updating rider:', error)
        return { error: 'Failed to update rider' }
    }

    revalidatePath('/dashboard/riders')
    return { success: true }
}

export async function toggleRiderActive(riderId: string, isActive: boolean) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('riders')
        .update({ is_active: isActive })
        .eq('id', riderId)

    if (error) {
        console.error('Error toggling rider:', error)
        return { error: 'Failed to update rider' }
    }

    revalidatePath('/dashboard/riders')
    return { success: true }
}

export async function deleteRider(riderId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('riders')
        .delete()
        .eq('id', riderId)

    if (error) {
        console.error('Error deleting rider:', error)
        return { error: 'Failed to delete rider' }
    }

    revalidatePath('/dashboard/riders')
    return { success: true }
}

export async function assignRiderToOrder(orderId: string, riderId: string) {
    const supabase = await createClient()

    // First check if rider is online and available
    const { data: rider, error: riderCheckError } = await supabase
        .from('riders')
        .select('id, status')
        .eq('id', riderId)
        .single()

    if (riderCheckError || !rider) {
        return { error: 'Rider not found' }
    }

    // Allow assignment if rider is online or in pickup phase.
    if (rider.status !== 'online' && rider.status !== 'on_delivery') {
        return { error: 'Rider is not available. Only online or active riders can be assigned orders.' }
    }

    const { count: activeDeliveryCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('rider_id', riderId)
        .eq('status', 'out_for_delivery')

    const { count: pendingPickupCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('rider_id', riderId)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
        .is('picked_up_at', null)

    if ((activeDeliveryCount || 0) > 0 && (pendingPickupCount || 0) === 0) {
        return { error: 'Rider has already left for delivery. Assign after they return or while pickup is pending.' }
    }

    // Update order with rider
    const { error: orderError } = await supabase
        .from('orders')
        .update({ rider_id: riderId })
        .eq('id', orderId)

    if (orderError) {
        console.error('Error assigning rider:', orderError)
        return { error: 'Failed to assign rider' }
    }

    // Update rider status to on_delivery
    const { error: riderError } = await supabase
        .from('riders')
        .update({ status: 'on_delivery' })
        .eq('id', riderId)

    if (riderError) {
        console.error('Error updating rider status:', riderError)
    }

    revalidatePath('/dashboard/orders')
    return { success: true }
}

export async function recordRiderCashDeposit(riderId: string, amount: number, note?: string) {
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

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!restaurant) {
        return { error: 'Restaurant not found' }
    }

    const { data: rider, error: riderError } = await supabase
        .from('riders')
        .select('id, restaurant_id, cash_in_hand')
        .eq('id', riderId)
        .single()

    if (riderError || !rider) {
        return { error: 'Rider not found' }
    }

    if (rider.restaurant_id !== restaurant.id) {
        return { error: 'Rider does not belong to your restaurant' }
    }

    const cashInHand = Number(rider.cash_in_hand || 0)
    if (normalizedAmount - cashInHand > 0.001) {
        return { error: 'Deposit exceeds cash in hand' }
    }

    const { error } = await supabase
        .from('rider_cash_ledger')
        .insert({
            rider_id: riderId,
            restaurant_id: restaurant.id,
            type: 'deposit',
            amount: normalizedAmount,
            note: note || null
        })

    if (error) {
        console.error('Error recording deposit:', error)
        return { error: 'Failed to record deposit' }
    }

    revalidatePath('/dashboard/riders')
    return { success: true }
}

export async function approveDepositRequest(requestId: string) {
    const supabase = await createClient()

    const { error } = await supabase.rpc('approve_rider_deposit_request', {
        request_id: requestId
    })

    if (error) {
        console.error('Error approving deposit request:', error)
        return { error: 'Failed to approve request' }
    }

    revalidatePath('/dashboard/riders')
    return { success: true }
}

export async function rejectDepositRequest(requestId: string) {
    const supabase = await createClient()

    const { error } = await supabase.rpc('reject_rider_deposit_request', {
        request_id: requestId
    })

    if (error) {
        console.error('Error rejecting deposit request:', error)
        return { error: 'Failed to reject request' }
    }

    revalidatePath('/dashboard/riders')
    return { success: true }
}
