'use client'

import { useState } from 'react'
import { Search, ShoppingCart } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CategoryTabs } from './category-tabs'
import { MenuItemCard } from './menu-item-card'
import { CartDrawer } from './cart-drawer'
import { CustomerHeader } from './customer-header'
import { LocationInitializer } from './location-initializer'
import { useCart } from '@/hooks/use-cart'
import { User } from '@supabase/supabase-js'

interface Restaurant {
    id: string
    name: string
    slug: string
    description?: string
    logo_url?: string | null
    image_url?: string
    phone?: string
    address?: string
}

interface Category {
    id: string
    name: string
    description?: string | null
}

interface MenuItem {
    id: string
    name: string
    description?: string | null
    price: number
    category_id?: string | null
    image_url?: string | null
    is_veg: boolean
    is_spicy: boolean
    is_bestseller: boolean
    is_featured: boolean
}

interface RestaurantMenuProps {
    restaurant: Restaurant
    categories: Category[]
    menuItems: MenuItem[]
    user?: User | null
}

export function RestaurantMenu({ restaurant, categories, menuItems, user }: RestaurantMenuProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [isCartOpen, setIsCartOpen] = useState(false)
    const { items: cartItems } = useCart()

    // Filter items
    const filteredItems = menuItems.filter(item => {
        const matchesSearch = !searchQuery ||
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.description?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesCategory = !selectedCategory || item.category_id === selectedCategory

        return matchesSearch && matchesCategory
    })

    // Group items by category
    const itemsByCategory = categories.map(category => ({
        category,
        items: filteredItems.filter(item => item.category_id === category.id)
    })).filter(group => group.items.length > 0)

    const uncategorizedItems = filteredItems.filter(item => !item.category_id)

    const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

    return (
        <div className="min-h-screen bg-background">
            {/* Location Initializer - Auto-detects on first visit */}
            <LocationInitializer userId={user?.id} />

            {/* Customer Header */}
            <CustomerHeader restaurant={restaurant} user={user} />

            {/* Search Bar */}
            <div className="border-b bg-background sticky top-16 z-30">
                <div className="container max-w-7xl mx-auto px-4 py-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search for dishes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {/* Category Tabs */}
                <CategoryTabs
                    categories={categories}
                    selectedCategory={selectedCategory}
                    onSelectCategory={setSelectedCategory}
                />
            </div>

            {/* Menu Items */}
            <main className="container max-w-7xl mx-auto px-4 py-6 pb-24">
                {filteredItems.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No items found</p>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {itemsByCategory.map(({ category, items }) => (
                            <section key={category.id} id={`category-${category.id}`}>
                                <h2 className="text-xl font-semibold mb-4">{category.name}</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {items.map(item => (
                                        <MenuItemCard key={item.id} item={item} />
                                    ))}
                                </div>
                            </section>
                        ))}

                        {uncategorizedItems.length > 0 && (
                            <section>
                                <h2 className="text-xl font-semibold mb-4">Other Items</h2>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {uncategorizedItems.map(item => (
                                        <MenuItemCard key={item.id} item={item} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </main>

            {/* Floating Cart Button */}
            {cartItemCount > 0 && (
                <div className="fixed bottom-4 left-0 right-0 z-50 px-4">
                    <Button
                        onClick={() => setIsCartOpen(true)}
                        className="w-full max-w-md mx-auto shadow-lg h-14 text-base"
                        size="lg"
                    >
                        <ShoppingCart className="mr-2 h-5 w-5" />
                        View Cart ({cartItemCount} {cartItemCount === 1 ? 'item' : 'items'})
                    </Button>
                </div>
            )}

            {/* Cart Drawer */}
            <CartDrawer
                open={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                restaurant={restaurant}
            />
        </div>
    )
}
