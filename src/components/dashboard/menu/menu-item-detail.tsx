"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import {
    ArrowLeft,
    Clock,
    Users,
    Flame,
    Star,
    Sparkles,
    Pencil,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { toggleItemAvailable } from "@/app/dashboard/menu/actions"
import { EditItemDialog } from "@/components/dashboard/menu/edit-item-dialog"

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
    serves?: number | null
    portion_size?: string | null
    calories?: number | null
    tags?: string[] | null
    category?: { id: string; name: string } | null
}

interface MenuItemDetailProps {
    item: MenuItem
    categories: Category[]
}

export function MenuItemDetail({ item, categories }: MenuItemDetailProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [showEditDialog, setShowEditDialog] = useState(false)

    const handleToggleAvailable = (checked: boolean) => {
        startTransition(async () => {
            const result = await toggleItemAvailable(item.id, checked)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success(checked ? "Item is now available" : "Item marked as out of stock")
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
            <div className="space-y-6 pb-8">
                {/* Back Button */}
                <Link
                    href="/dashboard/menu"
                    className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="text-sm">Back to Menu</span>
                </Link>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Image Section */}
                    <div className="relative aspect-square lg:aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                        {item.image_url ? (
                            <Image src={item.image_url} alt={item.name} fill className="object-cover" priority />
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <span className="text-lg">No image</span>
                            </div>
                        )}

                        {/* Badges on image */}
                        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                            {item.is_bestseller && (
                                <Badge className="bg-yellow-500 text-white">
                                    <Star className="h-3 w-3 mr-1" />
                                    Bestseller
                                </Badge>
                            )}
                            {item.is_new && (
                                <Badge className="bg-blue-500 text-white">
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    New
                                </Badge>
                            )}
                            {item.is_featured && <Badge className="bg-purple-500 text-white">Featured</Badge>}
                            {hasDiscount && <Badge className="bg-red-500 text-white">{discountPercent}% OFF</Badge>}
                        </div>

                        {/* Veg/Non-veg indicator */}
                        <div className="absolute top-4 right-4">
                            <div
                                className={`w-7 h-7 border-2 rounded flex items-center justify-center bg-white ${item.is_veg ? "border-green-600" : "border-red-600"}`}
                            >
                                <div className={`w-4 h-4 rounded-full ${item.is_veg ? "bg-green-600" : "bg-red-600"}`} />
                            </div>
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="space-y-6">
                        {/* Header */}
                        <div>
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h1 className="text-2xl sm:text-3xl font-bold">{item.name}</h1>
                                    {item.category && <p className="text-muted-foreground mt-1">{item.category.name}</p>}
                                </div>
                                <Button variant="outline" size="icon" onClick={() => setShowEditDialog(true)}>
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Price */}
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-primary">₹{item.price}</span>
                            {hasDiscount && (
                                <span className="text-lg text-muted-foreground line-through">₹{item.compare_at_price}</span>
                            )}
                        </div>

                        {/* Description */}
                        {item.description && <p className="text-muted-foreground leading-relaxed">{item.description}</p>}

                        {/* Quick Info */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {item.preparation_time_mins && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>{item.preparation_time_mins} mins</span>
                                </div>
                            )}
                            {item.serves && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>Serves {item.serves}</span>
                                </div>
                            )}
                            {item.is_spicy && (
                                <div className="flex items-center gap-2 text-sm">
                                    <Flame className="h-4 w-4 text-orange-500" />
                                    <span>Spicy</span>
                                </div>
                            )}
                            {item.calories && (
                                <div className="flex items-center gap-2 text-sm">
                                    <span className="text-muted-foreground">🔥</span>
                                    <span>{item.calories} kcal</span>
                                </div>
                            )}
                        </div>

                        {/* Stock Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                            <div>
                                <p className="font-medium">Availability</p>
                                <p className="text-sm text-muted-foreground">
                                    {item.is_available ? "Item is available for orders" : "Item is out of stock"}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-sm font-medium ${item.is_available ? "text-green-600" : "text-red-500"}`}>
                                    {item.is_available ? "In Stock" : "Out of Stock"}
                                </span>
                                <Switch
                                    checked={item.is_available}
                                    onCheckedChange={handleToggleAvailable}
                                    disabled={isPending}
                                />
                            </div>
                        </div>

                        {/* Additional Details */}
                        {(item.portion_size || (item.tags && item.tags.length > 0)) && (
                            <div className="space-y-3 pt-4 border-t">
                                {item.portion_size && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Portion Size</span>
                                        <span>{item.portion_size}</span>
                                    </div>
                                )}
                                {item.tags && item.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {item.tags.map((tag: string) => (
                                            <Badge key={tag} variant="secondary">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            <EditItemDialog item={item} categories={categories} open={showEditDialog} onOpenChange={setShowEditDialog} />
        </>
    )
}
