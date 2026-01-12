'use client'

import { useState } from 'react'
import { CategoryCard } from '@/components/dashboard/menu/category-card'
import { MenuItemCard } from '@/components/dashboard/menu/menu-item-card'
import { AddItemDialog } from '@/components/dashboard/menu/add-item-dialog'

interface Category {
    id: string
    name: string
    description?: string | null
    image_url?: string | null
    is_active: boolean
    sort_order: number
}

interface MenuItem {
    id: string
    name: string
    description?: string | null
    price: number
    category_id?: string | null
    image_url?: string | null
    is_available: boolean
    is_veg: boolean
    is_spicy: boolean
    is_bestseller: boolean
    is_featured: boolean
    is_new: boolean
    preparation_time_mins?: number | null
    serves?: number | null
    portion_size?: string | null
    calories?: number | null
    sort_order: number
}

interface CategoriesListProps {
    categories: Category[]
    items: MenuItem[]
}

export function CategoriesList({ categories, items }: CategoriesListProps) {
    const [activeDialogCategory, setActiveDialogCategory] = useState<string | null>(null)

    const getItemsForCategory = (categoryId: string) => {
        return items.filter((item) => item.category_id === categoryId)
    }

    return (
        <>
            <div className="-mx-4 sm:mx-0 space-y-4 sm:space-y-5">
                {categories.map((category) => {
                    const categoryItems = getItemsForCategory(category.id)
                    return (
                        <CategoryCard
                            key={category.id}
                            category={category}
                            itemCount={categoryItems.length}
                            onAddItem={() => setActiveDialogCategory(category.id)}
                        >
                            {categoryItems.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                    {categoryItems.map((item) => (
                                        <MenuItemCard key={item.id} item={item} categories={categories} />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-sm text-muted-foreground">
                                    No items in this category. Use the menu above to add items.
                                </div>
                            )}
                        </CategoryCard>
                    )
                })}
            </div>

            {/* Dialogs for each category */}
            {categories.map((category) => (
                <AddItemDialog
                    key={`dialog-${category.id}`}
                    categories={categories}
                    defaultCategoryId={category.id}
                    trigger={<div className="hidden" />}
                    open={activeDialogCategory === category.id}
                    onOpenChange={(open) => {
                        if (!open) setActiveDialogCategory(null)
                    }}
                />
            ))}
        </>
    )
}
