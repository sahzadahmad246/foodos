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

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch restaurant by slug with settings
    // Note: Removed is_online filter as customers should still be able to checkout
    // even if restaurant just went offline during their order
    const { data: restaurant, error } = await supabase
        .from("restaurants")
        .select(`
            *,
            restaurant_settings(*)
        `)
        .eq("slug", slug)
        .single()

    // Debug log to check settings
    console.log('Checkout page - restaurant:', restaurant?.name)
    console.log('Checkout page - settings:', restaurant?.restaurant_settings)

    if (!restaurant) {
        console.log('Checkout page - error:', error)
        notFound()
    }

    // Fetch user's saved addresses if logged in
    let addresses: any[] = []
    if (user) {
        const { data } = await supabase
            .from("customer_addresses")
            .select("*")
            .eq("user_id", user.id)
            .order("is_default", { ascending: false })
            .order("created_at", { ascending: false })
        addresses = data || []
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            <div className="max-w-lg mx-auto px-4 py-4 pb-8">
                <CheckoutForm
                    restaurant={restaurant}
                    userId={user?.id}
                    savedAddresses={addresses}
                />
            </div>
        </div>
    )
}
