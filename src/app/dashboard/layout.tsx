import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardHeader } from '@/components/dashboard/header'
import { GlobalNewOrderListener } from '@/components/dashboard/orders/global-new-order-listener'
import { canGoOnline } from '@/lib/profile-completion'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if user has a restaurant
    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*, restaurant_settings(*)')
        .eq('owner_id', user.id)
        .single()

    // Redirect to onboarding if no restaurant
    if (!restaurant) {
        redirect('/onboarding')
    }

    const { allowed: canGoOnlineStatus } = canGoOnline(restaurant)

    return (
        <div className="flex min-h-screen bg-muted/40 overflow-x-hidden">
            <DashboardSidebar restaurant={restaurant} />
            <div className="flex flex-1 flex-col md:pl-64 w-full min-w-0">
                <DashboardHeader
                    user={user}
                    restaurant={restaurant}
                    profileComplete={canGoOnlineStatus}
                />
                <GlobalNewOrderListener
                    restaurantId={restaurant.id}
                    restaurantInfo={{
                        id: restaurant.id,
                        name: restaurant.name,
                        logo_url: restaurant.logo_url,
                        phone: restaurant.phone,
                        address_line1: restaurant.address_line1,
                        address_line2: restaurant.address_line2,
                        city: restaurant.city,
                        state: restaurant.state,
                        pincode: restaurant.pincode,
                        gst_number: Array.isArray(restaurant.restaurant_settings)
                            ? restaurant.restaurant_settings[0]?.gst_number
                            : (restaurant.restaurant_settings as any)?.gst_number,
                    }}
                    autoAcceptOrders={Array.isArray(restaurant.restaurant_settings)
                        ? Boolean(restaurant.restaurant_settings[0]?.auto_accept_orders)
                        : Boolean((restaurant.restaurant_settings as any)?.auto_accept_orders)}
                />
                <main className="flex-1 overflow-x-hidden p-4 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
