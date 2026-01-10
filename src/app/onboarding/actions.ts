'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Types
export interface RestaurantFormData {
    name: string
    slug: string
    description?: string
    address_line1?: string
    address_line2?: string
    city?: string
    state?: string
    pincode?: string
    latitude?: number
    longitude?: number
    phone?: string
}

// Check if slug is available
export async function checkSlugAvailability(slug: string): Promise<boolean> {
    const supabase = await createClient()
    const { data } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', slug)
        .single()

    return !data // true if available (no restaurant found)
}

// Create restaurant (onboarding)
export async function createRestaurant(formData: RestaurantFormData): Promise<{ error?: string; restaurantId?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Check slug availability
    const slugAvailable = await checkSlugAvailability(formData.slug)
    if (!slugAvailable) {
        return { error: 'This URL is already taken. Please choose another.' }
    }

    // Create restaurant
    const { data: restaurant, error } = await supabase
        .from('restaurants')
        .insert({
            owner_id: user.id,
            name: formData.name,
            slug: formData.slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
            description: formData.description,
            address_line1: formData.address_line1,
            address_line2: formData.address_line2,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            latitude: formData.latitude,
            longitude: formData.longitude,
            phone: formData.phone,
            onboarding_completed: true,
        })
        .select('id')
        .single()

    if (error) {
        console.error('Restaurant creation error:', error)
        return { error: error.message }
    }

    // Create default settings
    await supabase
        .from('restaurant_settings')
        .insert({
            restaurant_id: restaurant.id,
        })

    // Update user profile with restaurant_id and role
    await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            restaurant_id: restaurant.id,
            role: 'restaurant_owner',
        })

    revalidatePath('/dashboard')
    return { restaurantId: restaurant.id }
}

// Get user's restaurant
export async function getUserRestaurant() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*, restaurant_settings(*)')
        .eq('owner_id', user.id)
        .single()

    return restaurant
}

// Update restaurant info
export async function updateRestaurant(
    restaurantId: string,
    updates: Record<string, unknown>
): Promise<{ error?: string; success?: boolean }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { error } = await supabase
        .from('restaurants')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', restaurantId)
        .eq('owner_id', user.id)

    if (error) {
        console.error('Restaurant update error:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/outlet')
    return { success: true }
}

// Update restaurant settings
export async function updateRestaurantSettings(
    restaurantId: string,
    settings: Record<string, unknown>
): Promise<{ error?: string; success?: boolean }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // First verify user owns this restaurant
    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('id', restaurantId)
        .eq('owner_id', user.id)
        .single()

    if (!restaurant) {
        return { error: 'Restaurant not found or access denied' }
    }

    // Try update first
    const { data: updateData, error: updateError } = await supabase
        .from('restaurant_settings')
        .update({
            ...settings,
            updated_at: new Date().toISOString(),
        })
        .eq('restaurant_id', restaurantId)
        .select()

    if (updateError) {
        console.error('Settings update error:', updateError)
        return { error: updateError.message }
    }

    // If no rows updated, create the settings row
    if (!updateData || updateData.length === 0) {
        const { error: insertError } = await supabase
            .from('restaurant_settings')
            .insert({
                restaurant_id: restaurantId,
                ...settings,
            })

        if (insertError) {
            console.error('Settings insert error:', insertError)
            return { error: insertError.message }
        }
    }

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/outlet')
    return { success: true }
}

// Toggle restaurant setting (with confirmation already done on client)
export async function toggleRestaurantSetting(
    restaurantId: string,
    settingName: string,
    value: boolean
): Promise<{ error?: string; success?: boolean }> {
    return updateRestaurantSettings(restaurantId, { [settingName]: value })
}
