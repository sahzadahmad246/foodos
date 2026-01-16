'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Clock, MapPin, Phone, User, Package,
    Check, X, Loader2, Store, CreditCard, Banknote
} from 'lucide-react'
import { acceptOrder, rejectOrder } from '../actions/order-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface OrderItem {
    id: string
    name: string
    price: number
    quantity: number
}

interface NewOrder {
    id: string
    order_number: string
    customer_name: string
    customer_phone: string | null
    customer_address: string | null
    total_amount: number
    payment_method: string
    created_at: string
    order_items?: OrderItem[]
}

interface NewOrderModalProps {
    order: NewOrder | null
    open: boolean
    onClose: () => void
}

export function NewOrderModal({ order, open, onClose }: NewOrderModalProps) {
    const router = useRouter()
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const [isAccepting, setIsAccepting] = React.useState(false)
    const [isRejecting, setIsRejecting] = React.useState(false)

    // Play notification sound when modal opens
    useEffect(() => {
        if (open && order) {
            // Create and play sound
            if (!audioRef.current) {
                audioRef.current = new Audio('/sounds/new-order.mp3')
                audioRef.current.loop = true
            }
            audioRef.current.play().catch(() => {
                // Autoplay might be blocked
                console.log('Audio autoplay blocked')
            })
        } else {
            // Stop sound when modal closes
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current.currentTime = 0
            }
        }

        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
            }
        }
    }, [open, order])

    const handleAccept = async () => {
        if (!order) return
        setIsAccepting(true)
        const result = await acceptOrder(order.id)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Order accepted!')
            onClose()
            router.refresh()
        }
        setIsAccepting(false)
    }

    const handleReject = async () => {
        if (!order) return
        setIsRejecting(true)
        const result = await rejectOrder(order.id)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Order rejected')
            onClose()
            router.refresh()
        }
        setIsRejecting(false)
    }

    if (!order) return null

    const isPickup = !order.customer_address
    const timeAgo = new Date(order.created_at).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
    })

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-md p-0 overflow-hidden border-2 border-primary animate-pulse-border max-h-[90vh] flex flex-col">
                {/* Animated Header */}
                <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 text-center flex-shrink-0">
                    <div className="animate-bounce mb-2">
                        <Package className="h-12 w-12 mx-auto" />
                    </div>
                    <h2 className="text-2xl font-bold">New Order! 🎉</h2>
                    <p className="text-primary-foreground/80 text-sm mt-1">
                        #{order.order_number}
                    </p>
                </div>

                {/* Order Details - Scrollable */}
                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    {/* Customer Info */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{order.customer_name}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {timeAgo}
                        </div>
                    </div>

                    {order.customer_phone && (
                        <a
                            href={`tel:${order.customer_phone}`}
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                            <Phone className="h-4 w-4" />
                            {order.customer_phone}
                        </a>
                    )}

                    {/* Delivery/Pickup */}
                    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                        {isPickup ? (
                            <>
                                <Store className="h-5 w-5 text-primary" />
                                <Badge variant="secondary" className="bg-primary/10 text-primary">
                                    🏬 Pickup Order
                                </Badge>
                            </>
                        ) : (
                            <>
                                <MapPin className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm line-clamp-2">{order.customer_address}</span>
                            </>
                        )}
                    </div>

                    {/* Payment Method */}
                    <div className="flex items-center gap-2">
                        {order.payment_method === 'cod' ? (
                            <>
                                <Banknote className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Cash on Delivery</span>
                            </>
                        ) : (
                            <>
                                <CreditCard className="h-4 w-4 text-blue-600" />
                                <span className="text-sm text-green-600 font-medium">Paid Online ✓</span>
                            </>
                        )}
                    </div>

                    {/* Items */}
                    {order.order_items && order.order_items.length > 0 && (
                        <div className="bg-muted/30 rounded-lg p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                                Order Items
                            </p>
                            <div className="space-y-1">
                                {order.order_items.map((item) => (
                                    <div key={item.id} className="flex justify-between text-sm">
                                        <span>{item.quantity}x {item.name}</span>
                                        <span className="font-medium">₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Total */}
                    <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-bold text-lg">Total</span>
                        <span className="font-bold text-xl text-primary">₹{order.total_amount}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 border-t flex-shrink-0">
                    <Button
                        variant="outline"
                        size="lg"
                        onClick={handleReject}
                        disabled={isAccepting || isRejecting}
                        className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                        {isRejecting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <X className="h-4 w-4 mr-2" />
                        )}
                        Reject
                    </Button>
                    <Button
                        size="lg"
                        onClick={handleAccept}
                        disabled={isAccepting || isRejecting}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {isAccepting ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Check className="h-4 w-4 mr-2" />
                        )}
                        Accept
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
