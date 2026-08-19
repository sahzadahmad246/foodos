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
    const { data: restaurant } = await supabase
        .from("restaurants")
        .select(`
            *,
            restaurant_settings(*)
        `)
        .eq("slug", slug)
        .single()

    // Debug logging
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

    const { data: suggestedItems } = await supabase
        .from("menu_items")
        .select("id, name, price, compare_at_price, image_url, is_veg")
        .eq("restaurant_id", restaurant.id)
        .eq("is_available", true)
        .order("is_featured", { ascending: false })
        .order("sort_order", { ascending: true })
        .limit(12)

    if (!restaurant.is_online) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-xl mx-auto px-4 py-16">
                    <div className="rounded-xl border border-amber-300 bg-amber-50 p-6 text-center">
                        <h1 className="text-xl font-semibold text-amber-900">Restaurant is not accepting orders</h1>
                        <p className="mt-2 text-sm text-amber-800">
                            This restaurant is currently offline. Please try again later.
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f4f5f7]">
            <div className="max-w-xl mx-auto px-4">
                <CheckoutForm
                    restaurant={restaurant}
                    userId={user?.id}
                    savedAddresses={addresses}
                    suggestedItems={suggestedItems || []}
                />
            </div>
        </div>
    )
}
