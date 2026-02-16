'use client'

import { useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface RealtimeRiderOrdersProps {
    riderId: string
    children?: React.ReactNode
}

export function RealtimeRiderOrders({ riderId, children }: RealtimeRiderOrdersProps) {
    const router = useRouter()
    const pathname = usePathname()
    const supabase = createClient()
    const refreshTimeoutRef = useRef<number | null>(null)
    const alertedOrderIdsRef = useRef<Set<string>>(new Set())

    const playAssignedAlert = useCallback(() => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

        const speechText = 'Dear partner, you have a new order assigned.'
        const utterance = new SpeechSynthesisUtterance(speechText)
        utterance.lang = 'en-US'
        utterance.rate = 0.95
        utterance.pitch = 1

        window.speechSynthesis.cancel()
        window.speechSynthesis.speak(utterance)
    }, [])

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

                        const isEligibleAssignmentStatus = ['pending', 'confirmed', 'preparing', 'ready'].includes(newOrder?.status)
                        const hasNotAlertedThisOrder = newOrder?.id && !alertedOrderIdsRef.current.has(newOrder.id)
                        const riderChangedToThisRider =
                            payload.eventType === 'UPDATE' &&
                            typeof oldOrder?.rider_id !== 'undefined' &&
                            oldOrder?.rider_id !== riderId &&
                            newOrder?.rider_id === riderId
                        const statusUnchangedDuringUpdate =
                            payload.eventType === 'UPDATE' &&
                            typeof oldOrder?.status !== 'undefined' &&
                            oldOrder?.status === newOrder?.status
                        const insertedAlreadyAssigned =
                            payload.eventType === 'INSERT' &&
                            newOrder?.rider_id === riderId

                        // Speak only once for true assignment-like events.
                        if (
                            hasNotAlertedThisOrder &&
                            isEligibleAssignmentStatus &&
                            (riderChangedToThisRider || insertedAlreadyAssigned || statusUnchangedDuringUpdate)
                        ) {
                            alertedOrderIdsRef.current.add(newOrder.id)
                            toast.success('🚴 New order assigned to you!')
                            playAssignedAlert()

                            if (pathname !== '/rider') {
                                router.push('/rider')
                            }

                            if (refreshTimeoutRef.current) {
                                window.clearTimeout(refreshTimeoutRef.current)
                            }
                            refreshTimeoutRef.current = window.setTimeout(() => {
                                router.refresh()
                            }, 1200)
                            return
                        }

                        // Order status changed to ready (preparing → ready)
                        if (payload.eventType === 'UPDATE' && oldOrder?.status === 'preparing' && newOrder.status === 'ready') {
                            toast.success('✅ Order is ready for pickup!')
                        }

                        // Order was cancelled
                        if (payload.eventType === 'UPDATE' && newOrder.status === 'cancelled' && oldOrder?.status !== 'cancelled') {
                            // If we already picked it up (out_for_delivery), show return alert
                            if (oldOrder?.status === 'out_for_delivery') {
                                toast.error('⚠️ Order cancelled! Please return to restaurant.', {
                                    duration: 10000,
                                    description: 'Check the order details for return OTP.'
                                })
                            } else {
                                toast.warning('Order has been cancelled')
                            }
                        }
                    }

                    // Refresh the page to get updated data
                    router.refresh()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
            if (refreshTimeoutRef.current) {
                window.clearTimeout(refreshTimeoutRef.current)
                refreshTimeoutRef.current = null
            }
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel()
            }
        }
    }, [riderId, supabase, router, pathname, playAssignedAlert])

    return <>{children}</>
}
