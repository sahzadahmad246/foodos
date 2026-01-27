'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface RealtimeRiderOrdersProps {
    riderId: string
    children: React.ReactNode
}

export function RealtimeRiderOrders({ riderId, children }: RealtimeRiderOrdersProps) {
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        // Subscribe to order changes for this rider
        const channel = supabase
            .channel('rider-orders')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'orders',
                    filter: `rider_id=eq.${riderId}`
                },
                (payload) => {
                    console.log('Rider order change:', payload)

                    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                        const newOrder = payload.new as any
                        const oldOrder = payload.old as any

                        // New order assigned to this rider
                        if (payload.eventType === 'UPDATE' && newOrder.rider_id === riderId && (!oldOrder || oldOrder.rider_id !== riderId)) {
                            toast.success('🚴 New order assigned to you!')
                        }

                        // Order status changed to ready (preparing → ready)
                        if (payload.eventType === 'UPDATE' && oldOrder?.status === 'preparing' && newOrder.status === 'ready') {
                            toast.success('✅ Order is ready for pickup!')
                        }
                    }

                    // Refresh the page to get updated data
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [riderId, supabase, router])

    return <>{children}</>
}
