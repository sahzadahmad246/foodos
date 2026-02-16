'use client'

import Image from 'next/image'
import Link from 'next/link'
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
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

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col">
                <SheetHeader className="p-6 pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <SheetTitle>Your Cart</SheetTitle>
                            <SheetDescription>
                                {itemCount} {itemCount === 1 ? 'item' : 'items'}
                            </SheetDescription>
                        </div>
                        {items.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    clearCart()
                                    onClose()
                                }}
                                className="text-destructive"
                            >
                                Clear All
                            </Button>
                        )}
                    </div>
                </SheetHeader>

                {items.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                        <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="font-semibold text-lg mb-2">Your cart is empty</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                            Add items from the menu to get started
                        </p>
                        <Button onClick={onClose}>Browse Menu</Button>
                    </div>
                ) : (
                    <>
                        <ScrollArea className="flex-1 p-6">
                            <div className="space-y-4">
                                {items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex gap-4 p-4 border rounded-lg"
                                    >
                                        <div className="relative h-20 w-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                                            {item.image_url ? (
                                                <Image
                                                    src={item.image_url}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                                                    No image
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <h4 className="font-medium line-clamp-1">{item.name}</h4>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 flex-shrink-0"
                                                    onClick={() => removeItem(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <p className="text-sm font-semibold text-primary mb-3">
                                                ₹{item.price}
                                            </p>

                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <span className="w-8 text-center font-medium">
                                                    {item.quantity}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="border-t p-6 space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-semibold text-lg">
                                    <span>Total</span>
                                    <span>₹{total.toFixed(2)}</span>
                                </div>
                            </div>

                            {restaurant.is_online === false && (
                                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                                    Restaurant is not accepting orders currently.
                                </p>
                            )}

                            <Button
                                asChild
                                className="w-full"
                                size="lg"
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
