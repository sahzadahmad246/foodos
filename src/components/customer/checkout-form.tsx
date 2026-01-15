'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useCart } from '@/hooks/use-cart'
import { createOrder } from '@/app/r/[slug]/actions'
import { AddressSelector, Address } from './address-selector'
import { toast } from 'sonner'
import {
    Loader2, MapPin, User, Phone, ChevronRight, CreditCard, Banknote,
    ShoppingBag, Truck, Store, ChevronLeft, Minus, Plus, Trash2,
    Shield, Clock, Tag, Navigation, ArrowLeft
} from 'lucide-react'
import { useLocation } from '@/hooks/use-location'
import Image from 'next/image'
import Link from 'next/link'

declare global {
    interface Window {
        Razorpay: any
    }
}

interface RestaurantSettings {
    gst_percentage: number | null
    delivery_fee: number | null
    free_delivery_above: number | null
    min_order_amount: number | null
    cod_enabled: boolean
    online_payment_enabled: boolean
    razorpay_key_id: string | null
}

interface Restaurant {
    id: string
    name: string
    slug: string
    logo_url?: string | null
    latitude?: number | null
    longitude?: number | null
    address_line1?: string | null
    address_line2?: string | null
    city?: string | null
    state?: string | null
    pincode?: string | null
    restaurant_settings: RestaurantSettings[] | RestaurantSettings | null
}

interface CheckoutFormProps {
    restaurant: Restaurant
    userId?: string
    savedAddresses: Address[]
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

export function CheckoutForm({ restaurant, userId, savedAddresses }: CheckoutFormProps) {
    const router = useRouter()
    const { items, getTotal, clearCart, updateQuantity, removeItem } = useCart()
    const [isPending, startTransition] = useTransition()
    const [showAddressModal, setShowAddressModal] = useState(false)
    const [isProcessingPayment, setIsProcessingPayment] = useState(false)
    const { currentLocation } = useLocation()

    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
    const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery')
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod')
    const [notes, setNotes] = useState('')

    // Handle settings
    const settingsRaw = restaurant.restaurant_settings
    const settings = Array.isArray(settingsRaw) ? settingsRaw[0] : settingsRaw

    const codEnabled = settings?.cod_enabled !== false
    const onlineEnabled = settings?.online_payment_enabled === true && !!settings?.razorpay_key_id

    // Auto-select address
    useEffect(() => {
        if (savedAddresses.length > 0 && !selectedAddress) {
            if (currentLocation?.latitude && currentLocation?.longitude) {
                let closestAddress = savedAddresses[0]
                let minDistance = Infinity

                savedAddresses.forEach(addr => {
                    if (addr.latitude && addr.longitude) {
                        const distance = calculateDistance(
                            currentLocation.latitude!, currentLocation.longitude!,
                            addr.latitude, addr.longitude
                        )
                        if (distance < minDistance) {
                            minDistance = distance
                            closestAddress = addr
                        }
                    }
                })

                if (minDistance < 0.5) {
                    setSelectedAddress(closestAddress)
                    return
                }
            }
            const defaultAddress = savedAddresses.find(a => a.is_default) || savedAddresses[0]
            setSelectedAddress(defaultAddress)
        }
    }, [savedAddresses, currentLocation, selectedAddress])

    // Set default payment
    useEffect(() => {
        if (codEnabled) {
            setPaymentMethod('cod')
        } else if (onlineEnabled) {
            setPaymentMethod('online')
        }
    }, [codEnabled, onlineEnabled])

    // Calculate totals
    const subtotal = getTotal()
    const isFreeDelivery = settings?.free_delivery_above && subtotal >= settings.free_delivery_above
    const deliveryFee = orderType === 'delivery' ? (isFreeDelivery ? 0 : (settings?.delivery_fee || 0)) : 0
    const taxRate = settings?.gst_percentage || 0
    const taxAmount = taxRate > 0 ? (subtotal * taxRate) / 100 : 0
    const total = subtotal + deliveryFee + taxAmount

    const handleAddressSelected = (address: Address) => {
        setSelectedAddress(address)
    }

    const createOrderData = useCallback(() => ({
        restaurantId: restaurant.id,
        userId: userId,
        customerName: selectedAddress?.person_name || 'Customer',
        customerPhone: selectedAddress?.mobile || '',
        customerAddress: orderType === 'delivery' && selectedAddress
            ? `${selectedAddress.flat_building}, ${selectedAddress.locality}${selectedAddress.city ? `, ${selectedAddress.city}` : ''}`
            : null,
        customerLatitude: selectedAddress?.latitude,
        customerLongitude: selectedAddress?.longitude,
        items: items.map(item => ({
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
        })),
        itemsTotal: subtotal,
        deliveryFee,
        taxAmount,
        totalAmount: total,
        paymentMethod,
        notes: notes || null,
    }), [restaurant.id, selectedAddress, orderType, items, subtotal, deliveryFee, taxAmount, total, paymentMethod, notes])

    const handleRazorpayPayment = async () => {
        if (!settings?.razorpay_key_id) {
            toast.error('Online payment not configured')
            return
        }

        setIsProcessingPayment(true)

        try {
            const response = await fetch('/api/razorpay/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurantId: restaurant.id,
                    amount: total,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create payment order')
            }

            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: restaurant.name,
                description: `Order from ${restaurant.name}`,
                order_id: data.orderId,
                handler: async function (response: any) {
                    const verifyResponse = await fetch('/api/razorpay/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            restaurantId: restaurant.id,
                        }),
                    })

                    const verifyData = await verifyResponse.json()

                    if (verifyData.verified) {
                        startTransition(async () => {
                            const orderData = createOrderData()
                            const result = await createOrder({ ...orderData, paymentMethod: 'online' })

                            if (result.error) {
                                toast.error(result.error)
                            } else {
                                toast.success('Payment successful! Order placed.')
                                clearCart()
                                router.push(`/orders/${result.data.id}`)
                            }
                        })
                    } else {
                        toast.error('Payment verification failed')
                    }
                },
                prefill: {
                    name: selectedAddress?.person_name || '',
                    contact: selectedAddress?.mobile || '',
                },
                theme: { color: '#000000' },
            }

            const razorpay = new window.Razorpay(options)
            razorpay.open()
        } catch (error: any) {
            toast.error(error.message || 'Payment failed')
        } finally {
            setIsProcessingPayment(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (orderType === 'delivery' && !selectedAddress) {
            toast.error('Please select a delivery address')
            return
        }

        if (paymentMethod === 'online') {
            await handleRazorpayPayment()
            return
        }

        startTransition(async () => {
            const orderData = createOrderData()
            const result = await createOrder(orderData)

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Order placed successfully!')
                clearCart()
                router.push(`/orders/${result.data.id}`)
            }
        })
    }

    const isLoading = isPending || isProcessingPayment

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 px-4">
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="h-10 w-10 text-muted-foreground" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
                <p className="text-muted-foreground mb-8 text-center">
                    Add delicious items from the menu to get started
                </p>
                <Link href={`/r/${restaurant.slug}`}>
                    <Button size="lg" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Browse Menu
                    </Button>
                </Link>
            </div>
        )
    }

    const restaurantAddress = [
        restaurant.address_line1,
        restaurant.address_line2,
        restaurant.city,
        restaurant.state
    ].filter(Boolean).join(', ')

    return (
        <>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

            {/* Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-20 border-b mb-6">
                <div className="flex items-center gap-4 py-4">
                    <Link href={`/r/${restaurant.slug}`}>
                        <Button variant="ghost" size="icon" className="shrink-0">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3 min-w-0">
                        {restaurant.logo_url && (
                            <Image
                                src={restaurant.logo_url}
                                alt={restaurant.name}
                                width={40}
                                height={40}
                                className="rounded-full object-cover shrink-0"
                            />
                        )}
                        <div className="min-w-0">
                            <h1 className="font-bold text-lg truncate">{restaurant.name}</h1>
                            <p className="text-sm text-muted-foreground">Checkout</p>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 pb-32 lg:pb-8">
                {/* Order Type */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setOrderType('delivery')}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${orderType === 'delivery'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                            }`}
                    >
                        <Truck className={`h-6 w-6 ${orderType === 'delivery' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="font-medium">Delivery</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setOrderType('pickup')}
                        className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${orderType === 'pickup'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                            }`}
                    >
                        <Store className={`h-6 w-6 ${orderType === 'pickup' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="font-medium">Pickup</span>
                    </button>
                </div>

                {/* Delivery Address */}
                {orderType === 'delivery' && (
                    <div
                        onClick={() => setShowAddressModal(true)}
                        className="p-4 rounded-xl border-2 border-dashed cursor-pointer hover:border-primary hover:bg-accent/50 transition-all"
                    >
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <MapPin className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                {selectedAddress ? (
                                    <>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold capitalize">{selectedAddress.address_type}</span>
                                            {selectedAddress.is_default && (
                                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Default</span>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium">{selectedAddress.person_name}</p>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {selectedAddress.flat_building}, {selectedAddress.locality}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="font-semibold">Select Delivery Address</p>
                                        <p className="text-sm text-muted-foreground">Tap to choose your address</p>
                                    </>
                                )}
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 self-center" />
                        </div>
                    </div>
                )}

                {/* Pickup Location */}
                {orderType === 'pickup' && (
                    <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                <Store className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold mb-1">Pickup from Restaurant</p>
                                <p className="text-sm text-muted-foreground">
                                    {restaurantAddress || restaurant.name}
                                </p>
                            </div>
                        </div>
                        {restaurant.latitude && restaurant.longitude && (
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm"
                            >
                                <Navigation className="h-4 w-4" />
                                Get Directions
                            </a>
                        )}
                    </div>
                )}

                {/* Cart Items */}
                <div className="rounded-xl border overflow-hidden">
                    <div className="px-4 py-3 bg-muted/50 border-b">
                        <h3 className="font-semibold flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4" />
                            Your Order ({items.length})
                        </h3>
                    </div>
                    <div className="divide-y">
                        {items.map((item) => (
                            <div key={item.id} className="p-4 flex gap-4">
                                {item.image_url && (
                                    <Image
                                        src={item.image_url}
                                        alt={item.name}
                                        width={60}
                                        height={60}
                                        className="rounded-lg object-cover shrink-0"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">₹{item.price} each</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id)}
                                    >
                                        {item.quantity === 1 ? <Trash2 className="h-3 w-3 text-destructive" /> : <Minus className="h-3 w-3" />}
                                    </Button>
                                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    >
                                        <Plus className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Special Instructions */}
                <div>
                    <label className="text-sm font-medium mb-2 block">Special Instructions</label>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any special requests? (optional)"
                        rows={2}
                        className="resize-none"
                    />
                </div>

                {/* Payment Method */}
                <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment Method
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {codEnabled && (
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('cod')}
                                className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                    <Banknote className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium">Cash</p>
                                    <p className="text-xs text-muted-foreground">Pay on delivery</p>
                                </div>
                            </button>
                        )}
                        {onlineEnabled && (
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('online')}
                                className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${paymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-border'
                                    }`}
                            >
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                    <CreditCard className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium">Online</p>
                                    <p className="text-xs text-muted-foreground">UPI, Cards</p>
                                </div>
                            </button>
                        )}
                    </div>
                </div>

                {/* Bill Summary */}
                <div className="rounded-xl border p-4 space-y-3">
                    <h3 className="font-semibold flex items-center gap-2 pb-3 border-b">
                        <Tag className="h-4 w-4" />
                        Bill Summary
                    </h3>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Item Total</span>
                        <span>₹{subtotal.toFixed(0)}</span>
                    </div>
                    {orderType === 'delivery' && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Delivery Fee</span>
                            {isFreeDelivery ? (
                                <span className="text-green-600 font-medium">FREE</span>
                            ) : (
                                <span>₹{deliveryFee.toFixed(0)}</span>
                            )}
                        </div>
                    )}
                    {taxAmount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">GST ({taxRate}%)</span>
                            <span>₹{taxAmount.toFixed(0)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-3 border-t">
                        <span>Total</span>
                        <span className="text-primary">₹{total.toFixed(0)}</span>
                    </div>
                    {settings?.free_delivery_above && !isFreeDelivery && orderType === 'delivery' && (
                        <p className="text-xs text-center bg-amber-50 text-amber-800 p-2 rounded-lg">
                            Add ₹{(settings.free_delivery_above - subtotal).toFixed(0)} more for free delivery
                        </p>
                    )}
                </div>

                {/* Submit Button - Fixed on mobile */}
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t lg:static lg:p-0 lg:border-0 lg:bg-transparent">
                    <Button
                        type="submit"
                        className="w-full h-12 text-base font-semibold"
                        size="lg"
                        disabled={isLoading || (orderType === 'delivery' && !selectedAddress)}
                    >
                        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        {isLoading
                            ? isProcessingPayment ? 'Processing...' : 'Placing Order...'
                            : `${paymentMethod === 'online' ? 'Pay' : 'Place Order'} · ₹${total.toFixed(0)}`
                        }
                    </Button>
                </div>
            </form>

            <AddressSelector
                open={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                userId={userId}
                onAddressSelected={handleAddressSelected}
            />
        </>
    )
}
