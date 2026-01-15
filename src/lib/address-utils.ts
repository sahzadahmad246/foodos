import { createClient } from '@/lib/supabase/client'

interface Address {
    id: string
    latitude: number
    longitude: number
    locality: string | null
    flat_building: string
    landmark: string | null
    city: string | null
    state: string | null
    pincode: string | null
    address_type: string
    is_default: boolean
    person_name: string
    mobile: string
}

// Find saved address within specified radius (in meters)
export async function findNearbyAddress(
    userId: string,
    latitude: number,
    longitude: number,
    radiusMeters: number = 100
): Promise<Address | null> {
    const supabase = createClient()

    const { data: addresses } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', userId)

    if (!addresses || addresses.length === 0) {
        return null
    }

    // Find address within radius using Haversine formula
    for (const address of addresses) {
        const { data: distance } = await supabase
            .rpc('calculate_distance', {
                lat1: latitude,
                lon1: longitude,
                lat2: address.latitude,
                lon2: address.longitude,
            })

        if (distance !== null && distance <= radiusMeters) {
            return address as Address
        }
    }

    return null
}

// Get all addresses for a user
export async function getUserAddresses(userId: string): Promise<Address[]> {
    const supabase = createClient()

    const { data } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false })

    return (data as Address[]) || []
}

// Save new address
export async function saveAddress(userId: string, address: Omit<Address, 'id'>) {
    const supabase = createClient()

    // If this is default, unset other defaults
    if (address.is_default) {
        await supabase
            .from('customer_addresses')
            .update({ is_default: false })
            .eq('user_id', userId)
    }

    const { data, error } = await supabase
        .from('customer_addresses')
        .insert({
            user_id: userId,
            ...address,
        })
        .select()
        .single()

    if (error) {
        console.error('Save address error:', error)
        return { error: error.message }
    }

    return { data }
}

// Update address
export async function updateAddress(addressId: string, updates: Partial<Address>) {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('customer_addresses')
        .update(updates)
        .eq('id', addressId)
        .select()
        .single()

    if (error) {
        console.error('Update address error:', error)
        return { error: error.message }
    }

    return { data }
}

// Delete address
export async function deleteAddress(addressId: string) {
    const supabase = createClient()

    const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', addressId)

    if (error) {
        console.error('Delete address error:', error)
        return { error: error.message }
    }

    return { success: true }
}
