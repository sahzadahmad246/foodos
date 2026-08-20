'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Minus, Leaf, Flame, Clock3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCart } from '@/hooks/use-cart'
import { toast } from 'sonner'

interface MenuItem {
    id: string
    name: string
    description?: string | null
    short_description?: string | null
    price: number
    compare_at_price?: number | null
    image_url?: string | null
    is_veg: boolean
    is_spicy: boolean
    is_bestseller: boolean
    is_featured: boolean
    is_new?: boolean
    spice_level?: number
    preparation_time_mins?: number
    portion_size?: string | null
    serves?: number | null
    calories?: number | null
    protein_grams?: number | null
    carbs_grams?: number | null
    fat_grams?: number | null
    dietary_tags?: string[] | null
    allergens?: string[] | null
    has_variants?: boolean
    has_addons?: boolean
}

interface MenuItemCardProps {
    item: MenuItem
}

export function MenuItemCard({ item }: MenuItemCardProps) {
    const { addItem, updateQuantity, items } = useCart()
    const [open, setOpen] = useState(false)
    const cartItem = items.find((cart) => cart.id === item.id)
    const quantityInCart = cartItem?.quantity ?? 0

    const handleAddToCart = () => {
        addItem({
            id: item.id,
            name: item.name,
            price: item.price,
            compare_at_price: item.compare_at_price,
            image_url: item.image_url,
            is_veg: item.is_veg,
        })
        toast.success(`${item.name} added to cart`)
    }

    return (
        <>
            <div
                className="group overflow-hidden rounded-xl border border-border/70 bg-card/70 transition hover:-translate-y-0.5 hover:border-primary/50 hover:bg-card hover:shadow-lg"
                onClick={() => setOpen(true)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setOpen(true)
                    }
                }}
            >
                <div className="flex items-stretch">
                    <div className="relative min-h-[132px] w-28 shrink-0 overflow-hidden bg-muted sm:w-32">
                        {item.image_url ? (
                            <Image
                                src={item.image_url}
                                alt={item.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                No image
                            </div>
                        )}
                        {item.is_bestseller && (
                            <Badge className="absolute left-1 top-1 bg-amber-500 text-black text-[10px] px-1.5 py-0.5">
                                Bestseller
                            </Badge>
                        )}
                    </div>

                    <div className="min-w-0 flex-1 p-3 sm:p-4">
                        <div className="mb-1 flex items-center gap-2">
                            <p className="line-clamp-1 font-semibold">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-primary">₹{item.price}</p>
                            {item.compare_at_price && Number(item.compare_at_price) > Number(item.price) && (
                                <p className="text-xs text-muted-foreground line-through">₹{item.compare_at_price}</p>
                            )}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Badge
                                variant="outline"
                                className={item.is_veg ? 'border-green-600 text-green-700 dark:text-green-400' : 'border-red-600 text-red-700 dark:text-red-400'}
                            >
                                <Leaf className="mr-1 h-3 w-3" />
                                {item.is_veg ? 'Veg' : 'Non-Veg'}
                            </Badge>
                            <Badge variant="outline" className="border-slate-400/60 text-slate-600 dark:text-slate-300">
                                <Clock3 className="mr-1 h-3 w-3" />
                                {item.preparation_time_mins || 20} min
                            </Badge>
                            {item.is_spicy && (
                                <Badge variant="outline" className="border-orange-500 text-orange-600 dark:text-orange-400">
                                    <Flame className="mr-1 h-3 w-3" />
                                    Spicy
                                </Badge>
                            )}
                        </div>
                        <div className="mt-3">
                            {quantityInCart > 0 ? (
                                <div
                                    className="inline-flex items-center gap-1 rounded-full border bg-background p-1"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-full border-0"
                                        onClick={() => updateQuantity(item.id, quantityInCart - 1)}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-7 text-center text-sm font-semibold">{quantityInCart}</span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-full border-0"
                                        onClick={handleAddToCart}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleAddToCart()
                                    }}
                                    size="sm"
                                    className="h-8 rounded-full px-4"
                                >
                                    <Plus className="mr-1 h-4 w-4" />
                                    Add
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md p-0 overflow-hidden">
                    <div className="relative h-56 w-full bg-muted">
                        {item.image_url ? (
                            <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                        ) : (
                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                No image
                            </div>
                        )}
                    </div>
                    <div className="p-4">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <span className={`inline-block h-2.5 w-2.5 rounded-full ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`} />
                                {item.name}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="mt-3 flex flex-wrap gap-2">
                            <Badge variant={item.is_veg ? 'secondary' : 'destructive'}>
                                <Leaf className="mr-1 h-3 w-3" />
                                {item.is_veg ? 'Veg' : 'Non-Veg'}
                            </Badge>
                            <Badge variant="outline">
                                <Clock3 className="mr-1 h-3 w-3" />
                                {item.preparation_time_mins || 20} min prep
                            </Badge>
                            {item.is_spicy && (
                                <Badge variant="secondary" className="bg-orange-500 text-white">
                                    <Flame className="mr-1 h-3 w-3" />
                                    Spicy
                                </Badge>
                            )}
                            {item.is_bestseller && (
                                <Badge className="bg-amber-500 text-black">Bestseller</Badge>
                            )}
                            {item.is_featured && (
                                <Badge variant="outline">Featured</Badge>
                            )}
                            {item.is_new && (
                                <Badge variant="outline">New</Badge>
                            )}
                            {item.has_variants && (
                                <Badge variant="outline">Variants</Badge>
                            )}
                            {item.has_addons && (
                                <Badge variant="outline">Add-ons</Badge>
                            )}
                        </div>

                        {(item.short_description || item.description) && (
                            <p className="mt-3 text-sm text-muted-foreground">{item.short_description || item.description}</p>
                        )}

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            {item.portion_size && (
                                <div className="rounded-md border p-2">
                                    <p className="text-muted-foreground">Portion</p>
                                    <p className="font-medium">{item.portion_size}</p>
                                </div>
                            )}
                            {item.serves ? (
                                <div className="rounded-md border p-2">
                                    <p className="text-muted-foreground">Serves</p>
                                    <p className="font-medium">{item.serves}</p>
                                </div>
                            ) : null}
                            {item.calories ? (
                                <div className="rounded-md border p-2">
                                    <p className="text-muted-foreground">Calories</p>
                                    <p className="font-medium">{item.calories} kcal</p>
                                </div>
                            ) : null}
                            {typeof item.spice_level === 'number' && item.spice_level > 0 ? (
                                <div className="rounded-md border p-2">
                                    <p className="text-muted-foreground">Spice Level</p>
                                    <p className="font-medium">{item.spice_level}/5</p>
                                </div>
                            ) : null}
                        </div>

                        {(item.protein_grams || item.carbs_grams || item.fat_grams) && (
                            <div className="mt-3 rounded-md border p-2 text-xs">
                                <p className="mb-1 font-medium">Nutrition</p>
                                <div className="flex flex-wrap gap-3 text-muted-foreground">
                                    {item.protein_grams ? <span>Protein {item.protein_grams}g</span> : null}
                                    {item.carbs_grams ? <span>Carbs {item.carbs_grams}g</span> : null}
                                    {item.fat_grams ? <span>Fat {item.fat_grams}g</span> : null}
                                </div>
                            </div>
                        )}

                        {item.dietary_tags && item.dietary_tags.length > 0 && (
                            <div className="mt-3">
                                <p className="mb-1 text-xs font-medium text-muted-foreground">Dietary Tags</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {item.dietary_tags.map((tag) => (
                                        <Badge key={tag} variant="outline">{tag}</Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {item.allergens && item.allergens.length > 0 && (
                            <div className="mt-3 rounded-md border border-amber-400/40 bg-amber-50/40 p-2 text-xs text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/20 dark:text-amber-300">
                                <p className="font-medium">Allergens</p>
                                <p>{item.allergens.join(', ')}</p>
                            </div>
                        )}

                        <div className="mt-4 flex items-center justify-between">
                            <div>
                                <p className="text-xl font-bold">₹{item.price}</p>
                                {item.compare_at_price && Number(item.compare_at_price) > Number(item.price) && (
                                    <p className="text-xs text-muted-foreground line-through">₹{item.compare_at_price}</p>
                                )}
                            </div>
                            {quantityInCart > 0 ? (
                                <div className="inline-flex items-center gap-1 rounded-full border bg-background p-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-full border-0"
                                        onClick={() => updateQuantity(item.id, quantityInCart - 1)}
                                    >
                                        <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-7 text-center text-sm font-semibold">{quantityInCart}</span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8 rounded-full border-0"
                                        onClick={handleAddToCart}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    onClick={() => {
                                        handleAddToCart()
                                        setOpen(false)
                                    }}
                                >
                                    <Plus className="mr-1 h-4 w-4" />
                                    Add to Cart
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
