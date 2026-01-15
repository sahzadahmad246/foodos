'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
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
import { X, Check, XCircle, Trash2, FolderInput, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { bulkToggleAvailable, bulkDeleteItems, bulkMoveToCategory } from '@/app/dashboard/menu/actions'

interface Category {
    id: string
    name: string
}

interface BulkActionsBarProps {
    selectedIds: string[]
    categories: Category[]
    onClear: () => void
}

type LoadingAction = 'available' | 'unavailable' | 'delete' | 'move' | null

export function BulkActionsBar({ selectedIds, categories, onClear }: BulkActionsBarProps) {
    const router = useRouter()
    const [loadingAction, setLoadingAction] = useState<LoadingAction>(null)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showMoveDialog, setShowMoveDialog] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string>('')

    const handleMarkAvailable = async () => {
        setLoadingAction('available')
        const result = await bulkToggleAvailable(selectedIds, true)
        setLoadingAction(null)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`${result.count} items marked as available`)
            onClear()
            router.refresh()
        }
    }

    const handleMarkUnavailable = async () => {
        setLoadingAction('unavailable')
        const result = await bulkToggleAvailable(selectedIds, false)
        setLoadingAction(null)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`${result.count} items marked as out of stock`)
            onClear()
            router.refresh()
        }
    }

    const handleDelete = async () => {
        setLoadingAction('delete')
        const result = await bulkDeleteItems(selectedIds)
        setLoadingAction(null)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(`${result.count} items deleted`)
            setShowDeleteDialog(false)
            onClear()
            router.refresh()
        }
    }

    const handleMove = async () => {
        if (!selectedCategory) {
            toast.error('Please select a category')
            return
        }

        setLoadingAction('move')
        const categoryId = selectedCategory === 'uncategorized' ? null : selectedCategory
        const result = await bulkMoveToCategory(selectedIds, categoryId)
        setLoadingAction(null)
        if (result.error) {
            toast.error(result.error)
        } else {
            const catName = selectedCategory === 'uncategorized'
                ? 'Uncategorized'
                : categories.find(c => c.id === selectedCategory)?.name
            toast.success(`${result.count} items moved to ${catName}`)
            setShowMoveDialog(false)
            setSelectedCategory('')
            onClear()
            router.refresh()
        }
    }

    if (selectedIds.length === 0) return null

    const isLoading = loadingAction !== null

    return (
        <>
            <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-card border shadow-xl rounded-xl px-4 py-3 flex items-center gap-3 max-w-[95vw]">
                <div className="flex items-center gap-2 pr-3 border-r">
                    <span className="text-sm font-medium">
                        {selectedIds.length} selected
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClear} disabled={isLoading}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkAvailable}
                        disabled={isLoading}
                        className="gap-1.5"
                    >
                        {loadingAction === 'available' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 text-green-600" />}
                        <span className="hidden sm:inline">Mark Available</span>
                        <span className="sm:hidden">Available</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkUnavailable}
                        disabled={isLoading}
                        className="gap-1.5"
                    >
                        {loadingAction === 'unavailable' ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 text-red-500" />}
                        <span className="hidden sm:inline">Mark Unavailable</span>
                        <span className="sm:hidden">Out</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMoveDialog(true)}
                        disabled={isLoading}
                        className="gap-1.5"
                    >
                        <FolderInput className="h-4 w-4" />
                        <span className="hidden sm:inline">Move</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={isLoading}
                        className="gap-1.5 text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Delete</span>
                    </Button>
                </div>
            </div>

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {selectedIds.length} items?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. All selected items will be permanently deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={loadingAction === 'delete'}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} disabled={loadingAction === 'delete'} className="bg-destructive text-destructive-foreground">
                            {loadingAction === 'delete' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete All
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Move to Category */}
            <AlertDialog open={showMoveDialog} onOpenChange={setShowMoveDialog}>
                <AlertDialogContent className="max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Move {selectedIds.length} items</AlertDialogTitle>
                        <AlertDialogDescription>
                            Select a category to move the selected items to.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="uncategorized">Uncategorized</SelectItem>
                                {categories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedCategory('')} disabled={loadingAction === 'move'}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleMove} disabled={!selectedCategory || loadingAction === 'move'}>
                            {loadingAction === 'move' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Move Items
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
