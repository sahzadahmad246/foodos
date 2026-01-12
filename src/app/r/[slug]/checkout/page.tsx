import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import { CheckoutForm } from "@/components/customer/checkout-form"

export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function CheckoutPage({ params }: PageProps) {
    const { slug } = await params
    const supabase = await createClient()

    // Fetch restaurant by slug
    const { data: restaurant } = await supabase
        .from("restaurants")
        .select("*, restaurant_settings(*)")
        .eq("slug", slug)
        .eq("is_online", true)
        .single()

    if (!restaurant) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container max-w-2xl mx-auto px-4 py-8">
                <h1 className="text-2xl font-bold mb-6">Checkout</h1>
                <CheckoutForm restaurant={restaurant} />
            </div>
        </div>
    )
}
