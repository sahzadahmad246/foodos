import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserDropdown } from '@/components/user-dropdown'
import {
    CashPageClient,
    type CollectedEntry,
    type DepositLedgerEntry,
    type DepositRequest,
} from '@/components/rider/cash-page-client'

export const dynamic = 'force-dynamic'

export default async function RiderCashPage() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const riderByEmail = user.email
        ? await supabase
            .from('riders')
            .select('id, name, cash_in_hand')
            .eq('email', user.email)
            .maybeSingle()
            .then((res) => res.data)
        : null

    const riderByUserId = await supabase
        .from('riders')
        .select('id, name, cash_in_hand')
        .eq('user_id', user.id)
        .maybeSingle()
        .then((res) => res.data)

    const rider = riderByEmail || riderByUserId

    if (!rider) redirect('/rider')

    const { data: ledgerEntries } = await supabase
        .from('rider_cash_ledger')
        .select(`
            id,
            type,
            amount,
            note,
            created_at,
            order:orders(
                id,
                order_number,
                customer_name,
                customer_address
            )
        `)
        .eq('rider_id', rider.id)
        .order('created_at', { ascending: false })
        .limit(100)

    const { data: depositRequests } = await supabase
        .from('rider_cash_deposit_requests')
        .select('id, amount, status, note, requested_at, decided_at')
        .eq('rider_id', rider.id)
        .order('created_at', { ascending: false })
        .limit(100)

    const collectedEntries: CollectedEntry[] = (ledgerEntries || [])
        .filter((item) => item.type === 'collect')
        .map((item) => {
            const relatedOrder = Array.isArray(item.order) ? item.order[0] : item.order
            return {
                id: item.id,
                amount: Number(item.amount || 0),
                created_at: item.created_at,
                order: relatedOrder
                    ? {
                        id: relatedOrder.id,
                        order_number: relatedOrder.order_number,
                        customer_name: relatedOrder.customer_name,
                        customer_address: relatedOrder.customer_address,
                    }
                    : null,
            }
        })

    const depositLedgerEntries: DepositLedgerEntry[] = (ledgerEntries || [])
        .filter((item) => item.type === 'deposit')
        .map((item) => ({
            id: item.id,
            amount: Number(item.amount || 0),
            created_at: item.created_at,
            note: item.note,
        }))

    const mappedDepositRequests: DepositRequest[] = (depositRequests || []).map((item) => ({
        id: item.id,
        amount: Number(item.amount || 0),
        status: item.status,
        note: item.note,
        requested_at: item.requested_at,
        decided_at: item.decided_at,
    }))

    return (
        <div className="min-h-screen bg-muted/30 pb-24">
            <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur">
                <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
                    <div>
                        <h1 className="text-lg font-bold">Cash</h1>
                        <p className="text-sm text-muted-foreground">Collections and deposits</p>
                    </div>
                    <UserDropdown
                        user={{
                            email: user.email,
                            name: rider.name || user.user_metadata?.full_name,
                            avatarUrl: user.user_metadata?.avatar_url,
                        }}
                    />
                </div>
            </header>

            <main className="mx-auto max-w-lg px-4 py-5">
                <CashPageClient
                    cashInHand={Number(rider.cash_in_hand || 0)}
                    collectedEntries={collectedEntries}
                    depositLedgerEntries={depositLedgerEntries}
                    depositRequests={mappedDepositRequests}
                />
            </main>
        </div>
    )
}
