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

    // Fetch order with items
    const { data: order, error } = await supabase
        .from("orders")
        .select(`
            *,
            order_items(*)
        `)
        .eq("id", id)
        .single()

    console.log('Order fetch result:', order?.id, 'rider_id:', order?.rider_id, 'Error:', error)

    if (!order) {
        notFound()
    }

    // Fetch restaurant separately (RLS might block join)
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

        console.log('Restaurant fetch:', restaurantData?.name, 'Error:', restError)
        restaurant = restaurantData
    }

    // Fetch rider separately (RLS might block join)
    let rider = null
    if (order.rider_id) {
        const { data: riderData, error: riderError } = await supabase
            .from("riders")
            .select(`
                id,
                name,
                phone,
                status
            `)
            .eq("id", order.rider_id)
            .single()

        console.log('Rider fetch:', riderData?.name, 'status:', riderData?.status, 'Error:', riderError)
        rider = riderData
    }

    // Combine order with restaurant and rider
    const orderWithDetails = {
        ...order,
        restaurant,
        rider
    }

    return (
        <div className="min-h-screen bg-background">
            <OrderConfirmation order={orderWithDetails} />
        </div>
    )
}
