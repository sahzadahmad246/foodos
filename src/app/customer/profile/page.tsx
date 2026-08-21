import { redirect } from "next/navigation"
import Link from "next/link"
import { CalendarDays, ChevronRight, Mail, MapPin, Package, Settings2, User, WalletCards } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { BackButton } from "@/components/customer/back-button"
import { ThemeToggle } from "@/components/theme-toggle"

export const dynamic = "force-dynamic"

export default async function CustomerProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login?redirect=/customer/profile")
    }

    const [{ count: orderCount }, { count: addressCount }] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("customer_addresses").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    ])

    const name = user.user_metadata?.full_name || user.user_metadata?.name || "Food lover"
    const email = user.email || "No email added"
    const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture
    const createdAt = new Date(user.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    })
    const initials = name
        .split(" ")
        .map((part: string) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)

    const quickLinks = [
        {
            href: "/customer/orders",
            label: "Orders",
            value: orderCount || 0,
            icon: Package,
        },
        {
            href: "/customer/addresses",
            label: "Addresses",
            value: addressCount || 0,
            icon: MapPin,
        },
    ]

    return (
        <div className="mx-auto min-h-screen w-full max-w-lg bg-background text-foreground md:border-x md:border-border/60 md:shadow-[0_0_0_1px_hsl(var(--border)),0_18px_45px_-20px_rgba(0,0,0,0.45)]">
            <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur">
                <div className="flex items-center gap-3 px-3 py-3">
                    <BackButton className="h-9 w-9 border border-border" />
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Account</p>
                        <h1 className="truncate text-lg font-semibold">Profile</h1>
                    </div>
                    <Button asChild variant="outline" size="icon" className="h-9 w-9 rounded-full">
                        <Link href="/customer/addresses" aria-label="Saved addresses">
                            <MapPin className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </header>

            <main className="space-y-4 px-3 pb-10 pt-4">
                <section className="overflow-hidden rounded-2xl border border-border/70 bg-card">
                    <div className="relative h-28 bg-muted">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,hsl(var(--primary)/0.32),transparent_32%),linear-gradient(135deg,hsl(var(--primary)/0.16),hsl(var(--accent)/0.22),transparent)]" />
                        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
                            <Avatar className="h-20 w-20 border-4 border-card shadow-sm">
                                <AvatarImage src={avatarUrl} alt={name} />
                                <AvatarFallback className="bg-primary/15 text-xl font-bold text-primary">
                                    {initials || <User className="h-8 w-8" />}
                                </AvatarFallback>
                            </Avatar>
                            <span className="rounded-full bg-background/90 px-3 py-1 text-xs font-semibold text-foreground shadow-sm ring-1 ring-border/70">
                                Member since {createdAt}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-4 px-4 pb-4 pt-7">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">{name}</h2>
                            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                                <Mail className="h-4 w-4" />
                                <span className="truncate">{email}</span>
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {quickLinks.map((item) => {
                                const Icon = item.icon
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="rounded-xl border border-border/70 bg-background/70 p-3 transition hover:border-primary/40 hover:bg-muted/50"
                                    >
                                        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <p className="text-2xl font-bold">{item.value}</p>
                                        <p className="text-xs font-medium text-muted-foreground">{item.label}</p>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <p className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">FoodOS</p>
                    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
                        <Link href="/customer/orders" className="flex items-center gap-3 border-b border-border/70 px-4 py-4 hover:bg-muted/45">
                            <Package className="h-5 w-5 text-primary" />
                            <span className="flex-1 font-medium">My orders</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                        <Link href="/customer/addresses" className="flex items-center gap-3 border-b border-border/70 px-4 py-4 hover:bg-muted/45">
                            <MapPin className="h-5 w-5 text-primary" />
                            <span className="flex-1 font-medium">Saved addresses</span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </Link>
                        <div className="flex items-center gap-3 px-4 py-4">
                            <WalletCards className="h-5 w-5 text-primary" />
                            <div className="flex-1">
                                <p className="font-medium">Payments</p>
                                <p className="text-xs text-muted-foreground">Cash and online checkout are supported.</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-3">
                    <p className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Appearance</p>
                    <div className="rounded-2xl border border-border/70 bg-card p-4">
                        <div className="mb-3 flex items-center gap-2">
                            <Settings2 className="h-4 w-4 text-primary" />
                            <p className="font-medium">Theme</p>
                        </div>
                        <ThemeToggle />
                    </div>
                </section>

                <div className="flex items-center justify-center gap-1.5 pt-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-3.5 w-3.5" />
                    Joined on {createdAt}
                </div>
            </main>
        </div>
    )
}
