import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, UtensilsCrossed, DollarSign, Users } from 'lucide-react'
import { ProfileCompletionCard } from '@/components/dashboard/profile-completion-card'
import { calculateProfileCompletion } from '@/lib/profile-completion'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*, restaurant_settings(*)')
        .eq('owner_id', user?.id)
        .single()

    if (!restaurant) return null

    const settingsRelation = (restaurant as any).restaurant_settings
    const settings = Array.isArray(settingsRelation)
        ? (settingsRelation[0] ?? null)
        : (settingsRelation ?? null)
    const { percentage, missing } = calculateProfileCompletion(restaurant, settings)

    const stats = [
        { title: 'Today\'s Orders', value: '0', icon: ClipboardList, color: 'text-blue-600' },
        { title: 'Menu Items', value: '0', icon: UtensilsCrossed, color: 'text-green-600' },
        { title: 'Today\'s Revenue', value: '₹0', icon: DollarSign, color: 'text-amber-600' },
        { title: 'Active Riders', value: '0', icon: Users, color: 'text-purple-600' },
    ]

    return (
        <div className="space-y-6">
            {/* Profile Completion Card */}
            <ProfileCompletionCard percentage={percentage} missing={missing} />

            <div>
                <h2 className="text-2xl font-bold">Welcome back!</h2>
                <p className="text-muted-foreground">
                    Here&apos;s what&apos;s happening at {restaurant?.name}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Start</CardTitle>
                    <CardDescription>Get your restaurant up and running</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg border p-4">
                        <h3 className="font-semibold">1. Add Menu Items</h3>
                        <p className="text-sm text-muted-foreground">
                            Create categories and add your dishes
                        </p>
                    </div>
                    <div className="rounded-lg border p-4">
                        <h3 className="font-semibold">2. Configure Settings</h3>
                        <p className="text-sm text-muted-foreground">
                            Set delivery radius, payment methods
                        </p>
                    </div>
                    <div className="rounded-lg border p-4">
                        <h3 className="font-semibold">3. Add Riders</h3>
                        <p className="text-sm text-muted-foreground">
                            Onboard delivery partners
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
