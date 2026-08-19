import { createClient } from '@/lib/supabase/server'
import { RiderBottomNav } from '@/components/rider/bottom-nav'
import { RealtimeRiderOrders } from '@/components/rider/realtime-rider-orders'

export default async function RiderLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    let riderId: string | null = null

    if (user) {
        const riderByEmail = user.email
            ? await supabase
                .from('riders')
                .select('id')
                .eq('email', user.email)
                .maybeSingle()
                .then((res) => res.data)
            : null

        const riderByUserId = await supabase
            .from('riders')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle()
            .then((res) => res.data)

        riderId = (riderByEmail || riderByUserId)?.id || null
    }

    return (
        <>
            {riderId ? <RealtimeRiderOrders riderId={riderId}>{children}</RealtimeRiderOrders> : children}
            <RiderBottomNav />
        </>
    )
}
