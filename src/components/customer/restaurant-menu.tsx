'use client'

import { useState } from 'react'
import { Search, ShoppingCart, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CategoryTabs } from './category-tabs'
import { MenuItemCard } from './menu-item-card'
import { CartDrawer } from './cart-drawer'
import { CustomerHeader } from './customer-header'
import { LocationInitializer } from './location-initializer'
import { useCart } from '@/hooks/use-cart'
import { User } from '@supabase/supabase-js'

interface Restaurant { id: string; name: string; slug: string; description?: string; logo_url?: string | null; image_url?: string; phone?: string; address?: string }
interface Category { id: string; name: string; description?: string | null }
interface MenuItem { id: string; name: string; description?: string | null; price: number; category_id?: string | null; image_url?: string | null; is_veg: boolean; is_spicy: boolean; is_bestseller: boolean; is_featured: boolean }
interface RestaurantMenuProps { restaurant: Restaurant; categories: Category[]; menuItems: MenuItem[]; user?: User | null }

export function RestaurantMenu({ restaurant, categories, menuItems, user }: RestaurantMenuProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [isCartOpen, setIsCartOpen] = useState(false)
    const { items: cartItems } = useCart()
    const filteredItems = menuItems.filter(item => (!searchQuery || item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.description?.toLowerCase().includes(searchQuery.toLowerCase())) && (!selectedCategory || item.category_id === selectedCategory))
    const itemsByCategory = categories.map(category => ({ category, items: filteredItems.filter(item => item.category_id === category.id) })).filter(group => group.items.length > 0)
    const uncategorizedItems = filteredItems.filter(item => !item.category_id)
    const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

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
