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

    if (!user) redirect('/login')

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*, restaurant_settings(*)')
        .eq('owner_id', user.id)
        .single()

    if (!restaurant) redirect('/onboarding')

    const { allowed: canGoOnlineStatus } = canGoOnline(restaurant)

    return (
        <div className="dashboard-shell flex min-h-screen overflow-x-hidden">
            <DashboardSidebar restaurant={restaurant} />
            <div className="flex min-w-0 flex-1 flex-col md:pl-64">
                <DashboardHeader
                    user={user}
                    restaurant={restaurant}
                    profileComplete={canGoOnlineStatus}
                />
                <main className="flex-1 overflow-x-hidden px-4 py-6 md:px-8 md:py-8">
                    <div className="mx-auto w-full max-w-[1500px]">{children}</div>
                </main>
            </div>
        </div>
    )
}
