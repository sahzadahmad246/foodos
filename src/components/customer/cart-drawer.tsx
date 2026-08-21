'use client'

import Link from 'next/link'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetTitle,
} from '@/components/ui/sheet'
import { useCart } from '@/hooks/use-cart'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Restaurant {
    id: string
    name: string
    slug: string
    is_online?: boolean | null
}

interface CartDrawerProps {
    open: boolean
    onClose: () => void
    restaurant: Restaurant
}

export function CartDrawer({ open, onClose, restaurant }: CartDrawerProps) {
    const { items, updateQuantity, removeItem, getTotal, clearCart } = useCart()

    const total = getTotal()
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
    const compareTotal = items.reduce((sum, item) => {
        const comparePrice = item.compare_at_price && item.compare_at_price > item.price
            ? item.compare_at_price
            : item.price
        return sum + comparePrice * item.quantity
    }, 0)
    const savedAmount = Math.max(0, compareTotal - total)

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent side="right" className="flex w-full flex-col bg-background p-0 text-foreground sm:max-w-lg [&>button]:hidden">
                <div className="border-b border-border/70 bg-background px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 shrink-0 rounded-full"
                            onClick={onClose}
                            aria-label="Close cart"
                        >
                            <X className="h-4 w-4 text-foreground/80" />
                        </Button>
                        <div className="min-w-0 flex-1 text-center">
                            <SheetTitle className="truncate text-lg font-bold text-foreground">Order Summary</SheetTitle>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                                {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </p>
                        </div>
                        <div className="w-9 shrink-0" />
                    </div>
                    {items.length > 0 ? (
                        <div className="mt-2 flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    clearCart()
                                    onClose()
                                }}
                                className="h-7 rounded-full px-3 text-xs font-semibold text-foreground/80 hover:bg-muted hover:text-foreground"
                            >
                                Clear Cart
                            </Button>
                        </div>
                    ) : null}
                </div>

                {items.length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                        <div className="mb-4 rounded-2xl bg-card p-4">
                            <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-foreground">Your cart is empty</h3>
                        <p className="mb-6 max-w-xs text-sm text-muted-foreground">
                            Start adding items from the menu to place your order
                        </p>
                        <Button onClick={onClose} className="h-10 rounded-xl bg-primary px-6 text-primary-foreground hover:bg-primary/90">
                            Browse Menu
                        </Button>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-1 px-5 py-4">
                            <div className="overflow-hidden rounded-xl border border-border/70 bg-card/70 shadow-sm">
                                <div className="px-4 py-4">
                                    <h3 className="font-semibold text-foreground">Your items ({items.length})</h3>
                                </div>
                                <div className="divide-y">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                            className="p-4"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 h-4 w-4 rounded-sm border-2 p-[2px] ${item.is_veg ? 'border-emerald-600' : 'border-rose-600'}`}>
                                                <div className={`h-full w-full rounded-[2px] ${item.is_veg ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="line-clamp-1 text-[15px] font-medium text-foreground">{item.name}</p>
                                                <p className="mt-0.5 text-xs text-muted-foreground">₹{item.price} each</p>
                                                <button
                                                    type="button"
                                                    className="mt-1 text-xs font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
                                                    onClick={() => removeItem(item.id)}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <div className="inline-flex items-center overflow-hidden rounded-lg border border-border bg-muted/50">
                                                    <button
                                                        type="button"
                                                        className="h-8 w-8 text-foreground/90 transition-colors hover:bg-muted hover:text-primary"
                                                        onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id)}
                                                    >
                                                        {item.quantity === 1 ? <Trash2 className="mx-auto h-3.5 w-3.5" /> : <Minus className="mx-auto h-3.5 w-3.5" />}
                                                    </button>
                                                    <span className="w-8 text-center text-base font-semibold">{item.quantity}</span>
                                                    <button
                                                        type="button"
                                                        className="h-8 w-8 text-foreground/90 transition-colors hover:bg-muted hover:text-primary"
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    >
                                                        <Plus className="mx-auto h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                                <p className="mt-1.5 text-lg font-semibold text-foreground">₹{(item.price * item.quantity).toFixed(0)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                </div>
                                <div className="border-t px-4 py-3">
                                    <Link href={`/r/${restaurant.slug}/menu`} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
                                        + Add more items
                                    </Link>
                                </div>
                            </div>
                        </ScrollArea>

                        <div className="flex flex-col gap-4 border-t border-border/70 bg-background px-5 py-4">
                            <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/70 p-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-foreground/80">Item Total</span>
                                    <span className="font-medium text-foreground">₹{total.toFixed(0)}</span>
                                </div>
                                <div className="flex items-center justify-between border-t border-border/80 pt-3">
                                    <div className="flex items-center gap-2 text-base font-bold text-foreground">
                                        <span>Total Bill</span>
                                        {savedAmount > 0 ? (
                                            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                                                You saved ₹{savedAmount.toFixed(0)}
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="text-right">
                                        {savedAmount > 0 ? (
                                            <p className="text-xs text-muted-foreground line-through">₹{compareTotal.toFixed(0)}</p>
                                        ) : null}
                                        <p className="text-lg font-bold text-foreground">₹{total.toFixed(0)}</p>
                                    </div>
                                </div>
                            </div>

                            {restaurant.is_online === false && (
                                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-200">
                                    ⚠️ Restaurant is not accepting orders currently
                                </div>
                            )}

                            <Button
                                asChild
                                className={`h-12 w-full rounded-lg font-semibold text-base transition-all ${
                                    restaurant.is_online === false
                                        ? 'cursor-not-allowed bg-muted text-muted-foreground'
                                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                                }`}
                                disabled={restaurant.is_online === false}
                            >
                                <Link
                                    href={restaurant.is_online === false ? '#' : `/r/${restaurant.slug}/checkout`}
                                    aria-disabled={restaurant.is_online === false}
                                    onClick={(e) => {
                                        if (restaurant.is_online === false) e.preventDefault()
                                    }}
                                >
                                    Proceed to Checkout
                                </Link>
                            </Button>
                        </div>
                    </>
                )}
            </SheetContent>
        </Sheet>
    )
}
