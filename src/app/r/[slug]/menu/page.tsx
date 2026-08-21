import { notFound } from "next/navigation"
import { RestaurantMenu } from "@/components/customer/restaurant-menu"
import { getRestaurantStorefront } from "@/lib/restaurant-storefront"

export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function RestaurantMenuPage({ params }: PageProps) {
    const { slug } = await params
    const { restaurant, categories, menuItems, buyAgainItems, activeOrders, user } = await getRestaurantStorefront(slug)

    if (!restaurant) {
        notFound()
    }

    return (
        <RestaurantMenu
            restaurant={restaurant}
            categories={categories}
            menuItems={menuItems}
            buyAgainItems={buyAgainItems}
            activeOrders={activeOrders}
            user={user}
            mode="menu"
        />
    )
}
