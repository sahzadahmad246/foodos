import { RiderCard } from './rider-card'
import { Users } from 'lucide-react'

interface Rider {
    id: string
    name: string
    email: string
    phone: string
    vehicle_type: string
    vehicle_number: string
    status: 'online' | 'offline' | 'on_delivery' | 'delivering' | 'returning'
    is_active: boolean
    cash_in_hand?: number | null
    cash_collected_total?: number | null
    cash_deposited_total?: number | null
    delivered_count?: number | null
}

interface RidersListProps {
    riders: Rider[]
    ledgerByRider: Record<string, Array<{
        id: string
        type: 'collect' | 'deposit'
        amount: number
        created_at: string
        order?: {
            order_number?: string | null
        } | null
    }>>
    requestsByRider: Record<string, Array<{
        id: string
        amount: number
        status: 'pending' | 'approved' | 'rejected' | 'cancelled'
        note?: string | null
        requested_at: string
    }>>
}

export function RidersList({ riders, ledgerByRider, requestsByRider }: RidersListProps) {
    return (
        <>
            {riders.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed p-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No riders yet</h3>
                    <p className="text-muted-foreground mb-4">
                        Add your first delivery rider to start managing deliveries
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {riders.map((rider) => {
                        const dividerClass = [
                            'border-b border-border/70',
                            'md:border-r',
                            'md:[&:nth-child(2n)]:border-r-0',
                            'xl:[&:nth-child(2n)]:border-r',
                            'xl:[&:nth-child(3n)]:border-r-0',
                        ].join(' ')

                        return (
                            <div key={rider.id} className={dividerClass}>
                                <RiderCard
                                    rider={rider}
                                    ledgerEntries={ledgerByRider[rider.id] || []}
                                    depositRequests={requestsByRider[rider.id] || []}
                                />
                            </div>
                        )
                    })}
                </div>
            )}
        </>
    )
}
