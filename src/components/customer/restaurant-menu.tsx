'use client'

import { useState } from 'react'
import { Search, ShoppingCart, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { MenuItemCard } from './menu-item-card'
import { CartDrawer } from './cart-drawer'
import { CustomerHeader } from './customer-header'
import { LocationInitializer } from './location-initializer'
import { useCart } from '@/hooks/use-cart'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'

interface Restaurant { id: string; name: string; slug: string; description?: string; logo_url?: string | null; image_url?: string; phone?: string; address?: string }
interface Category { id: string; name: string; description?: string | null }
interface MenuItem { id: string; name: string; description?: string | null; price: number; category_id?: string | null; image_url?: string | null; is_veg: boolean; is_spicy: boolean; is_bestseller: boolean; is_featured: boolean }
interface RestaurantMenuProps { restaurant: Restaurant; categories: Category[]; menuItems: MenuItem[]; user?: User | null }

type FilterType = 'all' | 'veg' | 'nonveg' | 'spicy' | 'bestseller'
type SortType = 'popular' | 'price_asc' | 'price_desc' | 'prep_asc'

export function RestaurantMenu({ restaurant, categories, menuItems, buyAgainItems = [], activeOrders = [], user, mode = 'home' }: RestaurantMenuProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [isCartOpen, setIsCartOpen] = useState(false)
    const [activeBottomTab, setActiveBottomTab] = useState<'home' | 'menu' | 'buy-again'>(
        mode === 'menu' ? 'menu' : mode === 'buy-again' ? 'buy-again' : 'home'
    )
    const [filterType, setFilterType] = useState<FilterType>('all')
    const [sortType, setSortType] = useState<SortType>('popular')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [isDesktop, setIsDesktop] = useState(false)
    const [openCategoryIds, setOpenCategoryIds] = useState<Set<string>>(new Set())
    const [featuredIndex, setFeaturedIndex] = useState(0)
    const [compactStickyTabs, setCompactStickyTabs] = useState(false)
    const [activeOrderIndex, setActiveOrderIndex] = useState(0)
    const [liveActiveOrders, setLiveActiveOrders] = useState(activeOrders)
    const BG_SLOT_MS = 10 * 60 * 1000
    const topBgOptions = useMemo(
        () => [
            'bg-[#0b5d66]',
            'bg-[#0b4b63]',
            'bg-[#123d66]',
            'bg-[#1c3a63]',
        ],
        []
    )
    const [bgIndex, setBgIndex] = useState(
        () => Math.floor(Date.now() / BG_SLOT_MS) % topBgOptions.length
    )
    const { items: cartItems } = useCart()
    const filteredItems = menuItems.filter(item => (!searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description?.toLowerCase().includes(searchQuery.toLowerCase())) && (!selectedCategory || item.category_id === selectedCategory))
    const itemsByCategory = categories.map(category => ({ category, items: filteredItems.filter(item => item.category_id === category.id) })).filter(group => group.items.length > 0)
    const uncategorizedItems = filteredItems.filter(item => !item.category_id)
    const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
    const cartPreviewItems = cartItems.slice(0, 3)
    const showAppliedFilterChips = filterType !== 'all' || sortType !== 'popular'
    const restaurantAddress = [
        restaurant.address_line1,
        restaurant.address_line2,
        restaurant.city,
        restaurant.state,
        restaurant.pincode,
    ].filter(Boolean).join(', ')
    const directionsUrl =
        restaurant.latitude !== null &&
            restaurant.latitude !== undefined &&
            restaurant.longitude !== null &&
            restaurant.longitude !== undefined
            ? `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`
            : restaurantAddress
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurantAddress)}`
                : null
    const activeOrderStatusLabel = useMemo(() => {
        const current = liveActiveOrders[activeOrderIndex]
        if (!current?.status) return null
        const map: Record<string, string> = {
            pending: 'Order placed',
            confirmed: 'Order confirmed',
            preparing: 'Order is preparing',
            ready: 'Order is ready',
            out_for_delivery: 'Order is on the way',
        }
        return map[current.status] || 'Order update'
    }, [liveActiveOrders, activeOrderIndex])
    const currentActiveOrder = liveActiveOrders[activeOrderIndex]

    const scrollToSection = (type: 'home' | 'menu' | 'buy-again') => {
        setActiveBottomTab(type)
        if (type === 'home') homeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        if (type === 'menu') menuRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        if (type === 'buy-again') buyAgainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    useEffect(() => {
        const updateViewport = () => setIsDesktop(window.innerWidth >= 1024)
        updateViewport()
        window.addEventListener('resize', updateViewport)
        return () => window.removeEventListener('resize', updateViewport)
    }, [])

    useEffect(() => {
        const onScroll = () => {
            const y = window.scrollY
            setCompactStickyTabs((prev) => {
                // Hysteresis prevents rapid toggle/blink near threshold.
                if (prev) return y > 80
                return y > 140
            })
        }
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        const id = window.setInterval(() => {
            setBgIndex(Math.floor(Date.now() / BG_SLOT_MS) % topBgOptions.length)
        }, 60 * 1000)
        return () => window.clearInterval(id)
    }, [topBgOptions.length])

    useEffect(() => {
        if (featuredItems.length <= 1) return
        const timer = window.setInterval(() => {
            setFeaturedIndex((prev) => (prev + 1) % featuredItems.length)
        }, 3500)

        return () => window.clearInterval(timer)
    }, [featuredItems.length])

    useEffect(() => {
        if (mode === 'menu') {
            setActiveBottomTab('menu')
            return
        }
        if (mode === 'buy-again') {
            setActiveBottomTab('buy-again')
            return
        }
        const sectionPairs: Array<{ key: 'home' | 'menu' | 'buy-again'; el: HTMLDivElement }> = []
        if (homeRef.current) sectionPairs.push({ key: 'home', el: homeRef.current })
        if (menuRef.current) sectionPairs.push({ key: 'menu', el: menuRef.current })
        if (buyAgainRef.current) sectionPairs.push({ key: 'buy-again', el: buyAgainRef.current })

        if (!sectionPairs.length) return

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

                if (!visible.length) return
                const current = sectionPairs.find((pair) => pair.el === visible[0].target)
                if (current) setActiveBottomTab(current.key)
            },
            {
                root: null,
                threshold: [0.25, 0.5, 0.75],
                rootMargin: '-20% 0px -45% 0px',
            }
        )

        sectionPairs.forEach((pair) => observer.observe(pair.el))
        return () => observer.disconnect()
    }, [buyAgainMenuItems.length, mode])

    useEffect(() => {
        if (!selectedCategory) return
        setOpenCategoryIds((prev) => new Set(prev).add(selectedCategory))
    }, [selectedCategory])

    useEffect(() => {
        if (mode !== 'menu') return
        setOpenCategoryIds(new Set(itemsByCategory.map(({ category }) => category.id)))
    }, [mode, itemsByCategory])

    useEffect(() => {
        if (liveActiveOrders.length <= 1) return
        const interval = window.setInterval(() => {
            setActiveOrderIndex((prev) => (prev + 1) % liveActiveOrders.length)
        }, 3500)
        return () => window.clearInterval(interval)
    }, [liveActiveOrders.length])

    useEffect(() => {
        if (activeOrderIndex >= liveActiveOrders.length) {
            setActiveOrderIndex(0)
        }
    }, [activeOrderIndex, liveActiveOrders.length])

    useEffect(() => {
        setLiveActiveOrders(activeOrders)
    }, [activeOrders])

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

    return (
        <div className="storefront min-h-screen bg-background">
            <LocationInitializer userId={user?.id} />
            <CustomerHeader restaurant={restaurant} user={user} />
            <section className="storefront-hero border-b border-border/60">
                <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-10 md:flex-row md:items-end md:justify-between md:px-8 md:py-16">
                    <div className="max-w-2xl"><div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"><Sparkles className="size-3.5" /> Fresh from the kitchen</div><h1 className="font-serif text-5xl leading-[0.95] tracking-tight md:text-7xl">{restaurant.name}</h1>{restaurant.description && <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">{restaurant.description}</p>}<div className="mt-5 flex flex-wrap gap-2 text-xs text-muted-foreground"><span className="rounded-full bg-card px-3 py-1.5">Made to order</span><span className="rounded-full bg-card px-3 py-1.5">Local delivery</span><span className="rounded-full bg-card px-3 py-1.5">Secure checkout</span></div></div>
                    <div className="hidden max-w-[220px] text-right text-xs leading-5 text-muted-foreground md:block">Good food, thoughtfully prepared, and delivered with care.</div>
                </div>
            </section>
            <div className="sticky top-[60px] z-30 border-b border-border/60 bg-background/90 backdrop-blur-xl md:top-[68px]"><div className="mx-auto max-w-7xl px-4 py-3 md:px-8"><div className="relative"><Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input type="search" placeholder="Search the menu..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-11 rounded-full border-border/70 bg-card pl-11" /></div><CategoryTabs categories={categories} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} /></div></div>
            <main className="mx-auto max-w-7xl px-4 py-8 pb-28 md:px-8 md:py-12">{filteredItems.length === 0 ? <div className="rounded-3xl border border-dashed border-border p-16 text-center"><p className="font-serif text-2xl">Nothing found</p><p className="mt-2 text-sm text-muted-foreground">Try another dish or category.</p></div> : <div className="flex flex-col gap-12">{itemsByCategory.map(({ category, items }) => <section key={category.id} id={`category-${category.id}`}><div className="mb-5 flex items-end justify-between"><div><p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">From the kitchen</p><h2 className="font-serif text-3xl md:text-4xl">{category.name}</h2></div><span className="text-xs text-muted-foreground">{items.length} dishes</span></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{items.map(item => <MenuItemCard key={item.id} item={item} />)}</div></section>)}{uncategorizedItems.length > 0 && <section><h2 className="mb-5 font-serif text-3xl">Other items</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{uncategorizedItems.map(item => <MenuItemCard key={item.id} item={item} />)}</div></section>}</div>}</main>
            {cartItemCount > 0 && <div className="fixed bottom-4 left-0 right-0 z-50 px-4"><Button onClick={() => setIsCartOpen(true)} className="mx-auto flex h-14 w-full max-w-md rounded-full bg-primary text-primary-foreground shadow-2xl shadow-primary/20" size="lg"><ShoppingCart data-icon="inline-start" /> View cart <span className="ml-1 rounded-full bg-primary-foreground/15 px-2 py-0.5 text-sm">{cartItemCount}</span></Button></div>}
            <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} restaurant={restaurant} />
        </div>
    )
}
