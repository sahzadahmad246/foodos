'use client'

import { useEffect, useMemo, useState } from 'react'
import { Flame, Leaf, SlidersHorizontal, X, MapPin, Navigation, Phone, ChevronDown, Clock3, Bike } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { MenuItemCard } from './menu-item-card'
import { HCarousel } from './h-carousel'
import { StorefrontShell } from './storefront-shell'
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

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
    return (
        <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-primary" />
                <h2 className="text-base font-semibold tracking-tight">{title}</h2>
            </div>
            {action}
        </div>
    )
}

export function RestaurantMenu({ restaurant, categories, menuItems, buyAgainItems = [], activeOrders = [], user, mode = 'home' }: RestaurantMenuProps) {
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [filterType, setFilterType] = useState<FilterType>('all')
    const [sortType, setSortType] = useState<SortType>('popular')
    const [isFilterOpen, setIsFilterOpen] = useState(false)
    const [isDesktop, setIsDesktop] = useState(false)
    const [openCategoryIds, setOpenCategoryIds] = useState<Set<string>>(new Set())
    const [compactStickyTabs, setCompactStickyTabs] = useState(false)

    const categoryTabImageMap = useMemo(() => {
        const map = new Map<string, string>()
        for (const category of categories) {
            if (category.image_url) {
                map.set(category.id, category.image_url)
                continue
            }
            const sample = menuItems.find((item) => item.category_id === category.id && !!item.image_url)
            if (sample?.image_url) map.set(category.id, sample.image_url)
        }
        return map
    }, [categories, menuItems])

    const buyAgainMap = useMemo(() => {
        const map = new Map<string, number>()
        for (const item of buyAgainItems) map.set(item.id, item.orderCount)
        return map
    }, [buyAgainItems])

    const buyAgainDetailsMap = useMemo(() => {
        const map = new Map<string, BuyAgainItem>()
        for (const item of buyAgainItems) map.set(item.id, item)
        return map
    }, [buyAgainItems])

    const featuredItems = useMemo(() => menuItems.filter((item) => item.is_featured), [menuItems])

    const filteredItems = useMemo(() => {
        const result = menuItems.filter((item) => {
            const matchesCategory = mode === 'menu' || !selectedCategory || item.category_id === selectedCategory
            const matchesFilter =
                filterType === 'all' ||
                (filterType === 'veg' && item.is_veg) ||
                (filterType === 'nonveg' && !item.is_veg) ||
                (filterType === 'spicy' && item.is_spicy) ||
                (filterType === 'bestseller' && item.is_bestseller)
            return matchesCategory && matchesFilter
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
    }, [menuItems, selectedCategory, filterType, sortType, buyAgainMap, mode])

    const itemsByCategory = useMemo(
        () =>
            categories
                .map((category) => ({
                    category,
                    items: filteredItems.filter((item) => item.category_id === category.id),
                }))
                .filter((group) => group.items.length > 0),
        [categories, filteredItems]
    )

    const uncategorizedItems = filteredItems.filter((item) => !item.category_id)
    const buyAgainMenuItems = menuItems.filter((item) => buyAgainMap.has(item.id))
    const showcaseItems = filteredItems.slice(0, 6)
    const showAppliedFilterChips = filterType !== 'all' || sortType !== 'popular'
    const restaurantAddress = [
        restaurant.address_line1,
        restaurant.address_line2,
        restaurant.city,
        restaurant.state,
        restaurant.pincode,
    ].filter(Boolean).join(', ')
    const directionsUrl =
        restaurant.latitude != null && restaurant.longitude != null
            ? `https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`
            : restaurantAddress
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurantAddress)}`
                : null

    const scrollToCategory = (categoryId: string | null) => {
        if (!categoryId) {
            window.scrollTo({ top: 0, behavior: 'smooth' })
            return
        }
        document.getElementById(`category-${categoryId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
            setCompactStickyTabs((prev) => (prev ? y > 80 : y > 140))
        }
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [])

    useEffect(() => {
        if (!selectedCategory) return

        const timeoutId = window.setTimeout(() => {
            setOpenCategoryIds((prev) => new Set(prev).add(selectedCategory))
        }, 0)

        return () => window.clearTimeout(timeoutId)
    }, [selectedCategory])

    useEffect(() => {
        if (mode !== 'menu') return

        const timeoutId = window.setTimeout(() => {
            setOpenCategoryIds(new Set(itemsByCategory.map(({ category }) => category.id)))
        }, 0)

        return () => window.clearTimeout(timeoutId)
    }, [mode, itemsByCategory])

    return (
        <StorefrontShell
            restaurant={restaurant}
            user={user}
            activeOrders={activeOrders}
            currentTab={mode}
            showHeader={mode === 'home'}
        >
            <main className="mx-auto w-full px-3 pt-0">
                <section className="sticky top-0 z-30 -mx-3 border-b border-border/70 bg-background/95 px-3 pb-3 pt-3 backdrop-blur">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">
                            {mode === 'home' ? "What's on your mind?" : mode === 'menu' ? 'Menu' : 'Buy again'}
                        </p>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 shrink-0 rounded-full border-border/80 bg-card/70 text-foreground shadow-none hover:bg-muted"
                            onClick={() => setIsFilterOpen(true)}
                            aria-label="Filter"
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                    </div>

                    {showAppliedFilterChips && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {filterType !== 'all' && (
                                <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/15 pr-1 text-primary">
                                    {filterType}
                                    <button onClick={() => setFilterType('all')} className="ml-1 rounded-full p-0.5 hover:bg-primary/20" aria-label="Remove filter">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}
                            {sortType !== 'popular' && (
                                <Badge variant="outline" className="rounded-full border-primary/30 bg-primary/15 pr-1 text-primary">
                                    {sortType === 'price_asc' ? 'Price: Low to High' : sortType === 'price_desc' ? 'Price: High to Low' : 'Quick prep'}
                                    <button onClick={() => setSortType('popular')} className="ml-1 rounded-full p-0.5 hover:bg-primary/20" aria-label="Remove sort">
                                        <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            )}
                        </div>
                    )}

                    {mode === 'home' && (
                        <div className="pt-3">
                        <HCarousel contentClassName="gap-4">
                            <button type="button" onClick={() => setSelectedCategory(null)} className="flex min-w-16 shrink-0 flex-col items-center text-center">
                                <span className={`overflow-hidden rounded-full bg-muted transition-all ${compactStickyTabs ? 'h-0 w-0 opacity-0' : 'h-12 w-12 opacity-100'}`}>
                                    {restaurant.logo_url ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={restaurant.logo_url} alt="All" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="flex h-full w-full items-center justify-center text-primary">All</span>
                                    )}
                                </span>
                                <span className={`mt-1 text-xs font-semibold ${selectedCategory === null ? 'text-primary' : 'text-muted-foreground'}`}>All</span>
                            </button>
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => setSelectedCategory(category.id)}
                                    className="flex min-w-16 shrink-0 flex-col items-center text-center"
                                >
                                    <span className={`overflow-hidden rounded-full bg-muted transition-all ${compactStickyTabs ? 'h-0 w-0 opacity-0' : 'h-12 w-12 opacity-100'}`}>
                                        {categoryTabImageMap.get(category.id) ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={categoryTabImageMap.get(category.id)!} alt={category.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-primary">
                                                {category.name.slice(0, 2)}
                                            </span>
                                        )}
                                    </span>
                                    <span className={`mt-1 max-w-16 truncate text-xs font-semibold ${selectedCategory === category.id ? 'text-primary' : 'text-muted-foreground'}`}>
                                        {category.name}
                                    </span>
                                </button>
                            ))}
                        </HCarousel>
                        </div>
                    )}

                    {mode === 'menu' && categories.length > 0 && (
                        <div className="mt-3">
                        <HCarousel contentClassName="gap-2">
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() => scrollToCategory(category.id)}
                                    className="shrink-0 rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/50 hover:text-primary"
                                >
                                    {category.name}
                                </button>
                            ))}
                        </HCarousel>
                        </div>
                    )}
                </section>

                {mode === 'home' && featuredItems.length > 0 && (
                    <section className="pt-5">
                        <SectionTitle title="Featured" action={<Badge variant="secondary">{featuredItems.length}</Badge>} />
                        <HCarousel>
                            {featuredItems.map((item) => (
                                <MenuItemCard key={item.id} item={item} variant="featured" />
                            ))}
                        </HCarousel>
                    </section>
                )}

                {mode === 'home' && buyAgainMenuItems.length > 0 && (
                    <section className="pt-7">
                        <SectionTitle
                            title="Buy again"
                            action={
                                <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-primary">
                                    <Link href={`/r/${restaurant.slug}/buy-again`}>See all</Link>
                                </Button>
                            }
                        />
                        <HCarousel>
                            {buyAgainMenuItems.slice(0, 8).map((item) => (
                                <MenuItemCard
                                    key={`buy-again-${item.id}`}
                                    item={item}
                                    variant="compact"
                                    subtitle={`Ordered ${buyAgainDetailsMap.get(item.id)?.orderCount || 0}x`}
                                />
                            ))}
                        </HCarousel>
                    </section>
                )}

                {mode === 'home' && (
                    <section className="pt-7">
                        <SectionTitle
                            title={selectedCategory ? categories.find((c) => c.id === selectedCategory)?.name || 'Menu' : 'Popular dishes'}
                            action={
                                <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-primary">
                                    <Link href={`/r/${restaurant.slug}/menu`}>Full menu</Link>
                                </Button>
                            }
                        />
                        {showcaseItems.length === 0 ? (
                            <div className="py-10 text-center text-sm text-muted-foreground">No items found for selected filters.</div>
                        ) : (
                            <div className="space-y-3">
                                {showcaseItems.map((item) => (
                                    <MenuItemCard key={item.id} item={item} />
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {mode === 'buy-again' && (
                    <section className="pt-5">
                        <SectionTitle title="Buy again" action={<Badge variant="secondary">{buyAgainMenuItems.length}</Badge>} />
                        {buyAgainMenuItems.length === 0 ? (
                            <div className="rounded-2xl border border-border/60 bg-card/50 px-6 py-14 text-center">
                                <p className="font-semibold">No previous orders yet</p>
                                <p className="mt-1 text-sm text-muted-foreground">Items you order from here will show up for a faster reorder.</p>
                                <Button asChild className="mt-4">
                                    <Link href={`/r/${restaurant.slug}/menu`}>Browse menu</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {buyAgainMenuItems.map((item) => {
                                    const details = buyAgainDetailsMap.get(item.id)
                                    const lastOrdered = details?.lastOrderedAt
                                        ? `Last ordered ${new Date(details.lastOrderedAt).toLocaleDateString()}`
                                        : undefined
                                    return (
                                        <MenuItemCard
                                            key={`buy-again-page-${item.id}`}
                                            item={item}
                                            subtitle={[
                                                details?.orderCount ? `Ordered ${details.orderCount} times` : null,
                                                lastOrdered,
                                            ].filter(Boolean).join(' • ')}
                                        />
                                    )
                                })}
                            </div>
                        )}
                    </section>
                )}

                {mode === 'menu' && (
                    <section className="pt-5">
                        {filteredItems.length === 0 ? (
                            <div className="py-12 text-center text-muted-foreground">No items found for selected filters</div>
                        ) : (
                            <div className="space-y-8">
                                {itemsByCategory.map(({ category, items }) => {
                                    const open = openCategoryIds.has(category.id)
                                    return (
                                        <section key={category.id} id={`category-${category.id}`} className="scroll-mt-28 space-y-3">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOpenCategoryIds((prev) => {
                                                        const next = new Set(prev)
                                                        if (next.has(category.id)) next.delete(category.id)
                                                        else next.add(category.id)
                                                        return next
                                                    })
                                                }
                                                className="flex w-full items-center justify-between text-left"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {categoryTabImageMap.get(category.id) ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={categoryTabImageMap.get(category.id)!} alt="" className="h-10 w-10 rounded-lg object-cover" />
                                                    ) : (
                                                        <span className="h-10 w-10 rounded-lg bg-muted" />
                                                    )}
                                                    <div>
                                                        <h3 className="text-base font-semibold">{category.name}</h3>
                                                        <p className="text-xs text-muted-foreground">{items.length} item{items.length === 1 ? '' : 's'}</p>
                                                    </div>
                                                </div>
                                                <ChevronDown className={`h-4 w-4 text-muted-foreground transition ${open ? 'rotate-180' : ''}`} />
                                            </button>
                                            <div className={open ? 'space-y-3' : 'hidden'}>
                                                {items.map((item) => (
                                                    <MenuItemCard key={item.id} item={item} />
                                                ))}
                                            </div>
                                        </section>
                                    )
                                })}
                                {uncategorizedItems.length > 0 && (
                                    <section className="space-y-3">
                                        <h3 className="text-base font-semibold">Other items</h3>
                                        <div className="space-y-3">
                                            {uncategorizedItems.map((item) => (
                                                <MenuItemCard key={item.id} item={item} />
                                            ))}
                                        </div>
                                    </section>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {mode === 'home' && (
                    <section className="mt-10 overflow-hidden rounded-2xl border border-border/70 bg-card/80">
                        <div className="relative h-28 bg-gradient-to-r from-emerald-950 to-card">
                            {restaurant.image_url || restaurant.logo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={restaurant.image_url || restaurant.logo_url || ''}
                                    alt=""
                                    className="h-full w-full object-cover opacity-40"
                                />
                            ) : null}
                            <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                            <p className="absolute bottom-3 left-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">About the restaurant</p>
                        </div>
                        <div className="space-y-4 p-4">
                            <div className="flex items-start gap-3">
                                {restaurant.logo_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={restaurant.logo_url} alt={restaurant.name} className="h-14 w-14 rounded-2xl object-cover" />
                                ) : (
                                    <div className="h-14 w-14 rounded-2xl bg-muted" />
                                )}
                                <div className="min-w-0">
                                    <h2 className="text-lg font-bold leading-tight">{restaurant.name}</h2>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                        <span className="inline-flex items-center gap-1">
                                            <Clock3 className="h-3 w-3 text-primary" />
                                            30-35 min
                                        </span>
                                        <span className="inline-flex items-center gap-1">
                                            <Bike className="h-3 w-3 text-primary" />
                                            {restaurant.is_online === false ? 'Currently offline' : 'Accepting orders'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {restaurant.description ? (
                                <p className="text-sm leading-relaxed text-muted-foreground">{restaurant.description}</p>
                            ) : null}
                            {restaurantAddress ? (
                                <div className="flex items-start gap-2 rounded-xl bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
                                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                    <span>{restaurantAddress}</span>
                                </div>
                            ) : null}
                            <div className="grid grid-cols-2 gap-2">
                                {restaurant.phone ? (
                                    <Button asChild className="h-10 rounded-xl">
                                        <a href={`tel:${restaurant.phone}`}>
                                            <Phone className="h-4 w-4" />
                                            Call
                                        </a>
                                    </Button>
                                ) : null}
                                {directionsUrl ? (
                                    <Button asChild variant="outline" className="h-10 rounded-xl">
                                        <a href={directionsUrl} target="_blank" rel="noreferrer">
                                            <Navigation className="h-4 w-4" />
                                            Directions
                                        </a>
                                    </Button>
                                ) : null}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetContent side={isDesktop ? 'right' : 'bottom'} className={isDesktop ? 'w-[430px] p-0' : 'h-[82vh] p-0'}>
                    <SheetHeader className="border-b px-4 py-4 sm:px-6">
                        <SheetTitle>Menu filters</SheetTitle>
                        <SheetDescription>Refine dishes by type, sort and category</SheetDescription>
                    </SheetHeader>
                    <div className="space-y-6 overflow-y-auto px-4 py-4 sm:px-6">
                        <section>
                            <p className="mb-2 text-sm font-semibold">Food type</p>
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
                            <p className="mb-2 text-sm font-semibold">Sort by</p>
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
                                        className={`rounded-md border px-3 py-2 text-left text-xs ${sortType === sort.id ? 'border-primary bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}
                                    >
                                        {sort.label}
                                    </button>
                                ))}
                            </div>
                        </section>
                        {mode !== 'menu' && (
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
                        )}
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
        </StorefrontShell>
    )
}
