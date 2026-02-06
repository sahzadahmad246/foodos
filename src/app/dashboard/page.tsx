import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ClipboardList, UtensilsCrossed, DollarSign, Users, TrendingUp, ChefHat, Clock } from 'lucide-react'
import { ProfileCompletionCard } from '@/components/dashboard/profile-completion-card'
import { calculateProfileCompletion } from '@/lib/profile-completion'
import Link from 'next/link'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('*, restaurant_settings(*)')
        .eq('owner_id', user?.id)
        .single()

    if (!restaurant) return null

    const settings = restaurant.restaurant_settings?.[0] || null
    const { percentage, missing } = calculateProfileCompletion(restaurant, settings)

    const stats = [
        { title: 'Today\'s Orders', value: '0', icon: ClipboardList, gradient: 'from-blue-500/10 to-blue-600/10', iconColor: 'text-blue-600 dark:text-blue-400' },
        { title: 'Menu Items', value: '0', icon: UtensilsCrossed, gradient: 'from-emerald-500/10 to-emerald-600/10', iconColor: 'text-emerald-600 dark:text-emerald-400' },
        { title: 'Today\'s Revenue', value: '₹0', icon: DollarSign, gradient: 'from-amber-500/10 to-amber-600/10', iconColor: 'text-amber-600 dark:text-amber-400' },
        { title: 'Active Riders', value: '0', icon: Users, gradient: 'from-teal-500/10 to-teal-600/10', iconColor: 'text-teal-600 dark:text-teal-400' },
    ]

    const quickActions = [
        { 
            title: 'Add Menu Items', 
            description: 'Create categories and add your dishes',
            icon: ChefHat,
            href: '/dashboard/menu',
            color: 'emerald'
        },
        { 
            title: 'Configure Settings', 
            description: 'Set delivery radius, payment methods',
            icon: Clock,
            href: '/dashboard/outlet',
            color: 'blue'
        },
        { 
            title: 'Add Riders', 
            description: 'Onboard delivery partners',
            icon: Users,
            href: '/dashboard/riders',
            color: 'teal'
        },
    ]

    return (
        <div className="space-y-8">
            {/* Profile Completion Card */}
            <ProfileCompletionCard percentage={percentage} missing={missing} />

            {/* Header */}
            <div>
                <div className="flex items-baseline gap-2">
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
                    <p className="text-lg text-muted-foreground">
                        {restaurant?.name}
                    </p>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                    Manage your restaurant, track orders, and grow your business
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="border-0 overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient}`} />
                        <CardHeader className="relative flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.iconColor}`} />
                        </CardHeader>
                        <CardContent className="relative">
                            <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Quick Actions Section */}
            <div>
                <div className="mb-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        Quick Start
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Get your restaurant up and running with these essential steps
                    </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {quickActions.map((action, index) => {
                        const colorClass = {
                            emerald: 'from-emerald-500/10 to-emerald-600/10 border-emerald-200/20 dark:border-emerald-800/20',
                            blue: 'from-blue-500/10 to-blue-600/10 border-blue-200/20 dark:border-blue-800/20',
                            teal: 'from-teal-500/10 to-teal-600/10 border-teal-200/20 dark:border-teal-800/20',
                        }
                        const iconColor = {
                            emerald: 'text-emerald-600 dark:text-emerald-400',
                            blue: 'text-blue-600 dark:text-blue-400',
                            teal: 'text-teal-600 dark:text-teal-400',
                        }
                        return (
                            <Link key={action.title} href={action.href}>
                                <Card className={`border-0 overflow-hidden hover:shadow-md transition-all cursor-pointer h-full bg-gradient-to-br ${colorClass[action.color]}`}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-start gap-4">
                                            <div className={`rounded-lg p-3 ${action.color === 'emerald' ? 'bg-emerald-500/20' : action.color === 'blue' ? 'bg-blue-500/20' : 'bg-teal-500/20'}`}>
                                                <action.icon className={`h-5 w-5 ${iconColor[action.color]}`} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-sm">Step {index + 1}: {action.title}</h3>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {action.description}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
