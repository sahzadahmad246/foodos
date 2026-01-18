import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import OrderConfirmation from "@/components/customer/order-confirmation"

export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function OrderPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch order with items and rider
    const { data: order, error } = await supabase
        .from("orders")
        .select(`
            *,
            order_items(*),
            rider:riders(id, name, phone, status)
        `)
        .eq("id", id)
        .single()

    console.log('Order fetch result:', order?.id, 'Error:', error)

    if (!order) {
        notFound()
    }

    // Fetch restaurant separately
    let restaurant = null
    if (order.restaurant_id) {
        const { data: restaurantData, error: restError } = await supabase
            .from("restaurants")
            .select(`
                id, 
                name, 
                logo_url,
                latitude,
                longitude,
                address_line1,
                address_line2,
                city,
                state,
                pincode
            `)
            .eq("id", order.restaurant_id)
            .single()

        console.log('Restaurant fetch:', restaurantData?.name, 'lat:', restaurantData?.latitude, 'Error:', restError)
        restaurant = restaurantData
    }

    // Combine order with restaurant
    const orderWithRestaurant = {
        ...order,
        restaurant
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="max-w-xl mx-auto px-4">
                <OrderConfirmation order={orderWithRestaurant} />
            </div>
        </div>
    )
}
