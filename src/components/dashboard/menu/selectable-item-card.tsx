'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Pencil, Trash2, Clock, Flame, Loader2, Star, Sparkles, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { deleteMenuItem, toggleItemAvailable } from '@/app/dashboard/menu/actions'

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

interface SelectableItemCardProps {
    item: MenuItem
    categories?: Category[]
    selectionMode: boolean
    isSelected: boolean
    onSelect: (id: string, selected: boolean) => void
    onEdit: () => void
    onDelete: () => void
}

export function SelectableItemCard({
    item,
    categories = [],
    selectionMode,
    isSelected,
    onSelect,
    onEdit,
    onDelete
}: SelectableItemCardProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

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

    const handleCardClick = (e: React.MouseEvent) => {
        if (selectionMode) {
            e.preventDefault()
            onSelect(item.id, !isSelected)
        }
    }

    const hasDiscount = item.compare_at_price && item.compare_at_price > item.price
    const discountPercent = hasDiscount
        ? Math.round(((item.compare_at_price! - item.price) / item.compare_at_price!) * 100)
        : 0

    return (
        <div
            onClick={handleCardClick}
            className={`group relative border rounded-xl bg-card overflow-hidden transition-all duration-200 
                ${selectionMode ? 'cursor-pointer' : ''} 
                ${isSelected ? 'ring-2 ring-primary border-primary' : ''} 
                ${!selectionMode ? 'hover:shadow-lg hover:scale-105' : 'hover:bg-muted/30'}
                ${!item.is_available ? 'opacity-50' : ''}`}
        >
            {/* Selection Checkbox */}
            {selectionMode && (
                <div className="absolute top-2 left-2 z-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelect(item.id, !!checked)}
                        className="h-5 w-5 border-2 bg-white/90 backdrop-blur-sm"
                    />
                </div>
            )}

            {/* Image Section */}
            <div className="relative aspect-video bg-muted overflow-hidden">
                {!selectionMode ? (
                    <Link href={`/dashboard/menu/${item.id}`} className="block h-full">
                        {item.image_url ? (
                            <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-xs sm:text-sm font-medium">
                                No image
                            </div>
                        )}
                    </Link>
                ) : item.image_url ? (
                    <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground text-xs font-medium">
                        No image
                    </div>
                )}

                {/* Badges */}
                <div className={`absolute top-2 ${selectionMode ? 'left-10' : 'left-2'} right-2 flex flex-wrap gap-1.5`}>
                    {item.is_bestseller && (
                        <Badge className="bg-yellow-500/90 text-white text-[10px] px-2 py-0.5">
                            <Star className="h-3 w-3 mr-1" />
                            Bestseller
                        </Badge>
                    )}
                    {item.is_new && (
                        <Badge className="bg-blue-500/90 text-white text-[10px] px-2 py-0.5">
                            <Sparkles className="h-3 w-3 mr-1" />
                            New
                        </Badge>
                    )}
                    {hasDiscount && (
                        <Badge className="bg-red-500/90 text-white text-[10px] px-2 py-0.5">
                            {discountPercent}% OFF
                        </Badge>
                    )}
                </div>

                {/* Veg/Non-veg Indicator */}
                <div className="absolute top-2 right-2">
                    <div className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center bg-white/80 ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`} />
                    </div>
                </div>

                {/* Spicy Indicator */}
                {item.is_spicy && (
                    <div className="absolute bottom-2 right-2 bg-white/80 rounded-full p-1">
                        <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm sm:text-base truncate">
                            {item.name}
                        </h4>
                        {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                        )}
                    </div>
                    {!selectionMode && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => router.push(`/dashboard/menu/${item.id}`)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onEdit}>
                                    <Pencil className="h-4 w-4 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={onDelete} className="text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-3">
                    <span className="font-bold text-lg text-foreground">₹{item.price}</span>
                    {hasDiscount && (
                        <span className="text-xs text-muted-foreground line-through">₹{item.compare_at_price}</span>
                    )}
                </div>

                {/* Prep Time & Toggle */}
                <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {item.preparation_time_mins ? (
                            <>
                                <Clock className="h-4 w-4" />
                                <span>{item.preparation_time_mins}m</span>
                            </>
                        ) : (
                            <span>Stock</span>
                        )}
                    </div>
                    {!selectionMode && (
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
                    )}
                </div>
            </div>
        </div>
    )
}
