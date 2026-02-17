'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, ShoppingCart, House, UtensilsCrossed, RotateCcw, Flame, Leaf, SlidersHorizontal, X, MapPin, Navigation, Phone, ChevronRight } from 'lucide-react'
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

interface Restaurant {
    id: string
    name: string
    slug: string
    is_online?: boolean | null
    description?: string
    logo_url?: string | null
    image_url?: string
    phone?: string
    address?: string
    address_line1?: string | null
    address_line2?: string | null
    city?: string | null
    state?: string | null
    pincode?: string | null
    latitude?: number | null
    longitude?: number | null
}

interface Category {
    id: string
    name: string
    description?: string | null
    image_url?: string | null
}

interface MenuItem {
    id: string
    name: string
    description?: string | null
    short_description?: string | null
    price: number
    compare_at_price?: number | null
    category_id?: string | null
    image_url?: string | null
    is_veg: boolean
    is_spicy: boolean
    is_bestseller: boolean
    is_featured: boolean
    is_new?: boolean
    spice_level?: number
    preparation_time_mins?: number
    calories?: number | null
    protein_grams?: number | null
    carbs_grams?: number | null
    fat_grams?: number | null
    portion_size?: string | null
    serves?: number | null
    dietary_tags?: string[] | null
    allergens?: string[] | null
    has_variants?: boolean
    has_addons?: boolean
}

interface BuyAgainItem {
    id: string
    name: string
    orderCount: number
    totalQuantity?: number
    lastOrderedAt?: string | null
}

interface RestaurantMenuProps {
    restaurant: Restaurant
    categories: Category[]
    menuItems: MenuItem[]
    buyAgainItems?: BuyAgainItem[]
    activeOrders?: Array<{
        id: string
        status: string
        order_number?: string | null
    }>
    user?: User | null
    mode?: 'home' | 'menu' | 'buy-again'
}

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
    const homeRef = useRef<HTMLDivElement | null>(null)
    const menuRef = useRef<HTMLDivElement | null>(null)
    const buyAgainRef = useRef<HTMLDivElement | null>(null)

    const featuredItems = useMemo(
        () => menuItems.filter((item) => item.is_featured),
        [menuItems]
    )
    const categoryTabImageMap = useMemo(() => {
        const map = new Map<string, string>()
        for (const category of categories) {
            if (category.image_url) {
                map.set(category.id, category.image_url)
                continue
            }
            const sample = menuItems.find((item) => item.category_id === category.id && !!item.image_url)
            if (sample?.image_url) {
                map.set(category.id, sample.image_url)
            }
        }
        return map
    }, [categories, menuItems])

    const buyAgainMap = useMemo(() => {
        const map = new Map<string, number>()
        for (const item of buyAgainItems) {
            map.set(item.id, item.orderCount)
        }
        return map
    }, [buyAgainItems])
    const buyAgainDetailsMap = useMemo(() => {
        const map = new Map<string, BuyAgainItem>()
        for (const item of buyAgainItems) {
            map.set(item.id, item)
        }
        return map
    }, [buyAgainItems])

    const filteredItems = useMemo(() => {
        const result = menuItems.filter((item) => {
            const q = searchQuery.trim().toLowerCase()
            const matchesSearch = !q ||
                item.name.toLowerCase().includes(q) ||
                item.description?.toLowerCase().includes(q)

            const matchesCategory = !selectedCategory || item.category_id === selectedCategory

            const matchesFilter =
                filterType === 'all' ||
                (filterType === 'veg' && item.is_veg) ||
                (filterType === 'nonveg' && !item.is_veg) ||
                (filterType === 'spicy' && item.is_spicy) ||
                (filterType === 'bestseller' && item.is_bestseller)

            return matchesSearch && matchesCategory && matchesFilter
        })

        const sorted = [...result]
        if (sortType === 'price_asc') sorted.sort((a, b) => Number(a.price) - Number(b.price))
        if (sortType === 'price_desc') sorted.sort((a, b) => Number(b.price) - Number(a.price))
        if (sortType === 'prep_asc') sorted.sort((a, b) => Number(a.preparation_time_mins || 20) - Number(b.preparation_time_mins || 20))
        if (sortType === 'popular') {
            sorted.sort((a, b) => {
                const bScore = (buyAgainMap.get(b.id) || 0) + (b.is_bestseller ? 3 : 0) + (b.is_featured ? 1 : 0)
                const aScore = (buyAgainMap.get(a.id) || 0) + (a.is_bestseller ? 3 : 0) + (a.is_featured ? 1 : 0)
                return bScore - aScore
            })
        }

        return sorted
    }, [menuItems, searchQuery, selectedCategory, filterType, sortType, buyAgainMap])

    const itemsByCategory = categories.map((category) => ({
        category,
        items: filteredItems.filter((item) => item.category_id === category.id)
    })).filter((group) => group.items.length > 0)

    const uncategorizedItems = filteredItems.filter((item) => !item.category_id)
    const buyAgainMenuItems = menuItems.filter((item) => buyAgainMap.has(item.id))
    const showcaseItems = filteredItems.slice(0, 8)

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
        <div className="mx-auto min-h-screen w-full max-w-lg bg-gradient-to-b from-background via-background to-muted/20 md:shadow-[0_0_0_1px_hsl(var(--border)),0_18px_45px_-20px_rgba(0,0,0,0.45)]">
            <LocationInitializer userId={user?.id} />
            {mode === 'home' ? <CustomerHeader restaurant={restaurant} user={user} /> : null}

            {restaurant.is_online === false && (
                <div className="bg-amber-50 border-b border-amber-200">
                    <div className="mx-auto w-full px-4 py-2 text-sm text-amber-800">
                        This restaurant is currently offline. You can browse the menu, but orders are temporarily disabled.
                    </div>
                </div>
            )}

            <main className={`mx-auto w-full px-4 pt-0 ${
                cartItemCount > 0 && currentActiveOrder
                    ? 'pb-56'
                    : cartItemCount > 0 || currentActiveOrder
                        ? 'pb-44'
                        : 'pb-32'
            }`}>
                <section className={`sticky top-0 z-30 -mx-4 overflow-hidden px-4 pb-5 pt-3 transition-colors duration-700 ${mode === 'home' ? topBgOptions[bgIndex] : 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80'}`}>
                    <div className="relative">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search dishes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`h-12 rounded-xl pl-9 ${mode === 'home' ? 'border-white/50 bg-white text-black' : 'border-border bg-card text-foreground shadow-sm'}`}
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className={`h-12 shrink-0 gap-2 rounded-xl ${mode === 'home' ? 'border-white/60 bg-white text-teal-900 hover:bg-white' : 'border-border bg-card text-foreground shadow-sm hover:bg-muted'}`}
                            onClick={() => setIsFilterOpen(true)}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            Filter
                        </Button>
                    </div>

                    {mode === 'home' && showAppliedFilterChips && (
                        <div className="mt-3 flex flex-wrap gap-2.5">
                            {filterType !== 'all' && (
                                <Badge variant="outline" className="rounded-md border-white/30 bg-white/10 px-2.5 py-1 text-white pr-1">
                                    Filter: {filterType}
                                    <button
                                        onClick={() => setFilterType('all')}
                                        className="ml-1 inline-flex rounded-sm p-0.5 hover:bg-white/10"
                                        aria-label="Remove food type filter"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}
                            {sortType !== 'popular' && (
                                <Badge variant="outline" className="rounded-md border-white/30 bg-white/10 px-2.5 py-1 text-white pr-1">
                                    {sortType === 'price_asc'
                                        ? 'Price Low to High'
                                        : sortType === 'price_desc'
                                            ? 'Price High to Low'
                                            : 'Quick Prep'}
                                    <button
                                        onClick={() => setSortType('popular')}
                                        className="ml-1 inline-flex rounded-sm p-0.5 hover:bg-white/10"
                                        aria-label="Remove sorting"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}
                        </div>
                    )}

                    {mode === 'home' && (
                    <div className={`flex gap-5 overflow-x-auto pb-2 ${compactStickyTabs ? 'pt-2' : 'pt-5'}`}>
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className="flex min-w-16 shrink-0 flex-col items-center text-center"
                        >
                            <span
                                className={`overflow-hidden rounded-full transition-all duration-200 ${compactStickyTabs ? 'h-0 w-0 opacity-0' : 'h-11 w-11 opacity-100'}`}
                                aria-hidden={compactStickyTabs}
                            >
                                    {restaurant.logo_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={restaurant.logo_url} alt="All categories" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="flex h-full w-full items-center justify-center">
                                            <UtensilsCrossed className="h-5 w-5 text-white" />
                                        </span>
                                    )}
                            </span>
                            <span className={`mt-1 text-xs font-semibold ${selectedCategory === null ? 'text-white' : 'text-white/75'}`}>All</span>
                            <span className={`mt-2 h-1 w-8 rounded-full ${selectedCategory === null ? 'bg-white' : 'bg-transparent'}`} />
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className="flex min-w-16 shrink-0 flex-col items-center text-center"
                            >
                                <span
                                    className={`overflow-hidden rounded-full transition-all duration-200 ${compactStickyTabs ? 'h-0 w-0 opacity-0' : 'h-11 w-11 opacity-100'}`}
                                    aria-hidden={compactStickyTabs}
                                >
                                        {categoryTabImageMap.get(category.id) ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={categoryTabImageMap.get(category.id)!} alt={category.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="flex h-full w-full items-center justify-center">
                                                <UtensilsCrossed className="h-5 w-5 text-white" />
                                            </span>
                                        )}
                                </span>
                                <span className={`mt-1 whitespace-nowrap text-xs font-semibold ${selectedCategory === category.id ? 'text-white' : 'text-white/75'}`}>
                                    {category.name}
                                </span>
                                <span className={`mt-2 h-1 w-8 rounded-full ${selectedCategory === category.id ? 'bg-white' : 'bg-transparent'}`} />
                            </button>
                        ))}
                    </div>
                    )}
                    </div>
                    {mode === 'home' && (
                        <div
                            aria-hidden
                            className="pointer-events-none absolute -bottom-3 left-0 h-6 w-full bg-background [mask-image:radial-gradient(circle_10px_at_10px_0,transparent_98%,black_100%)] [mask-size:20px_20px] [mask-repeat:repeat-x]"
                        />
                    )}
                </section>

                {mode === 'home' && (
                    <section ref={homeRef} className="mb-10 pt-6">
                        {featuredItems.length > 0 ? (
                            <>
                                <div className="mb-3 flex items-center justify-between">
                                    <h2 className="text-lg font-semibold">Featured Items</h2>
                                    <Badge variant="secondary">{featuredItems.length}</Badge>
                                </div>
                                <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
                                    {(() => {
                                        const item = featuredItems[Math.min(featuredIndex, featuredItems.length - 1)]
                                        if (!item) return null
                                        return (
                                            <div key={item.id}>
                                                <div className="relative h-44 w-full bg-muted">
                                                    {item.image_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
                                                    )}
                                                </div>
                                                <div className="p-3">
                                                    <p className="line-clamp-1 text-base font-semibold">{item.name}</p>
                                                    <p className="text-sm font-semibold text-primary">₹{item.price}</p>
                                                </div>
                                            </div>
                                        )
                                    })()}
                                </div>
                                {featuredItems.length > 1 && (
                                    <div className="mt-3 flex justify-center gap-1.5">
                                        {featuredItems.map((item, idx) => (
                                            <button
                                                key={item.id}
                                                onClick={() => setFeaturedIndex(idx)}
                                                className={`h-1.5 rounded-full transition-all ${idx === featuredIndex ? 'w-5 bg-primary' : 'w-2 bg-muted-foreground/40'}`}
                                                aria-label={`Go to featured item ${idx + 1}`}
                                            />
                                        ))}
                                    </div>
                                )}
                            </>
                        ) : null}
                    </section>
                )}

                {mode === 'home' && buyAgainMenuItems.length > 0 ? (
                    <section ref={buyAgainRef} className="mb-8 rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Buy Again</h2>
                            <Badge variant="secondary">{buyAgainMenuItems.length} items</Badge>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {buyAgainMenuItems.map((item) => (
                                <MenuItemCard key={`buy-again-${item.id}`} item={item} />
                            ))}
                        </div>
                    </section>
                ) : null}

                <section ref={menuRef} className={mode === 'menu' || mode === 'buy-again' ? 'pt-4' : ''}>
                    {mode === 'home' ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Menu Preview</h3>
                                <Button asChild size="sm" variant="outline" className="rounded-full">
                                    <Link href={`/r/${restaurant.slug}/menu`}>View Full Menu</Link>
                                </Button>
                            </div>
                            {showcaseItems.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">No items found for selected filters.</div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {showcaseItems.map((item) => (
                                        <MenuItemCard key={item.id} item={item} />
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : mode === 'buy-again' ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold">Buy Again</h3>
                                <Badge variant="secondary">{buyAgainMenuItems.length} items</Badge>
                            </div>
                            {buyAgainMenuItems.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground">
                                    No previous items from this restaurant yet.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-3">
                                    {buyAgainMenuItems.map((item) => (
                                        <div key={`buy-again-page-${item.id}`} className="space-y-1">
                                            <MenuItemCard item={item} />
                                            <p className="px-1 text-xs text-muted-foreground">
                                                Ordered {buyAgainDetailsMap.get(item.id)?.orderCount || 0} times
                                                {buyAgainDetailsMap.get(item.id)?.totalQuantity
                                                    ? ` • Qty ${buyAgainDetailsMap.get(item.id)?.totalQuantity}`
                                                    : ''}
                                                {buyAgainDetailsMap.get(item.id)?.lastOrderedAt
                                                    ? ` • Last ordered ${new Date(buyAgainDetailsMap.get(item.id)!.lastOrderedAt!).toLocaleDateString()}`
                                                    : ''}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {filteredItems.length === 0 ? (
                                <div className="py-12 text-center">
                                    <p className="text-muted-foreground">No items found for selected filters</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {itemsByCategory.map(({ category, items }) => (
                                        <section key={category.id} id={`category-${category.id}`} className="space-y-3 border-b border-border/60 pb-5">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOpenCategoryIds((prev) => {
                                                        const next = new Set(prev)
                                                        if (next.has(category.id)) {
                                                            next.delete(category.id)
                                                        } else {
                                                            next.add(category.id)
                                                        }
                                                        return next
                                                    })
                                                }
                                                className="flex w-full items-center justify-between text-left"
                                            >
                                                <h3 className="text-lg font-semibold tracking-tight">{category.name}</h3>
                                                <span className="text-xs text-muted-foreground">
                                                    {items.length} item{items.length > 1 ? 's' : ''} {openCategoryIds.has(category.id) ? '▲' : '▼'}
                                                </span>
                                            </button>
                                            <div className={openCategoryIds.has(category.id) ? 'grid grid-cols-1 gap-3' : 'hidden'}>
                                                {items.map((item) => (
                                                    <MenuItemCard key={item.id} item={item} />
                                                ))}
                                            </div>
                                        </section>
                                    ))}

                                    {uncategorizedItems.length > 0 && (
                                        <section className="space-y-3 border-b border-border/60 pb-5">
                                            <h3 className="text-lg font-semibold tracking-tight">Other Items</h3>
                                            <div className="grid grid-cols-1 gap-3">
                                                {uncategorizedItems.map((item) => (
                                                    <MenuItemCard key={item.id} item={item} />
                                                ))}
                                            </div>
                                        </section>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </section>

                {mode === 'home' && (
                <section className="mt-12 border-t border-border/50 pt-6">
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            {restaurant.logo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={restaurant.logo_url}
                                    alt={restaurant.name}
                                    className="h-12 w-12 rounded-full object-cover"
                                />
                            ) : (
                                <div className="h-12 w-12 rounded-full bg-muted" />
                            )}
                            <div className="min-w-0">
                                <h2 className="text-lg font-semibold sm:text-xl">{restaurant.name}</h2>
                                {restaurant.description ? (
                                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{restaurant.description}</p>
                                ) : null}
                            </div>
                        </div>

                        {restaurantAddress ? (
                            <div className="flex items-start gap-3 text-sm text-muted-foreground">
                                <div className="flex h-12 w-12 items-start justify-center pt-0.5">
                                    <MapPin className="h-5 w-5 shrink-0" />
                                </div>
                                <div className="min-w-0 pt-0.5">
                                    <span>{restaurantAddress}</span>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 pl-[60px]">
                        {restaurant.phone ? (
                            <Button asChild size="sm" className="gap-2 rounded-full px-4 shadow-sm">
                                <a href={`tel:${restaurant.phone}`}>
                                    <Phone className="h-4 w-4" />
                                    Call
                                </a>
                            </Button>
                        ) : null}
                        {directionsUrl ? (
                            <Button asChild size="sm" variant="outline" className="gap-2 rounded-full px-4 shadow-sm">
                                <a href={directionsUrl} target="_blank" rel="noreferrer">
                                    <Navigation className="h-4 w-4" />
                                    Directions
                                </a>
                            </Button>
                        ) : null}
                    </div>
                </section>
                )}
            </main>

            {currentActiveOrder && (
                <div className={`fixed left-1/2 z-40 w-full max-w-lg -translate-x-1/2 px-4 ${cartItemCount > 0 ? 'bottom-36' : 'bottom-20'}`}>
                    <Link
                        href={`/orders/${currentActiveOrder.id}`}
                        className="mx-auto flex h-14 w-full items-center justify-between rounded-2xl bg-slate-800/95 px-4 text-white shadow-lg backdrop-blur"
                    >
                        <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{activeOrderStatusLabel}</p>
                            <p className="truncate text-[11px] text-white/70">
                                Order #{currentActiveOrder.order_number || currentActiveOrder.id.slice(0, 8)}
                            </p>
                            {liveActiveOrders.length > 1 ? (
                                <div className="mt-1 flex gap-1">
                                    {liveActiveOrders.map((order, idx) => (
                                        <span
                                            key={order.id}
                                            className={`h-1.5 rounded-full ${idx === activeOrderIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`}
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
                <div className="fixed bottom-20 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 px-4">
                    <button
                        type="button"
                        onClick={() => setIsCartOpen(true)}
                        className="mx-auto flex h-14 w-full items-center justify-between rounded-2xl bg-slate-900/95 px-3.5 text-white shadow-lg backdrop-blur"
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="flex -space-x-2">
                                {cartPreviewItems.map((item) => (
                                    <div key={item.id} className="h-8 w-8 overflow-hidden rounded-full border border-white/35 bg-slate-700">
                                        {item.image_url ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center">
                                                <ShoppingCart className="h-3.5 w-3.5 text-white/80" />
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

            <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 border-t bg-background/95 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] backdrop-blur">
                <div className="mx-auto grid h-16 w-full grid-cols-3 px-2">
                    <button
                        onClick={() => {
                            if (mode !== 'home') return
                            scrollToSection('home')
                        }}
                        className={`flex flex-col items-center justify-center text-xs ${activeBottomTab === 'home' ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        {mode !== 'home' ? (
                            <Link href={`/r/${restaurant.slug}`} className="flex flex-col items-center">
                                <House className="mb-1 h-4 w-4" />
                                Home
                            </Link>
                        ) : (
                            <>
                                <House className="mb-1 h-4 w-4" />
                                Home
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            if (mode !== 'menu') return
                            scrollToSection('menu')
                        }}
                        className={`flex flex-col items-center justify-center text-xs ${activeBottomTab === 'menu' ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        {mode !== 'menu' ? (
                            <Link href={`/r/${restaurant.slug}/menu`} className="flex flex-col items-center">
                                <UtensilsCrossed className="mb-1 h-4 w-4" />
                                Menu
                            </Link>
                        ) : (
                            <>
                                <UtensilsCrossed className="mb-1 h-4 w-4" />
                                Menu
                            </>
                        )}
                    </button>
                    <button
                        onClick={() => {
                            if (mode !== 'buy-again') return
                            scrollToSection('buy-again')
                        }}
                        className={`flex flex-col items-center justify-center text-xs ${activeBottomTab === 'buy-again' ? 'text-primary' : 'text-muted-foreground'}`}
                    >
                        {mode !== 'buy-again' ? (
                            <Link href={`/r/${restaurant.slug}/buy-again`} className="flex flex-col items-center">
                                <RotateCcw className="mb-1 h-4 w-4" />
                                Buy Again
                            </Link>
                        ) : (
                            <>
                                <RotateCcw className="mb-1 h-4 w-4" />
                                Buy Again
                            </>
                        )}
                    </button>
                </div>
            </nav>

            <CartDrawer
                open={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                restaurant={restaurant}
            />

            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetContent side={isDesktop ? 'right' : 'bottom'} className={isDesktop ? 'w-[430px] p-0' : 'h-[82vh] p-0'}>
                    <SheetHeader className="border-b px-4 py-4 sm:px-6">
                        <SheetTitle>Menu Filters</SheetTitle>
                        <SheetDescription>Refine menu by type, sorting and category</SheetDescription>
                    </SheetHeader>
                    <div className="space-y-6 overflow-y-auto px-4 py-4 sm:px-6">
                        <section>
                            <p className="mb-2 text-sm font-semibold">Food Type</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { id: 'all', label: 'All', icon: null },
                                    { id: 'veg', label: 'Veg', icon: Leaf },
                                    { id: 'nonveg', label: 'Non-Veg', icon: null },
                                    { id: 'spicy', label: 'Spicy', icon: Flame },
                                    { id: 'bestseller', label: 'Bestseller', icon: null },
                                ].map((filter) => (
                                    <button
                                        key={filter.id}
                                        onClick={() => setFilterType(filter.id as FilterType)}
                                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium ${filterType === filter.id ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                                    >
                                        {filter.icon ? <filter.icon className="h-3 w-3" /> : null}
                                        {filter.label}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section>
                            <p className="mb-2 text-sm font-semibold">Sort By</p>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'popular', label: 'Popular' },
                                    { id: 'price_asc', label: 'Price Low to High' },
                                    { id: 'price_desc', label: 'Price High to Low' },
                                    { id: 'prep_asc', label: 'Quick Prep' },
                                ].map((sort) => (
                                    <button
                                        key={sort.id}
                                        onClick={() => setSortType(sort.id as SortType)}
                                        className={`rounded-md border px-3 py-2 text-xs text-left ${sortType === sort.id ? 'border-primary bg-primary/5 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                                    >
                                        {sort.label}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <section>
                            <p className="mb-2 text-sm font-semibold">Category</p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSelectedCategory(null)}
                                    className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs ${selectedCategory === null ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                                >
                                    All Categories
                                </button>
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs ${selectedCategory === category.id ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                            </div>
                        </section>

                        <div className="flex gap-2 pt-2">
                            <Button
                                variant="outline"
                                className="flex-1"
                                onClick={() => {
                                    setFilterType('all')
                                    setSortType('popular')
                                    setSelectedCategory(null)
                                }}
                            >
                                Reset
                            </Button>
                            <Button className="flex-1" onClick={() => setIsFilterOpen(false)}>
                                Apply
                            </Button>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}
