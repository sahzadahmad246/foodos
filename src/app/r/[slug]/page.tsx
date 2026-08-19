import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { RestaurantMenu } from "@/components/customer/restaurant-menu"

export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function RestaurantPage({ params }: PageProps) {
    const { slug } = await params
    const supabase = await createClient()

    // Get current user (optional, for logged-in experience)
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch restaurant by slug
    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("*")
        .eq("slug", slug)
        .eq("is_online", true)
        .single()

    if (!restaurant) {
        notFound()
    }

    // Fetch categories
    const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })

    // Fetch menu items
    const { data: menuItems } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .eq("is_available", true)
        .order("sort_order", { ascending: true })

    return (
        <RestaurantMenu
            restaurant={restaurant}
            categories={categories || []}
            menuItems={menuItems || []}
            user={user}
        />
    )
}
