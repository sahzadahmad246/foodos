import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { RiderOrderDetail } from "@/components/rider/order-detail"

export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function RiderOrderPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect("/login")

    // Get rider record
    const { data: rider } = await supabase
        .from("riders")
        .select("id")
        .eq("email", user.email)
        .single()

    if (!rider) redirect("/rider")

    // Get the order assigned to this rider
    const { data: order } = await supabase
        .from("orders")
        .select(`
            *,
            order_items(*),
            restaurant:restaurants(name, phone, address_line1, city)
        `)
        .eq("id", id)
        .eq("rider_id", rider.id)
        .single()

    if (!order) notFound()

    return <RiderOrderDetail order={order} riderId={rider.id} />
}
