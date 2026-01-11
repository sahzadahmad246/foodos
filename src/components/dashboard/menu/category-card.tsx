'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { MoreVertical, Pencil, Trash2, ChevronDown, ChevronRight, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteCategory, toggleCategoryActive } from '@/app/dashboard/menu/actions'

interface Category {
    id: string
    name: string
    description?: string | null
    image_url?: string | null
    is_active: boolean
    sort_order: number
}

interface CategoryCardProps {
    category: Category
    itemCount: number
    children?: React.ReactNode
    onEdit?: () => void
}

export function CategoryCard({ category, itemCount, children, onEdit }: CategoryCardProps) {
    const router = useRouter()
    const [isExpanded, setIsExpanded] = useState(true)
    const [isPending, startTransition] = useTransition()
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    const handleToggleActive = (checked: boolean) => {
        startTransition(async () => {
            const result = await toggleCategoryActive(category.id, checked)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(checked ? 'Category activated' : 'Category hidden')
                router.refresh()
            }
        })
    }

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteCategory(category.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Category deleted')
                setShowDeleteDialog(false)
                router.refresh()
            }
        })
    }

    return (
        <>
            <div className={`border rounded-lg bg-card overflow-hidden ${!category.is_active ? 'opacity-60' : ''}`}>
                {/* Header */}
                <div
                    className="flex items-center justify-between px-4 py-3 bg-muted/40 cursor-pointer"
                    onClick={() => setIsExpanded(!isExpanded)}
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <button className="text-muted-foreground hover:text-foreground">
                            {isExpanded ? (
                                <ChevronDown className="h-5 w-5" />
                            ) : (
                                <ChevronRight className="h-5 w-5" />
                            )}
                        </button>
                        <div className="min-w-0">
                            <h3 className="font-semibold text-sm truncate">{category.name}</h3>
                            <p className="text-xs text-muted-foreground">
                                {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Switch
                            checked={category.is_active}
                            onCheckedChange={handleToggleActive}
                            disabled={isPending}
                            className="scale-90"
                        />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={onEdit}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Content */}
                {isExpanded && (
                    <div className="p-4">
                        {children || (
                            <div className="text-center py-6 text-sm text-muted-foreground border border-dashed rounded-lg">
                                No items in this category
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete &quot;{category.name}&quot;. Items in this category will become uncategorized.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
