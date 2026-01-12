import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { FolderOpen } from "lucide-react"
import { MenuHeader } from "@/components/dashboard/menu/menu-header"
import { AddCategoryDialog } from "@/components/dashboard/menu/add-category-dialog"
import { CategoriesList } from "@/components/dashboard/menu/categories-list"
import { MenuItemCard } from "@/components/dashboard/menu/menu-item-card"
import { AddItemDialog } from "@/components/dashboard/menu/add-item-dialog"

export const dynamic = "force-dynamic"

interface SearchParams {
    search?: string
    veg?: string
    nonveg?: string
    spicy?: string
    bestseller?: string
    featured?: string
    available?: string
}

export default async function MenuPage({ searchParams: searchParamsPromise }: { searchParams: Promise<SearchParams> }) {
    const searchParams = await searchParamsPromise
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    const { data: restaurant } = await supabase.from("restaurants").select("id").eq("owner_id", user.id).single()

    if (!restaurant) redirect("/onboarding")

    const { data: categories } = await supabase
        .from("categories")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("sort_order", { ascending: true })

    const { data: menuItems } = await supabase
        .from("menu_items")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .order("sort_order", { ascending: true })

    const allCategories = categories || []
    let allItems = menuItems || []

    // Apply server-side filters
    const searchQuery = searchParams.search?.toLowerCase()

    if (searchQuery) {
        allItems = allItems.filter(item =>
            item.name.toLowerCase().includes(searchQuery) ||
            item.description?.toLowerCase().includes(searchQuery)
        )
    }

    // Veg/Non-veg filter (OR condition if both selected)
    const vegSelected = searchParams.veg === 'true'
    const nonvegSelected = searchParams.nonveg === 'true'

    if (vegSelected && nonvegSelected) {
        // Show all items (both veg and non-veg)
        // No filter needed
    } else if (vegSelected) {
        allItems = allItems.filter(item => item.is_veg === true)
    } else if (nonvegSelected) {
        allItems = allItems.filter(item => item.is_veg === false)
    }

    if (searchParams.spicy === 'true') {
        allItems = allItems.filter(item => item.is_spicy === true)
    }

    if (searchParams.bestseller === 'true') {
        allItems = allItems.filter(item => item.is_bestseller === true)
    }

    if (searchParams.featured === 'true') {
        allItems = allItems.filter(item => item.is_featured === true)
    }

    if (searchParams.available === 'true') {
        allItems = allItems.filter(item => item.is_available === true)
    }

    const uncategorizedItems = allItems.filter((item) => !item.category_id)

    // Check if we have any active filters or search
    const hasActiveFilters = Boolean(
        searchQuery ||
        searchParams.veg ||
        searchParams.nonveg ||
        searchParams.spicy ||
        searchParams.bestseller ||
        searchParams.featured ||
        searchParams.available
    )

    return (
        <div className="space-y-6 sm:space-y-8">
            <MenuHeader categories={allCategories} />

            {/* Empty State */}
            {allCategories.length === 0 && allItems.length === 0 && (
                <div className="rounded-xl border-2 border-dashed p-8 sm:p-12 text-center bg-muted/20">
                    <FolderOpen className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg sm:text-xl mb-2">No menu items yet</h3>
                    <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                        Start by creating categories to organize your menu, then add items to each category
                    </p>
                    <div className="grid grid-cols-2 sm:flex justify-center gap-2 sm:gap-3 max-w-sm mx-auto sm:max-w-none">
                        <AddCategoryDialog />
                        <AddItemDialog categories={allCategories} />
                    </div>
                </div>
            )}

            {/* No Results */}
            {hasActiveFilters && allItems.length === 0 && allCategories.length > 0 && (
                <div className="rounded-xl border-2 border-dashed p-8 sm:p-12 text-center bg-muted/20">
                    <FolderOpen className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg sm:text-xl mb-2">No items found</h3>
                    <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
                        Try adjusting your search or filters to find what you're looking for
                    </p>
                </div>
            )}

            {/* Categories with Items */}
            {allCategories.length > 0 && allItems.length > 0 && (
                <>
                    {hasActiveFilters ? (
                        // Flat grid when searching/filtering
                        <div className="-mx-4 sm:mx-0">
                            <div className="px-4 sm:px-0 mb-3">
                                <p className="text-sm text-muted-foreground">
                                    Showing {allItems.length} {allItems.length === 1 ? 'item' : 'items'}
                                </p>
                            </div>
                            <div className="px-4 sm:px-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                {allItems.map((item) => (
                                    <MenuItemCard key={item.id} item={item} categories={allCategories} />
                                ))}
                            </div>
                        </div>
                    ) : (
                        // Categorized view when no filters
                        <CategoriesList categories={allCategories} items={allItems} />
                    )}
                </>
            )}

            {/* Uncategorized Items */}
            {uncategorizedItems.length > 0 && (
                <div className="border rounded-xl bg-card overflow-hidden">
                    <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-muted/50 to-muted/20 border-b">
                        <h3 className="font-semibold text-base sm:text-lg">Uncategorized Items</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1">{uncategorizedItems.length} items</p>
                    </div>
                    <div className="p-4 sm:p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                            {uncategorizedItems.map((item) => (
                                <MenuItemCard key={item.id} item={item} categories={allCategories} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
