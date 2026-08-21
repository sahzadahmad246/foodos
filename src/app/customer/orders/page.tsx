import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Box, ChevronRight, Package, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/customer/back-button"

export const dynamic = "force-dynamic"

interface OrderItem {
    id?: string
    name?: string | null
    quantity?: number | null
}

interface CustomerOrder {
    id: string
    order_number?: string | null
    status: string
    created_at: string
    total_amount: number
    restaurant?: {
        name?: string | null
        logo_url?: string | null
    } | null
    order_items?: OrderItem[] | null
}

export default async function CustomerOrdersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login?redirect=/customer/orders')
    }

    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            *,
            restaurant:restaurants(name, logo_url),
            order_items(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching orders:', error)
    }

    const customerOrders = (orders || []) as CustomerOrder[]

    const STATUS_COLORS: Record<string, string> = {
        pending: 'border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-200',
        confirmed: 'border-sky-500/35 bg-sky-500/10 text-sky-700 dark:text-sky-200',
        preparing: 'border-violet-500/35 bg-violet-500/10 text-violet-700 dark:text-violet-200',
        ready: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
        out_for_delivery: 'border-orange-500/35 bg-orange-500/10 text-orange-700 dark:text-orange-200',
        delivered: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200',
        cancelled: 'border-red-500/35 bg-red-500/10 text-red-700 dark:text-red-200',
    }

    return (
        <div className="mx-auto min-h-screen w-full max-w-lg bg-background pb-10 text-foreground md:border-x md:border-border/60 md:shadow-[0_0_0_1px_hsl(var(--border)),0_18px_45px_-20px_rgba(0,0,0,0.45)]">
            <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur">
                <div className="flex items-center gap-3 px-3 py-3">
                    <BackButton className="h-9 w-9 border border-border" />
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">History</p>
                        <h1 className="truncate text-lg font-semibold">My orders</h1>
                    </div>
                </div>
            </header>

            <main className="space-y-3 px-3 py-4">
                {customerOrders.length === 0 ? (
                    <div className="rounded-2xl border border-border/70 bg-card px-5 py-14 text-center">
                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-primary">
                            <Box className="h-8 w-8" />
                        </div>
                        <h2 className="text-lg font-bold">No orders yet</h2>
                        <p className="mx-auto mt-1 max-w-xs text-sm leading-relaxed text-muted-foreground">
                            Orders you place from restaurant pages will appear here.
                        </p>
                        <Button asChild className="mt-5 h-10 rounded-xl">
                            <Link href="/">Browse restaurants</Link>
                        </Button>
                    </div>
                ) : (
                    customerOrders.map((order) => {
                        const itemsSummary = order.order_items?.length
                            ? order.order_items
                                .map((item) => `${item.quantity || 1} x ${item.name || 'Item'}`)
                                .join(', ')
                            : 'Order items'

                        return (
                        <Link
                            href={`/orders/${order.id}`}
                            key={order.id}
                            className="block overflow-hidden rounded-2xl border border-border/70 bg-card transition hover:border-primary/35 hover:bg-muted/30"
                        >
                            <div className="p-3">
                                <div className="mb-3 flex items-start justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/15 text-primary">
                                            {order.restaurant?.logo_url ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={order.restaurant.logo_url} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <Store className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="truncate text-sm font-bold">
                                                {order.restaurant?.name || 'Restaurant'}
                                            </h3>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                {new Date(order.created_at).toLocaleString('en-IN', {
                                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={`shrink-0 rounded-full text-[10px] capitalize ${STATUS_COLORS[order.status] || 'border-border bg-muted text-muted-foreground'}`}>
                                        {order.status.replace(/_/g, ' ')}
                                    </Badge>
                                </div>

                                <div className="mb-3 flex items-start gap-2 rounded-xl bg-muted/45 px-3 py-2 text-xs text-muted-foreground">
                                    <Package className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                    <span className="line-clamp-2">{itemsSummary}</span>
                                </div>

                                <div className="flex items-center justify-between border-t border-border/70 pt-3 text-sm">
                                    <div>
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Total</p>
                                        <p className="font-bold">₹{Number(order.total_amount || 0).toFixed(0)}</p>
                                    </div>
                                    <div className="flex items-center text-xs font-semibold text-primary">
                                        View details <ChevronRight className="ml-1 h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                        )
                    })
                )}
            </main>
        </div>
    )
}
