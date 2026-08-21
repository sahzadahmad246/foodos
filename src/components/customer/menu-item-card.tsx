'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Plus, Minus, Flame, Clock3, UtensilsCrossed, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useCart } from '@/hooks/use-cart'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface MenuItem {
    id: string
    name: string
    description?: string | null
    short_description?: string | null
    price: number
    compare_at_price?: number | null
    image_url?: string | null
    category_id?: string | null
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
    variant?: 'row' | 'featured' | 'compact'
    subtitle?: string
    highlightQuery?: string
}

function VegMark({ isVeg, className }: { isVeg: boolean; className?: string }) {
    return (
        <span
            className={cn(
                'inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border',
                isVeg ? 'border-emerald-500' : 'border-rose-500',
                className
            )}
            aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
        >
            <span className={cn('h-1.5 w-1.5 rounded-full', isVeg ? 'bg-emerald-500' : 'bg-rose-500')} />
        </span>
    )
}

function HighlightedText({ text, query }: { text: string; query?: string }) {
    if (!query?.trim()) return <>{text}</>
    const needle = query.trim()
    const index = text.toLowerCase().indexOf(needle.toLowerCase())
    if (index < 0) return <>{text}</>
    return (
        <>
            {text.slice(0, index)}
            <mark className="rounded-sm bg-transparent font-bold text-primary">{text.slice(index, index + needle.length)}</mark>
            {text.slice(index + needle.length)}
        </>
    )
}

function ItemPhoto({
    src,
    alt,
    className,
    sizes,
}: {
    src?: string | null
    alt: string
    className?: string
    sizes: string
}) {
    return (
        <div className={cn('relative overflow-hidden bg-gradient-to-br from-muted via-secondary to-card', className)}>
            {src ? (
                <Image src={src} alt={alt} fill className="object-cover" sizes={sizes} />
            ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                    <UtensilsCrossed className="h-8 w-8 text-muted-foreground/40" />
                </div>
            )}
        </div>
    )
}

function AddControl({
    quantity,
    onAdd,
    onDec,
    className,
}: {
    quantity: number
    onAdd: () => void
    onDec: () => void
    className?: string
}) {
    if (quantity > 0) {
        return (
            <div
                className={cn(
                    'inline-flex h-8 items-center overflow-hidden rounded-lg border border-primary bg-background text-primary shadow-md',
                    className
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <button type="button" className="flex h-8 w-8 items-center justify-center hover:bg-primary/10" onClick={onDec} aria-label="Decrease quantity">
                    <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-5 text-center text-sm font-bold">{quantity}</span>
                <button type="button" className="flex h-8 w-8 items-center justify-center hover:bg-primary/10" onClick={onAdd} aria-label="Increase quantity">
                    <Plus className="h-3.5 w-3.5" />
                </button>
            </div>
        )
    }

    return (
        <button
            type="button"
            className={cn(
                'inline-flex h-8 min-w-[68px] items-center justify-center rounded-lg border border-primary bg-background px-3 text-[11px] font-bold uppercase tracking-[0.14em] text-primary shadow-md hover:bg-primary hover:text-primary-foreground',
                className
            )}
            onClick={(e) => {
                e.stopPropagation()
                onAdd()
            }}
        >
            Add
        </button>
    )
}

export function MenuItemCard({ item, variant = 'row', subtitle, highlightQuery }: MenuItemCardProps) {
    const { addItem, updateQuantity, items } = useCart()
    const [open, setOpen] = useState(false)
    const cartItem = items.find((cart) => cart.id === item.id)
    const quantityInCart = cartItem?.quantity ?? 0
    const hasDiscount = item.compare_at_price && Number(item.compare_at_price) > Number(item.price)
    const description = item.short_description || item.description

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

    const handleDec = () => updateQuantity(item.id, quantityInCart - 1)

    const openDetails = () => setOpen(true)

    return (
        <>
            {variant === 'featured' ? (
                <article
                    className="w-[232px] shrink-0 overflow-hidden rounded-2xl border border-border/60 bg-card/80 text-left shadow-sm transition hover:border-primary/40"
                    onClick={openDetails}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            openDetails()
                        }
                    }}
                >
                    <div className="relative">
                        <ItemPhoto src={item.image_url} alt={item.name} className="h-40 w-full" sizes="232px" />
                        <AddControl quantity={quantityInCart} onAdd={handleAddToCart} onDec={handleDec} className="absolute bottom-2 right-2" />
                        {item.is_bestseller ? (
                            <span className="absolute left-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-black">
                                Bestseller
                            </span>
                        ) : null}
                    </div>
                    <div className="space-y-1 p-3">
                        <div className="flex items-start gap-1.5">
                            <VegMark isVeg={item.is_veg} className="mt-1" />
                            <p className="line-clamp-2 text-sm font-semibold leading-snug">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-2 pl-5">
                            <p className="text-sm font-bold text-primary">₹{item.price}</p>
                            {hasDiscount ? <p className="text-xs text-muted-foreground line-through">₹{item.compare_at_price}</p> : null}
                        </div>
                    </div>
                </article>
            ) : variant === 'compact' ? (
                <article
                    className="flex w-[168px] shrink-0 flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/80 text-left"
                    onClick={openDetails}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            openDetails()
                        }
                    }}
                >
                    <div className="relative">
                        <ItemPhoto src={item.image_url} alt={item.name} className="h-28 w-full" sizes="168px" />
                        <AddControl quantity={quantityInCart} onAdd={handleAddToCart} onDec={handleDec} className="absolute bottom-2 right-2" />
                    </div>
                    <div className="space-y-1 p-2.5">
                        <div className="flex items-start gap-1.5">
                            <VegMark isVeg={item.is_veg} className="mt-0.5" />
                            <p className="line-clamp-2 text-[13px] font-semibold leading-snug">{item.name}</p>
                        </div>
                        {subtitle ? <p className="pl-5 text-[10px] font-medium text-primary/80">{subtitle}</p> : null}
                        <p className="pl-5 text-sm font-bold text-primary">₹{item.price}</p>
                    </div>
                </article>
            ) : (
                <article
                    className="group flex gap-3 rounded-2xl border border-border/50 bg-card/50 p-3 text-left transition hover:border-primary/40 hover:bg-card"
                    onClick={openDetails}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            openDetails()
                        }
                    }}
                >
                    <div className="min-w-0 flex-1 py-0.5">
                        <div className="mb-1.5 flex items-center gap-1.5">
                            <VegMark isVeg={item.is_veg} />
                            {item.is_bestseller ? (
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-400">Bestseller</span>
                            ) : null}
                            {item.is_new ? (
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">New</span>
                            ) : null}
                            {item.is_spicy ? <Flame className="h-3 w-3 text-orange-400" /> : null}
                        </div>
                        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug">
                            <HighlightedText text={item.name} query={highlightQuery} />
                        </h3>
                        {subtitle ? <p className="mt-1 text-[11px] font-medium text-primary/90">{subtitle}</p> : null}
                        {description ? (
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
                        ) : null}
                        <div className="mt-2 flex items-center gap-2">
                            <p className="text-[15px] font-bold text-foreground">₹{item.price}</p>
                            {hasDiscount ? <p className="text-xs text-muted-foreground line-through">₹{item.compare_at_price}</p> : null}
                            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Clock3 className="h-3 w-3" />
                                {item.preparation_time_mins || 20} min
                            </span>
                        </div>
                    </div>
                    <div className="relative w-[108px] shrink-0">
                        <ItemPhoto src={item.image_url} alt={item.name} className="h-[108px] w-[108px] rounded-xl" sizes="108px" />
                        <AddControl
                            quantity={quantityInCart}
                            onAdd={handleAddToCart}
                            onDec={handleDec}
                            className="absolute bottom-2 left-1/2 -translate-x-1/2"
                        />
                    </div>
                </article>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="top-auto bottom-0 left-1/2 flex max-h-[92vh] w-full max-w-lg translate-x-[-50%] translate-y-0 flex-col gap-0 overflow-hidden rounded-t-3xl border-border/70 bg-background p-0 sm:top-[50%] sm:bottom-auto sm:translate-y-[-50%] sm:rounded-2xl"
                >
                    <div className="relative shrink-0">
                        <ItemPhoto src={item.image_url} alt={item.name} className="h-56 w-full sm:h-64" sizes="512px" />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/20" />
                        <DialogClose className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/85 text-foreground shadow-md backdrop-blur hover:bg-background">
                            <X className="h-4 w-4" />
                            <span className="sr-only">Close</span>
                        </DialogClose>
                        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-1.5">
                            {item.is_bestseller ? (
                                <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-black">Bestseller</span>
                            ) : null}
                            {item.is_new ? (
                                <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">New</span>
                            ) : null}
                            {item.is_featured ? (
                                <span className="rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-semibold text-foreground backdrop-blur">Featured</span>
                            ) : null}
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                        <DialogTitle className="flex items-start gap-2 text-left text-xl font-semibold leading-snug">
                            <VegMark isVeg={item.is_veg} className="mt-1.5" />
                            <span>{item.name}</span>
                        </DialogTitle>

                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card px-2.5 py-1 text-[11px] text-muted-foreground">
                                <Clock3 className="h-3 w-3" />
                                {item.preparation_time_mins || 20} min
                            </span>
                            {item.is_spicy ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-[11px] font-medium text-orange-300">
                                    <Flame className="h-3 w-3" />
                                    Spicy
                                </span>
                            ) : null}
                            {item.has_variants ? (
                                <span className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground">Variants</span>
                            ) : null}
                            {item.has_addons ? (
                                <span className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground">Add-ons</span>
                            ) : null}
                        </div>

                        {description ? <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{description}</p> : null}

                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                            {item.portion_size ? (
                                <div className="rounded-xl border border-border/60 bg-card/70 p-3">
                                    <p className="text-muted-foreground">Portion</p>
                                    <p className="mt-0.5 font-semibold">{item.portion_size}</p>
                                </div>
                            ) : null}
                            {item.serves ? (
                                <div className="rounded-xl border border-border/60 bg-card/70 p-3">
                                    <p className="text-muted-foreground">Serves</p>
                                    <p className="mt-0.5 font-semibold">{item.serves}</p>
                                </div>
                            ) : null}
                            {item.calories ? (
                                <div className="rounded-xl border border-border/60 bg-card/70 p-3">
                                    <p className="text-muted-foreground">Calories</p>
                                    <p className="mt-0.5 font-semibold">{item.calories} kcal</p>
                                </div>
                            ) : null}
                            {typeof item.spice_level === 'number' && item.spice_level > 0 ? (
                                <div className="rounded-xl border border-border/60 bg-card/70 p-3">
                                    <p className="text-muted-foreground">Spice Level</p>
                                    <p className="mt-0.5 font-semibold">{item.spice_level}/5</p>
                                </div>
                            ) : null}
                        </div>

                        {(item.protein_grams || item.carbs_grams || item.fat_grams) && (
                            <div className="mt-3 rounded-xl border border-border/60 bg-card/70 p-3 text-xs">
                                <p className="mb-1.5 font-semibold">Nutrition</p>
                                <div className="flex flex-wrap gap-3 text-muted-foreground">
                                    {item.protein_grams ? <span>Protein {item.protein_grams}g</span> : null}
                                    {item.carbs_grams ? <span>Carbs {item.carbs_grams}g</span> : null}
                                    {item.fat_grams ? <span>Fat {item.fat_grams}g</span> : null}
                                </div>
                            </div>
                        )}

                        {item.dietary_tags && item.dietary_tags.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                                {item.dietary_tags.map((tag) => (
                                    <Badge key={tag} variant="outline">{tag}</Badge>
                                ))}
                            </div>
                        )}

                        {item.allergens && item.allergens.length > 0 && (
                            <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                                <p className="font-semibold">Allergens</p>
                                <p className="mt-0.5">{item.allergens.join(', ')}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-background px-4 py-3">
                        <div>
                            <p className="text-xl font-bold text-foreground">₹{item.price}</p>
                            {hasDiscount ? <p className="text-xs text-muted-foreground line-through">₹{item.compare_at_price}</p> : null}
                        </div>
                        <AddControl
                            quantity={quantityInCart}
                            onAdd={() => {
                                handleAddToCart()
                                if (quantityInCart === 0) setOpen(false)
                            }}
                            onDec={handleDec}
                            className={quantityInCart > 0 ? 'h-10 min-w-[108px]' : 'h-10 min-w-[120px] text-xs'}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
