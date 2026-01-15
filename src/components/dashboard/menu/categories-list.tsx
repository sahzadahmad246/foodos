'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { CategoryCard } from '@/components/dashboard/menu/category-card'
import { SelectableItemCard } from '@/components/dashboard/menu/selectable-item-card'
import { AddItemDialog } from '@/components/dashboard/menu/add-item-dialog'
import { EditCategoryDialog } from '@/components/dashboard/menu/edit-category-dialog'
import { EditItemDialog } from '@/components/dashboard/menu/edit-item-dialog'
import { BulkActionsBar } from '@/components/dashboard/menu/bulk-actions-bar'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CheckSquare, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteMenuItem } from '@/app/dashboard/menu/actions'

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
    compare_at_price?: number | null
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
    const router = useRouter()
    const [activeDialogCategory, setActiveDialogCategory] = useState<string | null>(null)
    const [editCategoryId, setEditCategoryId] = useState<string | null>(null)
    const [editItem, setEditItem] = useState<MenuItem | null>(null)
    const [deleteItem, setDeleteItem] = useState<MenuItem | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    // Selection state
    const [selectionMode, setSelectionMode] = useState(false)
    const [selectedIds, setSelectedIds] = useState<string[]>([])

    const getItemsForCategory = (categoryId: string) => {
        return items.filter((item) => item.category_id === categoryId)
    }

    const categoryToEdit = editCategoryId ? categories.find(c => c.id === editCategoryId) : null

    const handleSelect = (id: string, selected: boolean) => {
        setSelectedIds(prev =>
            selected
                ? [...prev, id]
                : prev.filter(i => i !== id)
        )
    }

    const handleClearSelection = () => {
        setSelectedIds([])
        setSelectionMode(false)
    }

    const handleSelectAll = () => {
        setSelectedIds(items.map(i => i.id))
    }

    const handleDeleteItem = async () => {
        if (!deleteItem) return
        setIsDeleting(true)
        const result = await deleteMenuItem(deleteItem.id)
        setIsDeleting(false)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Item deleted')
            setDeleteItem(null)
            router.refresh()
        }
    }

    return (
        <>
            {/* Selection Mode Toggle */}
            <div className="flex items-center justify-between mb-4 px-4 sm:px-0">
                <div className="flex items-center gap-2">
                    {!selectionMode ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectionMode(true)}
                            className="gap-2"
                        >
                            <CheckSquare className="h-4 w-4" />
                            Select Items
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAll}
                                className="gap-2"
                            >
                                Select All ({items.length})
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearSelection}
                                className="gap-2"
                            >
                                <X className="h-4 w-4" />
                                Cancel
                            </Button>
                        </>
                    )}
                </div>
                {selectionMode && selectedIds.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                        {selectedIds.length} of {items.length} selected
                    </span>
                )}
            </div>

            {/* Categories */}
            <div className="-mx-4 sm:mx-0 space-y-4 sm:space-y-5">
                {categories.map((category) => {
                    const categoryItems = getItemsForCategory(category.id)
                    return (
                        <CategoryCard
                            key={category.id}
                            category={category}
                            itemCount={categoryItems.length}
                            onAddItem={() => setActiveDialogCategory(category.id)}
                            onEdit={() => setEditCategoryId(category.id)}
                        >
                            {categoryItems.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                    {categoryItems.map((item) => (
                                        <SelectableItemCard
                                            key={item.id}
                                            item={item}
                                            categories={categories}
                                            selectionMode={selectionMode}
                                            isSelected={selectedIds.includes(item.id)}
                                            onSelect={handleSelect}
                                            onEdit={() => setEditItem(item)}
                                            onDelete={() => setDeleteItem(item)}
                                        />
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

            {/* Add Item Dialogs */}
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

            {/* Edit Category Dialog */}
            {categoryToEdit && (
                <EditCategoryDialog
                    category={categoryToEdit}
                    open={!!editCategoryId}
                    onOpenChange={(open) => {
                        if (!open) setEditCategoryId(null)
                    }}
                />
            )}

            {/* Edit Item Dialog */}
            {editItem && (
                <EditItemDialog
                    item={editItem}
                    categories={categories}
                    open={!!editItem}
                    onOpenChange={(open) => {
                        if (!open) setEditItem(null)
                    }}
                />
            )}

            {/* Delete Item Confirmation */}
            <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Item?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete &quot;{deleteItem?.name}&quot;. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteItem} className="bg-destructive text-destructive-foreground">
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Bulk Actions Bar */}
            <BulkActionsBar
                selectedIds={selectedIds}
                categories={categories}
                onClear={handleClearSelection}
            />
        </>
    )
}
