'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, House, RotateCcw, Search, ShoppingCart, UtensilsCrossed } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { CartDrawer } from './cart-drawer'
import { CustomerHeader } from './customer-header'
import { LocationInitializer } from './location-initializer'
import { useCart } from '@/hooks/use-cart'
import { createClient } from '@/lib/supabase/client'

interface Restaurant {
    id: string
    name: string
    slug: string
    is_online?: boolean | null
    logo_url?: string | null
    image_url?: string | null
    description?: string | null
    city?: string | null
    address_line1?: string | null
}

interface StorefrontShellProps {
    restaurant: Restaurant
    user?: User | null
    activeOrders?: Array<{
        id: string
        status: string
        order_number?: string | null
    }>
    currentTab?: 'home' | 'menu' | 'buy-again' | 'search'
    showHeader?: boolean
    children: React.ReactNode
}

export function StorefrontShell({
    restaurant,
    user,
    activeOrders = [],
    currentTab = 'home',
    showHeader = false,
    children,
}: StorefrontShellProps) {
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [activeOrderIndex, setActiveOrderIndex] = useState(0)
    const [liveActiveOrders, setLiveActiveOrders] = useState(activeOrders)
    const { items: cartItems } = useCart()
    const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    const cartPreviewItems = cartItems.slice(0, 3)
    const currentActiveOrder = liveActiveOrders[activeOrderIndex]
    const activeOrderStatusLabel = useMemo(() => {
        if (!currentActiveOrder?.status) return null
        const map: Record<string, string> = {
            pending: 'Order placed',
            confirmed: 'Order confirmed',
            preparing: 'Order is preparing',
            ready: 'Order is ready',
            out_for_delivery: 'Order is on the way',
        }
        return map[currentActiveOrder.status] || 'Order update'
    }, [currentActiveOrder])

    useEffect(() => {
        setLiveActiveOrders(activeOrders)
    }, [activeOrders])

    useEffect(() => {
        if (activeOrderIndex >= liveActiveOrders.length) setActiveOrderIndex(0)
    }, [activeOrderIndex, liveActiveOrders.length])

    useEffect(() => {
        if (liveActiveOrders.length <= 1) return
        const interval = window.setInterval(() => {
            setActiveOrderIndex((prev) => (prev + 1) % liveActiveOrders.length)
        }, 3500)
        return () => window.clearInterval(interval)
    }, [liveActiveOrders.length])

    useEffect(() => {
        if (!user?.id) return

        const supabase = createClient()
        const allowedStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'out_for_delivery']

        const loadActiveOrders = async () => {
            const { data } = await supabase
                .from('orders')
                .select('id, status, order_number')
                .eq('user_id', user.id)
                .in('status', allowedStatuses)
                .order('created_at', { ascending: false })
                .limit(5)

            setLiveActiveOrders((data || []).map((order) => ({
                id: order.id,
                status: order.status,
                order_number: order.order_number,
            })))
        }

        void loadActiveOrders()

        const channel = supabase
            .channel(`customer-active-orders-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `user_id=eq.${user.id}`,
                },
                () => {
                    void loadActiveOrders()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [user?.id])

    const bottomPad =
        cartItemCount > 0 && currentActiveOrder
            ? 'pb-56'
            : cartItemCount > 0 || currentActiveOrder
                ? 'pb-44'
                : 'pb-28'

    return (
        <div className="mx-auto min-h-screen w-full max-w-lg bg-background text-foreground md:border-x md:border-border/60 md:shadow-[0_0_0_1px_hsl(var(--border)),0_18px_45px_-20px_rgba(0,0,0,0.45)]">
            <LocationInitializer userId={user?.id} />
            {showHeader ? <CustomerHeader restaurant={restaurant} user={user} /> : null}

            {restaurant.is_online === false && (
                <div className="border-b border-amber-500/30 bg-amber-500/10">
                    <div className="mx-auto w-full px-3 py-2 text-sm text-amber-700 dark:text-amber-200">
                        This restaurant is currently offline. You can browse the menu, but orders are temporarily disabled.
                    </div>
                </div>
            )}

            <div className={bottomPad}>{children}</div>

            {currentActiveOrder && (
                <div className={`fixed left-1/2 z-40 w-full max-w-lg -translate-x-1/2 px-3 ${cartItemCount > 0 ? 'bottom-36' : 'bottom-20'}`}>
                    <Link
                        href={`/orders/${currentActiveOrder.id}`}
                        className="mx-auto flex h-14 w-full items-center justify-between rounded-2xl bg-primary px-3.5 text-primary-foreground shadow-lg"
                    >
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{activeOrderStatusLabel}</p>
                            <p className="truncate text-[11px] text-primary-foreground/70">
                                Order #{currentActiveOrder.order_number || currentActiveOrder.id.slice(0, 8)}
                            </p>
                            {liveActiveOrders.length > 1 ? (
                                <div className="mt-1 flex gap-1">
                                    {liveActiveOrders.map((order, idx) => (
                                        <span
                                            key={order.id}
                                            className={`h-1.5 rounded-full ${idx === activeOrderIndex ? 'w-4 bg-primary-foreground' : 'w-1.5 bg-primary-foreground/40'}`}
                                        />
                                    ))}
                                </div>
                            ) : null}
                        </div>
                        <span className="flex items-center gap-1 text-sm font-semibold">
                            View
                            <ChevronRight className="h-4 w-4" />
                        </span>
                    </Link>
                </div>
            )}

            {cartItemCount > 0 && (
                <div className="fixed bottom-20 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 px-3">
                    <button
                        type="button"
                        onClick={() => setIsCartOpen(true)}
                        className="mx-auto flex h-14 w-full items-center justify-between rounded-2xl bg-primary px-3.5 text-primary-foreground shadow-lg"
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex -space-x-2">
                                {cartPreviewItems.map((item) => (
                                    <div key={item.id} className="h-8 w-8 overflow-hidden rounded-full border border-primary-foreground/35 bg-primary-foreground/15">
                                        {item.image_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <ShoppingCart className="h-3.5 w-3.5 text-primary-foreground/80" />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <p className="truncate text-sm font-medium">
                                {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} added
                            </p>
                        </div>
                        <span className="flex items-center gap-1 text-sm font-semibold">
                            View cart
                            <ChevronRight className="h-4 w-4" />
                        </span>
                    </button>
                </div>
            )}

            <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 border-t border-border/70 bg-background/95 backdrop-blur">
                <div className="mx-auto grid h-16 w-full grid-cols-4 px-1">
                    <Link
                        href={`/r/${restaurant.slug}`}
                        className={`flex flex-col items-center justify-center text-[11px] ${currentTab === 'home' ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        <House className="mb-1 h-4 w-4" />
                        Home
                    </Link>
                    <Link
                        href={`/r/${restaurant.slug}/menu`}
                        className={`flex flex-col items-center justify-center text-[11px] ${currentTab === 'menu' ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        <UtensilsCrossed className="mb-1 h-4 w-4" />
                        Menu
                    </Link>
                    <Link
                        href={`/r/${restaurant.slug}/search`}
                        className={`flex flex-col items-center justify-center text-[11px] ${currentTab === 'search' ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        <Search className="mb-1 h-4 w-4" />
                        Search
                    </Link>
                    <Link
                        href={`/r/${restaurant.slug}/buy-again`}
                        className={`flex flex-col items-center justify-center text-[11px] ${currentTab === 'buy-again' ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        <RotateCcw className="mb-1 h-4 w-4" />
                        Buy Again
                    </Link>
                </div>
            </nav>

            <CartDrawer
                open={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                restaurant={restaurant}
            />
        </div>
    )
}
