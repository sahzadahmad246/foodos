import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import OrderConfirmation from "@/components/customer/order-confirmation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function CustomerOrderDetailsPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch order with items
    const { data: order } = await supabase
        .from("orders")
        .select(`
            *,
            order_items(*)
        `)
        .eq("id", id)
        .single()

    if (!order) {
        notFound()
    }

    // Secure checking: verify phone number matches
    // Note: strict equality check might fail if formatting differs
    // We check if verified user phone is present in order's customer phone
    // or if order's phone is contained in user's phone
    const userPhone = user.phone || user.user_metadata?.phone || user.user_metadata?.mobile
    const orderPhone = order.customer_phone

    if (!userPhone || !orderPhone || !orderPhone.includes(userPhone.replace('+91', '')) && !userPhone.includes(orderPhone.replace('+91', ''))) {
        // Limit access if phone doesn't match
        // For development/demo purposes we might be lenient or redirect
        // For now, redirect to public order page which is accessible
        redirect(`/orders/${id}`)
    }

    return (
        <div className="min-h-screen bg-muted/40 pb-20">
            {/* Header */}
            <div className="bg-background border-b sticky top-0 z-10">
                <div className="container max-w-xl mx-auto px-4 py-4 flex items-center gap-4">
                    <Link href="/customer/orders">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="font-semibold text-lg">Order Details</h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 py-6">
                <OrderConfirmation order={order} />
            </div>
        </div>
    )
}
