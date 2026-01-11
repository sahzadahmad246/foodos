'use server'

import { createClient } from '@/lib/supabase/server'
import { uploadImage, deleteImage } from '@/lib/cloudinary'
import { revalidatePath } from 'next/cache'

export async function uploadMenuItemImage(itemId: string, formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const file = formData.get('file') as File
    if (!file) return { error: 'No file provided' }

    // Verify ownership
    const { data: item } = await supabase
        .from('menu_items')
        .select('id, image_url, restaurant_id')
        .eq('id', itemId)
        .single()

    if (!item) return { error: 'Item not found' }

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('id', item.restaurant_id)
        .eq('owner_id', user.id)
        .single()

    if (!restaurant) return { error: 'Access denied' }

    try {
        // Delete old image if exists
        if (item.image_url) {
            const publicId = item.image_url.split('/').pop()?.split('.')[0]
            if (publicId) {
                await deleteImage(`foodos/menu/${publicId}`)
            }
        }

        // Convert file to base64
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = `data:${file.type};base64,${buffer.toString('base64')}`

        // Upload new image
        const result = await uploadImage(base64, 'foodos/menu')

        // Update database
        await supabase
            .from('menu_items')
            .update({ image_url: result.secure_url, updated_at: new Date().toISOString() })
            .eq('id', itemId)

        revalidatePath('/dashboard/menu')
        return { data: { url: result.secure_url } }
    } catch (error) {
        return { error: 'Failed to upload image' }
    }
}

export async function removeMenuItemImage(itemId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: item } = await supabase
        .from('menu_items')
        .select('id, image_url, restaurant_id')
        .eq('id', itemId)
        .single()

    if (!item) return { error: 'Item not found' }

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('id', item.restaurant_id)
        .eq('owner_id', user.id)
        .single()

    if (!restaurant) return { error: 'Access denied' }

    try {
        if (item.image_url) {
            const publicId = item.image_url.split('/').pop()?.split('.')[0]
            if (publicId) {
                await deleteImage(`foodos/menu/${publicId}`)
            }
        }

        await supabase
            .from('menu_items')
            .update({ image_url: null, updated_at: new Date().toISOString() })
            .eq('id', itemId)

        revalidatePath('/dashboard/menu')
        return { success: true }
    } catch {
        return { error: 'Failed to remove image' }
    }
}
