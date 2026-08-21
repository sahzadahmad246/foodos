'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Clock3, Flame, Search, TrendingUp, X } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { Input } from '@/components/ui/input'
import { MenuItemCard, type MenuItem } from './menu-item-card'
import { HCarousel } from './h-carousel'
import { StorefrontShell } from './storefront-shell'
import { useRecentSearches } from '@/hooks/use-recent-searches'
import { BackButton } from './back-button'

interface Category {
    id: string
    name: string
}

interface Restaurant {
    id: string
    name: string
    slug: string
    is_online?: boolean | null
    logo_url?: string | null
}

interface BuyAgainItem {
    id: string
    name: string
    orderCount: number
}

interface RestaurantSearchProps {
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
    initialQuery?: string
}

export function RestaurantSearch({
    restaurant,
    categories,
    menuItems,
    buyAgainItems = [],
    activeOrders = [],
    user,
    initialQuery = '',
}: RestaurantSearchProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const inputRef = useRef<HTMLInputElement | null>(null)
    const [query, setQuery] = useState(initialQuery)
    const { recent, addRecent, removeRecent, clearRecent } = useRecentSearches(restaurant.slug)
    const categoryNameById = useMemo(
        () => new Map(categories.map((category) => [category.id, category.name])),
        [categories]
    )

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    useEffect(() => {
        const urlQuery = searchParams.get('q') || ''
        setQuery(urlQuery)
    }, [searchParams])

    useEffect(() => {
        const handle = window.setTimeout(() => {
            const next = query.trim()
            const current = (searchParams.get('q') || '').trim()
            if (next === current) return
            const path = next
                ? `/r/${restaurant.slug}/search?q=${encodeURIComponent(next)}`
                : `/r/${restaurant.slug}/search`
            router.replace(path, { scroll: false })
        }, 300)
        return () => window.clearTimeout(handle)
    }, [query, restaurant.slug, router, searchParams])

    const suggestedItems = useMemo(() => {
        const byId = new Map<string, MenuItem>()
        for (const item of menuItems) {
            if (item.is_featured || item.is_bestseller) byId.set(item.id, item)
        }
        for (const past of buyAgainItems) {
            const match = menuItems.find((item) => item.id === past.id)
            if (match) byId.set(match.id, match)
        }
        if (byId.size < 6) {
            for (const item of menuItems) {
                if (byId.size >= 8) break
                byId.set(item.id, item)
            }
        }
        return Array.from(byId.values()).slice(0, 8)
    }, [menuItems, buyAgainItems])

    const trendingQueries = useMemo(() => {
        const skip = new Set(['veg', 'non', 'the', 'and', 'with', 'for'])
        const names = [
            ...menuItems.filter((item) => item.is_bestseller || item.is_featured).map((item) => item.name),
            ...categories.slice(0, 4).map((category) => category.name),
        ]
        return Array.from(
            new Set(
                names
                    .flatMap((name) => name.split(/[\s,/]+/))
                    .map((name) => name.trim())
                    .filter((name) => name.length >= 4 && !skip.has(name.toLowerCase()))
            )
        ).slice(0, 8)
    }, [menuItems, categories])

    const results = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return []
        return menuItems.filter((item) => {
            const categoryName = item.category_id ? categoryNameById.get(item.category_id) : ''
            return (
                item.name.toLowerCase().includes(q) ||
                item.description?.toLowerCase().includes(q) ||
                item.short_description?.toLowerCase().includes(q) ||
                categoryName?.toLowerCase().includes(q)
            )
        })
    }, [menuItems, query, categoryNameById])

    const applyQuery = (value: string) => {
        const next = value.trim()
        setQuery(next)
        if (next.length >= 2) addRecent(next)
        const path = next
            ? `/r/${restaurant.slug}/search?q=${encodeURIComponent(next)}`
            : `/r/${restaurant.slug}/search`
        router.replace(path, { scroll: false })
    }

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        applyQuery(query)
        inputRef.current?.blur()
    }

    return (
        <StorefrontShell restaurant={restaurant} user={user} activeOrders={activeOrders} currentTab="search">
            <header className="sticky top-0 z-30 border-b border-border/70 bg-background/95 px-4 py-3 backdrop-blur">
                <form onSubmit={handleSubmit} className="flex items-center gap-2">
                    <BackButton fallbackHref={`/r/${restaurant.slug}`} />
                    <div className="relative flex-1">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            ref={inputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={`Search in ${restaurant.name}`}
                            className="h-11 rounded-xl border-border/80 bg-card pl-9 pr-10 text-foreground"
                            autoComplete="off"
                            enterKeyHint="search"
                        />
                        {query ? (
                            <button
                                type="button"
                                onClick={() => applyQuery('')}
                                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                                aria-label="Clear search"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        ) : null}
                    </div>
                </form>
            </header>

            <main className="px-4 py-4">
                {!query.trim() ? (
                    <div className="space-y-7">
                        {recent.length > 0 ? (
                            <section>
                                <div className="mb-3 flex items-center justify-between">
                                    <h2 className="text-sm font-semibold">Recent searches</h2>
                                    <button type="button" className="text-xs font-medium text-primary" onClick={clearRecent}>
                                        Clear all
                                    </button>
                                </div>
                                <div className="space-y-1">
                                    {recent.map((item) => (
                                        <div key={item} className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => applyQuery(item)}
                                                className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-2 text-left hover:bg-muted/60"
                                            >
                                                <Clock3 className="h-4 w-4 shrink-0 text-muted-foreground" />
                                                <span className="truncate text-sm">{item}</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => removeRecent(item)}
                                                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                                                aria-label={`Remove ${item}`}
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ) : null}

                        {trendingQueries.length > 0 ? (
                            <section>
                                <div className="mb-3 flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    <h2 className="text-sm font-semibold">Popular searches</h2>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {trendingQueries.map((term) => (
                                        <button
                                            key={term}
                                            type="button"
                                            onClick={() => applyQuery(term)}
                                            className="rounded-full border border-border/70 bg-card px-3 py-1.5 text-xs font-medium hover:border-primary/50 hover:text-primary"
                                        >
                                            {term}
                                        </button>
                                    ))}
                                </div>
                            </section>
                        ) : null}

                        {suggestedItems.length > 0 ? (
                            <section>
                                <div className="mb-3 flex items-center gap-2">
                                    <Flame className="h-4 w-4 text-primary" />
                                    <h2 className="text-sm font-semibold">Suggested for you</h2>
                                </div>
                                <HCarousel>
                                    {suggestedItems.map((item) => (
                                        <MenuItemCard key={item.id} item={item} variant="compact" />
                                    ))}
                                </HCarousel>
                            </section>
                        ) : null}
                    </div>
                ) : results.length === 0 ? (
                    <div className="py-16 text-center">
                        <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                        <p className="font-semibold">No dishes found</p>
                        <p className="mt-1 text-sm text-muted-foreground">Try a different name, like “rice” or “starter”.</p>
                    </div>
                ) : (
                    <section className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                            {results.length} {results.length === 1 ? 'dish' : 'dishes'} for “{query.trim()}”
                        </p>
                        {results.map((item) => (
                            <MenuItemCard key={item.id} item={item} highlightQuery={query.trim()} />
                        ))}
                    </section>
                )}
            </main>
        </StorefrontShell>
    )
}
