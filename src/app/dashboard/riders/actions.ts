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
