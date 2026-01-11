import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { MenuItemDetail } from "@/components/dashboard/menu/menu-item-detail"

export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function MenuItemPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    // Fetch item with category
    const { data: item, error } = await supabase
        .from("menu_items")
        .select(
            `
            *,
            category:categories(id, name)
        `
        )
        .eq("id", id)
        .single()

    if (error || !item) notFound()

    // Verify ownership
    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("id")
        .eq("id", item.restaurant_id)
        .eq("owner_id", user.id)
        .single()

    if (!restaurant) notFound()

    // Fetch all categories for edit dialog
    const { data: categories } = await supabase
        .from("categories")
        .select("id, name")
        .eq("restaurant_id", restaurant.id)
        .order("sort_order", { ascending: true })

    return <MenuItemDetail item={item} categories={categories || []} />
}
