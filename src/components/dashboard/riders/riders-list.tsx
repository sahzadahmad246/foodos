'use client'

import { useState } from 'react'
import { RiderCard } from './rider-card'
import { AddRiderModal } from './add-rider-modal'
import { Button } from '@/components/ui/button'
import { Plus, Users } from 'lucide-react'

interface Rider {
    id: string
    name: string
    email: string
    phone: string
    vehicle_type: string
    vehicle_number: string
    status: 'online' | 'offline' | 'on_delivery'
    is_active: boolean
}

interface RidersListProps {
    riders: Rider[]
    restaurantId: string
}

export function RidersList({ riders, restaurantId }: RidersListProps) {
    const [showAddModal, setShowAddModal] = useState(false)

    const onlineCount = riders.filter(r => r.status === 'online' && r.is_active).length
    const onDeliveryCount = riders.filter(r => r.status === 'on_delivery').length

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-green-600">{onlineCount}</span> online
                        {onDeliveryCount > 0 && (
                            <> · <span className="font-medium text-blue-600">{onDeliveryCount}</span> on delivery</>
                        )}
                    </div>
                </div>
                <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rider
                </Button>
            </div>

            {riders.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed p-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold text-lg mb-2">No riders yet</h3>
                    <p className="text-muted-foreground mb-4">
                        Add your first delivery rider to start managing deliveries
                    </p>
                    <Button onClick={() => setShowAddModal(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Rider
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {riders.map((rider) => (
                        <RiderCard key={rider.id} rider={rider} />
                    ))}
                </div>
            )}

            <AddRiderModal
                open={showAddModal}
                onOpenChange={setShowAddModal}
                restaurantId={restaurantId}
            />
        </>
    )
}
