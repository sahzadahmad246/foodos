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

    // Redirect to login if not authenticated
    if (!user) {
        redirect(`/login?redirect=/r/${slug}/checkout`)
    }

    // Fetch restaurant by slug with settings
    const { data: restaurant, error } = await supabase
        .from("restaurants")
        .select(`
            *,
            restaurant_settings(*)
        `)
        .eq("slug", slug)
        .single()

    // Debug logging
    console.log('Checkout - Restaurant:', restaurant?.name)
    console.log('Checkout - Settings:', restaurant?.restaurant_settings)
    console.log('Checkout - Error:', error)

    if (!restaurant) {
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
        <div className="min-h-screen bg-background">
            <div className="max-w-xl mx-auto px-4">
                <CheckoutForm
                    restaurant={restaurant}
                    userId={user?.id}
                    savedAddresses={addresses}
                />
            </div>
        </div>
    )
}
