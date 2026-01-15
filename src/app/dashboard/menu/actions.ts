'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ============ CATEGORIES ============

interface CategoryInput {
    name: string
    description?: string
    image_url?: string
}

export async function createCategory(data: CategoryInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!restaurant) return { error: 'Restaurant not found' }

    // Get max sort_order
    const { data: maxOrder } = await supabase
        .from('categories')
        .select('sort_order')
        .eq('restaurant_id', restaurant.id)
        .order('sort_order', { ascending: false })
        .limit(1)
        .single()

    const { data: category, error } = await supabase
        .from('categories')
        .insert({
            restaurant_id: restaurant.id,
            name: data.name,
            description: data.description,
            image_url: data.image_url,
            sort_order: (maxOrder?.sort_order || 0) + 1,
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/dashboard/menu')
    return { data: category }
}

export async function updateCategory(id: string, data: CategoryInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('categories')
        .update({
            name: data.name,
            description: data.description,
            image_url: data.image_url,
        })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/menu')
    return { success: true }
}

export async function deleteCategory(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/menu')
    return { success: true }
}

export async function toggleCategoryActive(id: string, isActive: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('categories')
        .update({ is_active: isActive })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/menu')
    return { success: true }
}

// ============ MENU ITEMS ============

interface MenuItemInput {
    category_id?: string | null
    name: string
    description?: string
    short_description?: string
    price: number
    compare_at_price?: number
    image_url?: string
    is_veg?: boolean
    is_featured?: boolean
    is_bestseller?: boolean
    is_new?: boolean
    is_spicy?: boolean
    spice_level?: number
    preparation_time_mins?: number
    serves?: number
    portion_size?: string
    calories?: number
    tags?: string[]
}

export async function createMenuItem(data: MenuItemInput) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (!restaurant) return { error: 'Restaurant not found' }

    const { data: item, error } = await supabase
        .from('menu_items')
        .insert({
            restaurant_id: restaurant.id,
            category_id: data.category_id || null,
            name: data.name,
            description: data.description,
            short_description: data.short_description,
            price: data.price,
            compare_at_price: data.compare_at_price,
            image_url: data.image_url,
            is_veg: data.is_veg ?? true,
            is_featured: data.is_featured ?? false,
            is_bestseller: data.is_bestseller ?? false,
            is_new: data.is_new ?? true,
            is_spicy: data.is_spicy ?? false,
            spice_level: data.spice_level ?? 0,
            preparation_time_mins: data.preparation_time_mins ?? 20,
            serves: data.serves ?? 1,
            portion_size: data.portion_size,
            calories: data.calories,
            tags: data.tags ?? [],
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/dashboard/menu')
    return { data: item }
}

export async function updateMenuItem(id: string, data: Partial<MenuItemInput>) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.short_description !== undefined) updateData.short_description = data.short_description
    if (data.price !== undefined) updateData.price = data.price
    if (data.compare_at_price !== undefined) updateData.compare_at_price = data.compare_at_price
    if (data.category_id !== undefined) updateData.category_id = data.category_id
    if (data.image_url !== undefined) updateData.image_url = data.image_url
    if (data.is_veg !== undefined) updateData.is_veg = data.is_veg
    if (data.is_featured !== undefined) updateData.is_featured = data.is_featured
    if (data.is_bestseller !== undefined) updateData.is_bestseller = data.is_bestseller
    if (data.is_new !== undefined) updateData.is_new = data.is_new
    if (data.is_spicy !== undefined) updateData.is_spicy = data.is_spicy
    if (data.spice_level !== undefined) updateData.spice_level = data.spice_level
    if (data.preparation_time_mins !== undefined) updateData.preparation_time_mins = data.preparation_time_mins
    if (data.serves !== undefined) updateData.serves = data.serves
    if (data.portion_size !== undefined) updateData.portion_size = data.portion_size
    if (data.calories !== undefined) updateData.calories = data.calories
    if (data.tags !== undefined) updateData.tags = data.tags

    const { error } = await supabase
        .from('menu_items')
        .update(updateData)
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/menu')
    return { success: true }
}

export async function deleteMenuItem(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/menu')
    return { success: true }
}

export async function toggleItemAvailable(id: string, isAvailable: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    const { error } = await supabase
        .from('menu_items')
        .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/menu')
    return { success: true }
}

// ============ BULK ACTIONS ============

export async function bulkToggleAvailable(itemIds: string[], isAvailable: boolean) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    if (itemIds.length === 0) return { error: 'No items selected' }

    const { error } = await supabase
        .from('menu_items')
        .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
        .in('id', itemIds)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/menu')
    return { success: true, count: itemIds.length }
}

export async function bulkDeleteItems(itemIds: string[]) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    if (itemIds.length === 0) return { error: 'No items selected' }

    const { error } = await supabase
        .from('menu_items')
        .delete()
        .in('id', itemIds)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/menu')
    return { success: true, count: itemIds.length }
}

export async function bulkMoveToCategory(itemIds: string[], categoryId: string | null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    if (itemIds.length === 0) return { error: 'No items selected' }

    const { error } = await supabase
        .from('menu_items')
        .update({ category_id: categoryId, updated_at: new Date().toISOString() })
        .in('id', itemIds)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/menu')
    return { success: true, count: itemIds.length }
}

