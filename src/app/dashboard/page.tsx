import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ClipboardList, UtensilsCrossed, DollarSign, Users, ArrowUpRight, Store, CheckCircle2 } from 'lucide-react'
import { ProfileCompletionCard } from '@/components/dashboard/profile-completion-card'
import { calculateProfileCompletion } from '@/lib/profile-completion'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: restaurant } = await supabase.from('restaurants').select('*, restaurant_settings(*)').eq('owner_id', user?.id).single()
    if (!restaurant) return null

    const settings = restaurant.restaurant_settings?.[0] || null
    const { percentage, missing } = calculateProfileCompletion(restaurant, settings)
    const stats = [
        { title: "Today's orders", value: '0', note: 'No orders yet', icon: ClipboardList },
        { title: 'Menu items', value: '0', note: 'Ready to showcase', icon: UtensilsCrossed },
        { title: "Today's revenue", value: '₹0', note: 'Will update live', icon: DollarSign },
        { title: 'Active riders', value: '0', note: 'No riders added', icon: Users },
    ]
    const actions = [
        { href: '/dashboard/menu', label: 'Build your menu', description: 'Add categories and dishes customers will love.', icon: UtensilsCrossed },
        { href: '/dashboard/outlet', label: 'Set up your outlet', description: 'Make hours, address, and delivery details clear.', icon: Store },
        { href: '/dashboard/riders', label: 'Add delivery riders', description: 'Give your team the tools to move orders.', icon: Users },
    ]

    return (
        <div className="flex flex-col gap-7">
            <section className="dashboard-hero overflow-hidden rounded-3xl p-6 md:p-8">
                <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
                    <div className="max-w-2xl">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#d7f36b]/25 bg-[#d7f36b]/10 px-3 py-1.5 text-xs font-medium text-[#d7f36b]"><span className="size-1.5 rounded-full bg-[#d7f36b]" /> Live workspace</div>
                        <h2 className="max-w-xl font-serif text-4xl leading-[0.98] tracking-tight text-[#f7f4ec] md:text-6xl">Make every service feel <em className="text-[#d7f36b]">effortless.</em></h2>
                        <p className="mt-4 max-w-lg text-sm leading-6 text-white/55 md:text-base">Welcome back. Here&apos;s your operating view for <span className="text-white/85">{restaurant.name}</span>.</p>
                    </div>
                    <Button asChild className="w-fit rounded-full bg-[#f07f68] px-5 text-[#101715] hover:bg-[#ff957f]"><Link href="/dashboard/menu">Manage menu <ArrowUpRight data-icon="inline-end" /></Link></Button>
                </div>
            </section>

            <ProfileCompletionCard percentage={percentage} missing={missing} />

            <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
                {stats.map((stat) => (
                    <Card key={stat.title} className="dashboard-card border-0 shadow-none">
                        <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3"><CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">{stat.title}</CardTitle><stat.icon className="size-4 text-primary" /></CardHeader>
                        <CardContent><p className="font-serif text-3xl tracking-tight sm:text-4xl">{stat.value}</p><p className="mt-1 text-xs text-muted-foreground">{stat.note}</p></CardContent>
                    </Card>
                ))}
            </section>

            <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
                <Card className="dashboard-card border-0 shadow-none"><CardHeader className="flex flex-row items-end justify-between gap-4"><div><CardTitle className="font-serif text-2xl">Your next best moves</CardTitle><CardDescription className="mt-1">A few quick wins to get your restaurant humming.</CardDescription></div><Button asChild variant="ghost" size="sm" className="hidden rounded-full sm:flex"><Link href="/dashboard/settings">Settings <ArrowUpRight data-icon="inline-end" /></Link></Button></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3">{actions.map((action, index) => <Link key={action.href} href={action.href} className="group rounded-2xl border border-border/70 bg-background/40 p-4 transition-colors hover:border-primary/50 hover:bg-primary/5"><div className="mb-7 flex items-center justify-between"><span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><action.icon className="size-4" /></span><span className="text-xs text-muted-foreground">0{index + 1}</span></div><h3 className="font-medium group-hover:text-primary">{action.label}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{action.description}</p></Link>)}</CardContent></Card>
                <Card className="dashboard-card border-0 shadow-none"><CardHeader><CardTitle className="font-serif text-2xl">Today at a glance</CardTitle><CardDescription>A calm start is a good start.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3">{['Orders will appear here', 'Revenue updates in real time', 'Rider activity stays visible'].map((item) => <div key={item} className="flex items-center gap-3 rounded-xl bg-background/50 px-3 py-3 text-sm"><CheckCircle2 className="size-4 text-primary" />{item}</div>)}<div className="mt-2 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-4"><p className="text-sm font-medium">Open your public menu</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Share your link once your menu is ready.</p></div></CardContent></Card>
            </div>
        </div>
    )
}
