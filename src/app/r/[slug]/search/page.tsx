import { Suspense } from "react"
import { notFound } from "next/navigation"
import { RestaurantSearch } from "@/components/customer/restaurant-search"
import { getRestaurantStorefront } from "@/lib/restaurant-storefront"

export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ slug: string }>
    searchParams: Promise<{ q?: string }>
}

export default async function RestaurantSearchPage({ params, searchParams }: PageProps) {
    const { slug } = await params
    const { q = '' } = await searchParams
    const { restaurant, categories, menuItems, buyAgainItems, activeOrders, user } = await getRestaurantStorefront(slug)

    if (!restaurant) {
        notFound()
    }

    return (
        <Suspense fallback={<div className="min-h-screen bg-background" />}>
            <RestaurantSearch
                restaurant={restaurant}
                categories={categories}
                menuItems={menuItems}
                buyAgainItems={buyAgainItems}
                activeOrders={activeOrders}
                user={user}
                initialQuery={q}
            />
        </Suspense>
    )
}
