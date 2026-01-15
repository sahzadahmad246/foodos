import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Box, Clock, ChevronRight, Store, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const dynamic = "force-dynamic"

export default async function CustomerOrdersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch user's orders
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

    const STATUS_COLORS: Record<string, string> = {
        pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
        confirmed: 'bg-blue-500/10 text-blue-600 border-blue-200',
        preparing: 'bg-purple-500/10 text-purple-600 border-purple-200',
        ready: 'bg-green-500/10 text-green-600 border-green-200',
        out_for_delivery: 'bg-orange-500/10 text-orange-600 border-orange-200',
        delivered: 'bg-green-500/10 text-green-600 border-green-200',
        cancelled: 'bg-red-500/10 text-red-600 border-red-200',
    }

    return (
        <div className="min-h-screen bg-muted/40 pb-20">
            <div className="bg-background border-b sticky top-0 z-10">
                <div className="container max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="font-semibold text-lg">My Orders</h1>
                </div>
            </div>

            <div className="container max-w-lg mx-auto px-4 py-6 space-y-4">
                {!orders || orders.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                            <Box className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
                        <p className="text-muted-foreground mb-6">
                            Start ordering delicious food from your favorite restaurants!
                        </p>
                        <Button asChild>
                            <Link href="/">Browse Restaurants</Link>
                        </Button>
                    </div>
                ) : (
                    orders.map((order) => (
                        <Link
                            href={`/customer/orders/${order.id}`}
                            key={order.id}
                            className="block bg-card border rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="p-4">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Store className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">
                                                {order.restaurant?.name || 'Restaurant'}
                                            </h3>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(order.created_at).toLocaleString('en-IN', {
                                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className={STATUS_COLORS[order.status] || 'bg-gray-100'}>
                                        {order.status.replace(/_/g, ' ')}
                                    </Badge>
                                </div>

                                {/* Items Summary */}
                                <div className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                    {order.order_items?.map((item: any) =>
                                        `${item.quantity} × ${item.name}`
                                    ).join(', ')}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-3 border-t text-sm">
                                    <div className="font-semibold">
                                        ₹{order.total_amount.toFixed(0)}
                                    </div>
                                    <div className="flex items-center text-primary font-medium">
                                        View Details <ChevronRight className="h-4 w-4 ml-1" />
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
