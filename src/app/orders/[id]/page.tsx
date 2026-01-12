import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { OrderConfirmation } from "@/components/customer/order-confirmation"

export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function OrderPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    // Fetch order with items
    const { data: order } = await supabase
        .from("orders")
        .select(`
            *,
            order_items(*)
        `)
        .eq("id", id)
        .single()

    if (!order) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-2xl mx-auto px-4 py-8">
                <OrderConfirmation order={order} />
            </div>
        </div>
    )
}
