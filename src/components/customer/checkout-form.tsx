'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useCart } from '@/hooks/use-cart'
import { createOrder } from '@/app/r/[slug]/actions'
import { AddressSelector } from './address-selector'
import { toast } from 'sonner'
import {
    Loader2, MapPin, User, Phone, ChevronRight, CreditCard, Banknote,
    ShoppingBag, Truck, Store, ChevronLeft, Minus, Plus, Trash2,
    Shield, Clock, Tag, Navigation
} from 'lucide-react'
import { useLocation } from '@/hooks/use-location'
import Image from 'next/image'
import Link from 'next/link'

declare global {
    interface Window {
        Razorpay: any
    }
}

interface Address {
    id: string
    latitude: number
    longitude: number
    locality: string | null
    flat_building: string
    landmark: string | null
    city: string | null
    state: string | null
    pincode: string | null
    address_type: string
    is_default: boolean
    person_name: string
    mobile: string
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
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
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

    // Handle settings as either array or object (Supabase returns differently based on relation type)
    const settingsRaw = restaurant.restaurant_settings
    const settings = Array.isArray(settingsRaw) ? settingsRaw[0] : settingsRaw

    // Debug: Log to verify settings are loaded correctly
    console.log('CheckoutForm - settingsRaw:', settingsRaw)
    console.log('CheckoutForm - settings:', settings)
    console.log('CheckoutForm - delivery_fee:', settings?.delivery_fee, 'free_above:', settings?.free_delivery_above)

    const codEnabled = settings?.cod_enabled !== false
    const onlineEnabled = settings?.online_payment_enabled === true && !!settings?.razorpay_key_id

    // Auto-select address
    useEffect(() => {
        if (savedAddresses.length > 0 && !selectedAddress) {
            if (currentLocation?.latitude && currentLocation?.longitude) {
                const matchingAddress = savedAddresses.find(addr => {
                    const distance = calculateDistance(
                        currentLocation.latitude,
                        currentLocation.longitude,
                        addr.latitude,
                        addr.longitude
                    )
                    return distance < 0.2
                })
                if (matchingAddress) {
                    setSelectedAddress(matchingAddress)
                    return
                }
            }
            const defaultAddress = savedAddresses.find(a => a.is_default) || savedAddresses[0]
            setSelectedAddress(defaultAddress)
        }
    }, [savedAddresses, currentLocation])

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
    const deliveryFee = orderType === 'delivery'
        ? (isFreeDelivery ? 0 : (settings?.delivery_fee || 0))
        : 0
    const taxRate = settings?.gst_percentage || 0
    const taxAmount = taxRate > 0 ? (subtotal * taxRate) / 100 : 0
    const total = subtotal + deliveryFee + taxAmount

    // Debug: Log settings to check if delivery_fee is being passed
    console.log('Checkout settings:', {
        settings,
        deliveryFee,
        subtotal,
        isFreeDelivery,
        free_delivery_above: settings?.free_delivery_above
    })

    const handleAddressSelected = (address: Address) => {
        setSelectedAddress(address)
    }

    const createOrderData = useCallback(() => ({
        restaurantId: restaurant.id,
        customerName: selectedAddress?.person_name || 'Customer',
        customerPhone: selectedAddress?.mobile || '',
        customerAddress: orderType === 'delivery' && selectedAddress
            ? `${selectedAddress.flat_building}, ${selectedAddress.locality || ''}, ${selectedAddress.city || ''}`
            : null,
        customerLatitude: selectedAddress?.latitude,
        customerLongitude: selectedAddress?.longitude,
        itemsTotal: subtotal,
        deliveryFee,
        taxAmount,
        totalAmount: total,
        paymentMethod: paymentMethod,
        notes: notes || null,
        items: items.map(item => ({
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
        })),
    }), [restaurant.id, selectedAddress, orderType, subtotal, deliveryFee, taxAmount, total, paymentMethod, notes, items])

    const handleRazorpayPayment = async () => {
        if (!selectedAddress && orderType === 'delivery') {
            toast.error('Please select a delivery address')
            return
        }

        setIsProcessingPayment(true)

        try {
            // Create Razorpay order
            const orderRes = await fetch('/api/razorpay/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    restaurantId: restaurant.id,
                    amount: total,
                }),
            })

            const orderData = await orderRes.json()

            if (!orderRes.ok) {
                throw new Error(orderData.error || 'Failed to create payment order')
            }

            // Open Razorpay checkout
            const options = {
                key: orderData.keyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: restaurant.name,
                description: `Order from ${restaurant.name}`,
                order_id: orderData.orderId,
                handler: async (response: any) => {
                    // Verify payment
                    const verifyRes = await fetch('/api/razorpay/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            restaurantId: restaurant.id,
                        }),
                    })

                    const verifyData = await verifyRes.json()

                    if (verifyData.verified) {
                        // Create order after successful payment
                        const result = await createOrder({
                            ...createOrderData(),
                            paymentMethod: 'online',
                        })

                        if (result.error) {
                            toast.error(result.error)
                        } else {
                            toast.success('Payment successful! Order placed.')
                            clearCart()
                            router.push(`/orders/${result.data.id}`)
                        }
                    } else {
                        toast.error('Payment verification failed')
                    }
                    setIsProcessingPayment(false)
                },
                prefill: {
                    name: selectedAddress?.person_name || '',
                    contact: selectedAddress?.mobile || '',
                },
                theme: {
                    color: '#16a34a',
                },
                modal: {
                    ondismiss: () => {
                        setIsProcessingPayment(false)
                    }
                }
            }

            const razorpay = new window.Razorpay(options)
            razorpay.open()
        } catch (error: any) {
            console.error('Payment error:', error)
            toast.error(error.message || 'Payment failed')
            setIsProcessingPayment(false)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (orderType === 'delivery' && !selectedAddress) {
            toast.error('Please select a delivery address')
            return
        }

        if (items.length === 0) {
            toast.error('Your cart is empty')
            return
        }

        if (settings?.min_order_amount && subtotal < settings.min_order_amount) {
            toast.error(`Minimum order amount is ₹${settings.min_order_amount}`)
            return
        }

        if (paymentMethod === 'online') {
            handleRazorpayPayment()
            return
        }

        // COD order
        startTransition(async () => {
            const result = await createOrder(createOrderData())

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
            <div className="flex flex-col items-center justify-center py-16 px-4">
                <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
                <p className="text-muted-foreground mb-6">Add items to start your order</p>
                <Link href={`/r/${restaurant.slug}`}>
                    <Button>
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Browse Menu
                    </Button>
                </Link>
            </div>
        )
    }

    return (
        <>
            <Script
                src="https://checkout.razorpay.com/v1/checkout.js"
                strategy="lazyOnload"
            />

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Header */}
                <div className="flex items-center gap-3 pb-4 border-b">
                    <Link href={`/r/${restaurant.slug}`}>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3 flex-1">
                        {restaurant.logo_url && (
                            <Image
                                src={restaurant.logo_url}
                                alt={restaurant.name}
                                width={40}
                                height={40}
                                className="rounded-full object-cover"
                            />
                        )}
                        <div>
                            <h1 className="font-semibold text-lg">{restaurant.name}</h1>
                            <p className="text-sm text-muted-foreground">Checkout</p>
                        </div>
                    </div>
                </div>

                {/* Order Type */}
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setOrderType('delivery')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${orderType === 'delivery'
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-muted hover:border-muted-foreground/30'
                            }`}
                    >
                        <Truck className={`h-6 w-6 ${orderType === 'delivery' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="font-medium text-sm">Delivery</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setOrderType('pickup')}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${orderType === 'pickup'
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-muted hover:border-muted-foreground/30'
                            }`}
                    >
                        <Store className={`h-6 w-6 ${orderType === 'pickup' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <span className="font-medium text-sm">Pickup</span>
                    </button>
                </div>

                {/* Delivery Address */}
                {orderType === 'delivery' && (
                    <button
                        type="button"
                        className="w-full flex items-start gap-3 p-4 rounded-xl border-2 border-dashed hover:border-primary hover:bg-accent/50 transition-all text-left"
                        onClick={() => setShowAddressModal(true)}
                    >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        {selectedAddress ? (
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="font-semibold capitalize text-sm">{selectedAddress.address_type}</span>
                                    {selectedAddress.is_default && (
                                        <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">Default</span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground flex items-center gap-2 mb-0.5">
                                    <User className="h-3 w-3" />{selectedAddress.person_name}
                                    <Phone className="h-3 w-3 ml-1" />{selectedAddress.mobile}
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                    {selectedAddress.flat_building}{selectedAddress.locality && `, ${selectedAddress.locality}`}
                                </p>
                            </div>
                        ) : (
                            <div className="flex-1">
                                <p className="font-medium text-sm">Select Delivery Address</p>
                                <p className="text-xs text-muted-foreground">Tap to choose address</p>
                            </div>
                        )}
                        <ChevronRight className="h-5 w-5 text-muted-foreground self-center flex-shrink-0" />
                    </button>
                )}

                {/* Pickup Location */}
                {orderType === 'pickup' && (
                    <div className="p-4 rounded-xl border-2 border-primary/20 bg-primary/5">
                        <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Store className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm mb-1">Pickup from Restaurant</p>
                                <p className="text-xs text-muted-foreground">
                                    {[
                                        restaurant.address_line1,
                                        restaurant.address_line2,
                                        restaurant.city,
                                        restaurant.state,
                                        restaurant.pincode
                                    ].filter(Boolean).join(', ') || restaurant.name}
                                </p>
                            </div>
                        </div>
                        {restaurant.latitude && restaurant.longitude && (
                            <a
                                href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-3 flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors"
                            >
                                <Navigation className="h-4 w-4" />
                                Get Directions
                            </a>
                        )}
                    </div>
                )}

                {/* Cart Items */}
                <div className="bg-card border rounded-xl overflow-hidden">
                    <div className="px-4 py-3 bg-muted/30 border-b">
                        <h3 className="font-semibold flex items-center gap-2">
                            <ShoppingBag className="h-4 w-4" />
                            Your Order ({items.length} {items.length === 1 ? 'item' : 'items'})
                        </h3>
                    </div>
                    <div className="divide-y">
                        {items.map(item => (
                            <div key={item.id} className="flex items-center gap-3 p-3">
                                {item.image_url && (
                                    <Image
                                        src={item.image_url}
                                        alt={item.name}
                                        width={56}
                                        height={56}
                                        className="rounded-lg object-cover"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-1">
                                        <span className={`w-3 h-3 rounded-sm border flex-shrink-0 mt-1 ${item.is_veg ? 'border-green-600' : 'border-red-600'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full m-0.5 block ${item.is_veg ? 'bg-green-600' : 'bg-red-600'}`} />
                                        </span>
                                        <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                                    </div>
                                    <p className="text-sm font-semibold mt-0.5">₹{(item.price * item.quantity).toFixed(0)}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={() => item.quantity === 1 ? removeItem(item.id) : updateQuantity(item.id, item.quantity - 1)}
                                    >
                                        {item.quantity === 1 ? <Trash2 className="h-3 w-3 text-red-500" /> : <Minus className="h-3 w-3" />}
                                    </Button>
                                    <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
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
                <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions? (optional)"
                    rows={2}
                    className="resize-none text-sm"
                />

                {/* Payment Method */}
                <div className="space-y-2">
                    <h3 className="font-semibold text-sm flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Payment
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                        {codEnabled && (
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('cod')}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'cod'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted hover:border-muted-foreground/30'
                                    }`}
                            >
                                <div className="h-9 w-9 rounded-full bg-green-100 flex items-center justify-center">
                                    <Banknote className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-sm">Cash</p>
                                    <p className="text-[10px] text-muted-foreground">Pay on delivery</p>
                                </div>
                            </button>
                        )}
                        {onlineEnabled && (
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('online')}
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${paymentMethod === 'online'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted hover:border-muted-foreground/30'
                                    }`}
                            >
                                <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                                    <CreditCard className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium text-sm">Online</p>
                                    <p className="text-[10px] text-muted-foreground">UPI, Cards</p>
                                </div>
                            </button>
                        )}
                    </div>
                </div>

                {/* Bill Details */}
                <div className="bg-card border rounded-xl p-4 space-y-2">
                    <h3 className="font-semibold text-sm flex items-center gap-2 pb-2 border-b">
                        <Tag className="h-4 w-4" />
                        Bill Details
                    </h3>
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Item Total</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {orderType === 'delivery' && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Delivery Fee</span>
                            {isFreeDelivery ? (
                                <span className="text-green-600 font-medium">FREE</span>
                            ) : (
                                <span>₹{deliveryFee.toFixed(2)}</span>
                            )}
                        </div>
                    )}
                    {taxAmount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">GST ({taxRate}%)</span>
                            <span>₹{taxAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold pt-2 border-t text-base">
                        <span>To Pay</span>
                        <span className="text-primary">₹{total.toFixed(2)}</span>
                    </div>
                    {settings?.free_delivery_above && !isFreeDelivery && orderType === 'delivery' && (
                        <p className="text-xs text-center text-muted-foreground pt-2">
                            Add ₹{(settings.free_delivery_above - subtotal).toFixed(0)} more for free delivery
                        </p>
                    )}
                </div>

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground py-2">
                    <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" /> Secure Payment
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Quick Delivery
                    </span>
                </div>

                {/* Submit Button */}
                <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold rounded-xl"
                    size="lg"
                    disabled={isLoading || (orderType === 'delivery' && !selectedAddress)}
                >
                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {isLoading
                        ? (isProcessingPayment ? 'Processing Payment...' : 'Placing Order...')
                        : `${paymentMethod === 'online' ? 'Pay' : 'Place Order'} · ₹${total.toFixed(0)}`
                    }
                </Button>
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
