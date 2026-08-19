'use client'

import Image from 'next/image'
import { Plus, Leaf, Flame } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/hooks/use-cart'
import { toast } from 'sonner'

interface MenuItem {
    id: string
    name: string
    description?: string | null
    price: number
    image_url?: string | null
    is_veg: boolean
    is_spicy: boolean
    is_bestseller: boolean
    is_featured: boolean
}

interface MenuItemCardProps {
    item: MenuItem
}

export function MenuItemCard({ item }: MenuItemCardProps) {
    const { addItem } = useCart()

    const handleAddToCart = () => {
        addItem({
            id: item.id,
            name: item.name,
            price: item.price,
            image_url: item.image_url,
            is_veg: item.is_veg,
        })
        toast.success(`${item.name} added to cart`)
    }

    return (
        <div className="group border rounded-lg overflow-hidden bg-card hover:shadow-md transition-shadow">
            <div className="relative aspect-video bg-muted">
                {item.image_url ? (
                    <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        className="object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        No image
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {item.is_veg ? (
                        <Badge variant="secondary" className="bg-green-500/90 text-white gap-1">
                            <Leaf className="h-3 w-3" />
                            Veg
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-red-500/90 text-white gap-1">
                            <Leaf className="h-3 w-3" />
                            Non-Veg
                        </Badge>
                    )}
                    {item.is_spicy && (
                        <Badge variant="secondary" className="bg-orange-500/90 text-white gap-1">
                            <Flame className="h-3 w-3" />
                            Spicy
                        </Badge>
                    )}
                </div>

                {item.is_bestseller && (
                    <Badge className="absolute top-2 right-2 bg-yellow-500 text-black">
                        ⭐ Bestseller
                    </Badge>
                )}
            </div>

            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                    <span className="font-bold text-primary whitespace-nowrap">
                        ₹{item.price}
                    </span>
                </div>

                {item.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {item.description}
                    </p>
                )}

                <Button
                    onClick={handleAddToCart}
                    className="w-full"
                    size="sm"
                >
                    <Plus className="h-4 w-4 mr-1" />
                    Add to Cart
                </Button>
            </div>
        </div>
    )
}
