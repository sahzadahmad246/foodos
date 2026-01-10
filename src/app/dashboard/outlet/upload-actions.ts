'use server'

import { createClient } from '@/lib/supabase/server'
import { uploadImage, deleteImage } from '@/lib/cloudinary'
import { revalidatePath } from 'next/cache'

interface UploadResponse {
    error?: string
    url?: string
    public_id?: string
}

// Upload logo
export async function uploadRestaurantLogo(
    restaurantId: string,
    base64Data: string,
    oldPublicId?: string
): Promise<UploadResponse> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Verify ownership - just check id and owner_id
    const { data: restaurant, error: fetchError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('id', restaurantId)
        .eq('owner_id', user.id)
        .single()

    if (fetchError) {
        console.error('Fetch error:', fetchError)
        return { error: 'Restaurant not found or access denied' }
    }

    if (!restaurant) {
        return { error: 'Restaurant not found' }
    }

    try {
        // Upload new image
        const result = await uploadImage(base64Data, 'foodos/logos')

        // Update database - only update columns that exist
        const { error: updateError } = await supabase
            .from('restaurants')
            .update({
                logo_url: result.secure_url,
                updated_at: new Date().toISOString(),
            })
            .eq('id', restaurantId)

        if (updateError) {
            console.error('Update error:', updateError)
            return { error: updateError.message }
        }

        // Delete old image if provided
        if (oldPublicId) {
            await deleteImage(oldPublicId)
        }

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/outlet')

        return { url: result.secure_url, public_id: result.public_id }
    } catch (err) {
        console.error('Logo upload error:', err)
        return { error: 'Failed to upload image. Check Cloudinary config.' }
    }
}

// Upload cover image
export async function uploadRestaurantCover(
    restaurantId: string,
    base64Data: string,
    oldPublicId?: string
): Promise<UploadResponse> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    // Verify ownership
    const { data: restaurant, error: fetchError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('id', restaurantId)
        .eq('owner_id', user.id)
        .single()

    if (fetchError) {
        console.error('Fetch error:', fetchError)
        return { error: 'Restaurant not found or access denied' }
    }

    if (!restaurant) {
        return { error: 'Restaurant not found' }
    }

    try {
        // Upload new image
        const result = await uploadImage(base64Data, 'foodos/covers')

        // Update database
        const { error: updateError } = await supabase
            .from('restaurants')
            .update({
                cover_image_url: result.secure_url,
                updated_at: new Date().toISOString(),
            })
            .eq('id', restaurantId)

        if (updateError) {
            console.error('Update error:', updateError)
            return { error: updateError.message }
        }

        // Delete old image if provided
        if (oldPublicId) {
            await deleteImage(oldPublicId)
        }

        revalidatePath('/dashboard')
        revalidatePath('/dashboard/outlet')

        return { url: result.secure_url, public_id: result.public_id }
    } catch (err) {
        console.error('Cover upload error:', err)
        return { error: 'Failed to upload image. Check Cloudinary config.' }
    }
}

// Remove logo
export async function removeRestaurantLogo(restaurantId: string): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id, logo_url')
        .eq('id', restaurantId)
        .eq('owner_id', user.id)
        .single()

    if (!restaurant) {
        return { error: 'Restaurant not found' }
    }

    await supabase
        .from('restaurants')
        .update({
            logo_url: null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', restaurantId)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/outlet')

    return {}
}

// Remove cover
export async function removeRestaurantCover(restaurantId: string): Promise<{ error?: string }> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Not authenticated' }
    }

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id, cover_image_url')
        .eq('id', restaurantId)
        .eq('owner_id', user.id)
        .single()

    if (!restaurant) {
        return { error: 'Restaurant not found' }
    }

    await supabase
        .from('restaurants')
        .update({
            cover_image_url: null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', restaurantId)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/outlet')

    return {}
}
