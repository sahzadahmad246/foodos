'use server'

import { createClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/encryption'
import { revalidatePath } from 'next/cache'

interface PaymentKeysResponse {
    error?: string
    success?: boolean
}

// Save Razorpay keys
export async function saveRazorpayKeys(
    restaurantId: string,
    keyId: string,
    keySecret: string
): Promise<PaymentKeysResponse> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Verify ownership
    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('id', restaurantId)
        .eq('owner_id', user.id)
        .single()

    if (!restaurant) {
        return { error: 'Restaurant not found' }
    }

    try {
        // Encrypt the secret key
        const encryptedSecret = encrypt(keySecret)

        // Update settings - also enable online payments when keys are saved
        const { error: updateError } = await supabase
            .from('restaurant_settings')
            .update({
                razorpay_key_id: keyId,
                razorpay_key_secret_encrypted: encryptedSecret,
                online_payment_enabled: true,
                updated_at: new Date().toISOString(),
            })
            .eq('restaurant_id', restaurantId)

        if (updateError) {
            console.error('Update error:', updateError)
            return { error: updateError.message }
        }

        revalidatePath('/dashboard/outlet')
        return { success: true }
    } catch (err) {
        console.error('Save Razorpay keys error:', err)
        return { error: 'Failed to save payment keys' }
    }
}

// Get decrypted Razorpay secret (for internal use only)
export async function getDecryptedRazorpaySecret(restaurantId: string): Promise<string | null> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: settings } = await supabase
        .from('restaurant_settings')
        .select('razorpay_key_secret_encrypted')
        .eq('restaurant_id', restaurantId)
        .single()

    if (!settings?.razorpay_key_secret_encrypted) return null

    try {
        return decrypt(settings.razorpay_key_secret_encrypted)
    } catch {
        return null
    }
}

// Remove Razorpay keys
export async function removeRazorpayKeys(restaurantId: string): Promise<PaymentKeysResponse> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('id', restaurantId)
        .eq('owner_id', user.id)
        .single()

    if (!restaurant) {
        return { error: 'Restaurant not found' }
    }

    await supabase
        .from('restaurant_settings')
        .update({
            razorpay_key_id: null,
            razorpay_key_secret_encrypted: null,
            online_payment_enabled: false,
            updated_at: new Date().toISOString(),
        })
        .eq('restaurant_id', restaurantId)

    revalidatePath('/dashboard/outlet')
    return { success: true }
}

// Toggle online payment enabled
export async function toggleOnlinePayment(
    restaurantId: string,
    enabled: boolean
): Promise<PaymentKeysResponse> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('id', restaurantId)
        .eq('owner_id', user.id)
        .single()

    if (!restaurant) {
        return { error: 'Restaurant not found' }
    }

    // If enabling, verify keys exist
    if (enabled) {
        const { data: settings } = await supabase
            .from('restaurant_settings')
            .select('razorpay_key_id')
            .eq('restaurant_id', restaurantId)
            .single()

        if (!settings?.razorpay_key_id) {
            return { error: 'Please setup Razorpay keys first' }
        }
    }

    const { error } = await supabase
        .from('restaurant_settings')
        .update({
            online_payment_enabled: enabled,
            updated_at: new Date().toISOString(),
        })
        .eq('restaurant_id', restaurantId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/outlet')
    return { success: true }
}
