"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreVertical, Pencil, Trash2, Clock, Flame, Loader2, Star, Sparkles, Eye } from "lucide-react"
import { toast } from "sonner"
import { deleteMenuItem, toggleItemAvailable } from "@/app/dashboard/menu/actions"
import { EditItemDialog } from "./edit-item-dialog"

interface Category {
    id: string
    name: string
}

interface MenuItem {
    id: string
    name: string
    description?: string | null
    price: number
    compare_at_price?: number | null
    image_url?: string | null
    category_id?: string | null
    is_veg: boolean
    is_available: boolean
    is_featured?: boolean
    is_bestseller?: boolean
    is_new?: boolean
    is_spicy?: boolean
    preparation_time_mins?: number | null
}

interface MenuItemCardProps {
    item: MenuItem
    categories?: Category[]
}

export function MenuItemCard({ item, categories = [] }: MenuItemCardProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showEditDialog, setShowEditDialog] = useState(false)

    const handleToggleAvailable = (checked: boolean) => {
        startTransition(async () => {
            const result = await toggleItemAvailable(item.id, checked)
            if (result.error) {
                toast.error(result.error)
            } else {
                router.refresh()
            }
        })
    }

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteMenuItem(item.id)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Item deleted")
                setShowDeleteDialog(false)
                router.refresh()
            }
        })
    }

    const hasDiscount = item.compare_at_price && item.compare_at_price > item.price
    const discountPercent = hasDiscount
        ? Math.round(((item.compare_at_price! - item.price) / item.compare_at_price!) * 100)
        : 0

    return (
        <>
            <div
                className={`group relative border rounded-xl bg-card overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-105 ${!item.is_available ? "opacity-50" : ""}`}
            >
                {/* Image Section - Better aspect ratio and responsive */}
                <Link
                    href={`/dashboard/menu/${item.id}`}
                    className="block relative aspect-video bg-muted cursor-pointer overflow-hidden"
                >
                    {item.image_url ? (
                        <Image
                            src={item.image_url || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-xs sm:text-sm font-medium">
                            No image
                        </div>
                    )}

                    {/* Badge Section - Improved positioning */}
                    <div className="absolute top-2 left-2 right-2 flex flex-wrap gap-1.5">
                        {item.is_bestseller && (
                            <Badge className="bg-yellow-500/90 text-white text-[10px] sm:text-xs px-2 py-1 backdrop-blur-sm">
                                <Star className="h-3 w-3 mr-1" />
                                Bestseller
                            </Badge>
                        )}
                        {item.is_new && (
                            <Badge className="bg-blue-500/90 text-white text-[10px] sm:text-xs px-2 py-1 backdrop-blur-sm">
                                <Sparkles className="h-3 w-3 mr-1" />
                                New
                            </Badge>
                        )}
                        {hasDiscount && (
                            <Badge className="bg-red-500/90 text-white text-[10px] sm:text-xs px-2 py-1 backdrop-blur-sm font-bold">
                                {discountPercent}% OFF
                            </Badge>
                        )}
                    </div>

                    {/* Veg/Non-veg Indicator - Better sized */}
                    <div className="absolute top-2 right-2">
                        <div
                            className={`w-6 h-6 border-2 rounded-sm flex items-center justify-center bg-white/80 backdrop-blur-sm ${item.is_veg ? "border-green-600" : "border-red-600"}`}
                        >
                            <div className={`w-3 h-3 rounded-full ${item.is_veg ? "bg-green-600" : "bg-red-600"}`} />
                        </div>
                    </div>

                    {/* Spicy Indicator */}
                    {item.is_spicy && (
                        <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm rounded-full p-1.5">
                            <Flame className="h-5 w-5 text-orange-500 fill-orange-500" />
                        </div>
                    )}
                </Link>

                {/* Content Section */}
                <div className="p-3 sm:p-4">
                    {/* Title & Menu */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0 flex-1">
                            <Link href={`/dashboard/menu/${item.id}`} className="block group/link">
                                <h4 className="font-semibold text-sm sm:text-base truncate group-hover/link:text-primary transition-colors">
                                    {item.name}
                                </h4>
                            </Link>
                            {item.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                            )}
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 flex-shrink-0"
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/menu/${item.id}`)} className="cursor-pointer">
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setShowEditDialog(true)} className="cursor-pointer">
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive cursor-pointer">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Price Section */}
                    <div className="flex items-baseline gap-2 mb-3">
                        <span className="font-bold text-lg sm:text-xl text-foreground">₹{item.price}</span>
                        {hasDiscount && (
                            <span className="text-xs sm:text-sm text-muted-foreground line-through">₹{item.compare_at_price}</span>
                        )}
                    </div>

                    {/* Prep Time & Toggle - Always visible */}
                    <div className="flex items-center justify-between pt-3 border-t">
                        <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground">
                            {item.preparation_time_mins ? (
                                <>
                                    <Clock className="h-4 w-4" />
                                    <span>{item.preparation_time_mins}m</span>
                                </>
                            ) : (
                                <span className="text-xs">Stock</span>
                            )}
                        </div>
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <span className={`text-xs font-medium ${item.is_available ? 'text-green-600' : 'text-red-500'}`}>
                                {item.is_available ? 'In Stock' : 'Out'}
                            </span>
                            <Switch
                                checked={item.is_available}
                                onCheckedChange={handleToggleAvailable}
                                disabled={isPending}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            <EditItemDialog
                item={item}
                categories={categories}
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent className="w-[95vw] max-w-sm">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Item?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete &quot;{item.name}&quot;. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex gap-2 sm:gap-0">
                        <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
