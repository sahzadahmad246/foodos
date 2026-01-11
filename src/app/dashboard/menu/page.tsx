import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UtensilsCrossed, FolderOpen } from "lucide-react"
import { AddCategoryDialog } from "@/components/dashboard/menu/add-category-dialog"
import { AddItemDialog } from "@/components/dashboard/menu/add-item-dialog"
import { CategoryCard } from "@/components/dashboard/menu/category-card"
import { MenuItemCard } from "@/components/dashboard/menu/menu-item-card"

export const dynamic = "force-dynamic"

export default async function MenuPage() {
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
    const allItems = menuItems || []
    const uncategorizedItems = allItems.filter((item) => !item.category_id)
    const getItemsForCategory = (categoryId: string) => {
        return allItems.filter((item) => item.category_id === categoryId)
    }

    const totalItems = allItems.length
    const availableItems = allItems.filter((i) => i.is_available).length

    return (
        <div className="space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 text-foreground">
                        <UtensilsCrossed className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                        Menu
                    </h2>
                    <p className="text-sm text-muted-foreground mt-2 sm:mt-1">
                        {totalItems} items · {availableItems} available · {allCategories.length} categories
                    </p>
                </div>
                <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-2 w-full sm:w-auto">
                    <AddCategoryDialog />
                    <AddItemDialog categories={allCategories} />
                </div>
            </div>

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

            {/* Categories with Items */}
            {allCategories.length > 0 && (
                <div className="space-y-4 sm:space-y-5">
                    {allCategories.map((category) => {
                        const items = getItemsForCategory(category.id)
                        return (
                            <CategoryCard key={category.id} category={category} itemCount={items.length}>
                                {items.length > 0 ? (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                        {items.map((item) => (
                                            <MenuItemCard key={item.id} item={item} categories={allCategories} />
                                        ))}
                                        {/* Add item button */}
                                        <AddItemDialog
                                            categories={allCategories}
                                            defaultCategoryId={category.id}
                                            trigger={
                                                <button className="border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors aspect-video min-h-[150px] bg-muted/20 hover:bg-muted/40">
                                                    <UtensilsCrossed className="h-6 w-6 sm:h-7 sm:w-7" />
                                                    <span className="text-xs sm:text-sm font-medium">Add Item</span>
                                                </button>
                                            }
                                        />
                                    </div>
                                ) : (
                                    <div className="flex justify-center py-4">
                                        <AddItemDialog
                                            categories={allCategories}
                                            defaultCategoryId={category.id}
                                            trigger={
                                                <button className="border-2 border-dashed rounded-xl px-6 sm:px-8 py-4 sm:py-5 flex items-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors bg-muted/20 hover:bg-muted/40">
                                                    <UtensilsCrossed className="h-5 w-5" />
                                                    <span className="text-sm font-medium">Add first item</span>
                                                </button>
                                            }
                                        />
                                    </div>
                                )}
                            </CategoryCard>
                        )
                    })}
                </div>
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
