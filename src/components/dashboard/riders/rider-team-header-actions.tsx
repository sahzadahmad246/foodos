'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { AddRiderModal } from './add-rider-modal'

interface RiderTeamHeaderActionsProps {
    restaurantId: string
    onlineCount: number
    onDeliveryCount: number
}

export function RiderTeamHeaderActions({
    restaurantId,
    onlineCount,
    onDeliveryCount,
}: RiderTeamHeaderActionsProps) {
    const [showAddModal, setShowAddModal] = useState(false)

    return (
        <>
            <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-green-600">{onlineCount}</span> online
                    {onDeliveryCount > 0 && (
                        <> · <span className="font-medium text-blue-600">{onDeliveryCount}</span> on delivery</>
                    )}
                </div>
                <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Rider
                </Button>
            </div>

            <AddRiderModal
                open={showAddModal}
                onOpenChange={setShowAddModal}
                restaurantId={restaurantId}
            />
        </>
    )
}
