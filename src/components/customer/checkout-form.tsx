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
    Shield, Clock, Tag, Navigation, ArrowLeft, Briefcase, House
} from 'lucide-react'
import { useLocation } from '@/hooks/use-location'
import Image from 'next/image'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

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
    is_online?: boolean | null
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
    suggestedItems?: Array<{
        id: string
        name: string
        price: number
        compare_at_price?: number | null
        image_url?: string | null
        is_veg?: boolean
    }>
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

export function CheckoutForm({ restaurant, userId, savedAddresses, suggestedItems = [] }: CheckoutFormProps) {
    const router = useRouter()
    const { items, getTotal, clearCart, updateQuantity, removeItem, addItem } = useCart()
    const [isPending, startTransition] = useTransition()
    const [showAddressModal, setShowAddressModal] = useState(false)
    const [isProcessingPayment, setIsProcessingPayment] = useState(false)
    const { currentLocation } = useLocation()

    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
    const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery')
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod')
    const [notes, setNotes] = useState('')
    const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false)

    // Handle settings
    const settingsRaw = restaurant.restaurant_settings
    const settings = Array.isArray(settingsRaw) ? settingsRaw[0] : settingsRaw

    const codEnabled = settings?.cod_enabled !== false
    const onlineEnabled = settings?.online_payment_enabled === true && !!settings?.razorpay_key_id
    const isRestaurantOffline = restaurant.is_online === false

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
    const compareSubtotal = items.reduce((sum, item) => {
        const compare = item.compare_at_price && item.compare_at_price > item.price ? item.compare_at_price : item.price
        return sum + compare * item.quantity
    }, 0)
    const itemLevelSavings = Math.max(0, compareSubtotal - subtotal)
    const isFreeDelivery = settings?.free_delivery_above && subtotal >= settings.free_delivery_above
    const deliveryFee = orderType === 'delivery' ? (isFreeDelivery ? 0 : (settings?.delivery_fee || 0)) : 0
    const taxRate = settings?.gst_percentage || 0
    const taxAmount = taxRate > 0 ? (subtotal * taxRate) / 100 : 0
    const total = subtotal + deliveryFee + taxAmount
    const originalBillTotal = compareSubtotal + deliveryFee + taxAmount
    const totalSavedOverall = Math.max(0, originalBillTotal - total)
    const availableSuggestions = suggestedItems.filter((s) => !items.some((i) => i.id === s.id)).slice(0, 8)
    const freeDeliveryThreshold = settings?.free_delivery_above || 0
    const amountToUnlockFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal)

    const handleAddressSelected = (address: Address) => {
        setSelectedAddress(address)
    }

    const toggleCutleryNote = () => {
        const cutleryNote = 'Please send cutlery.'
        setNotes((prev) => {
            const hasNote = prev.includes(cutleryNote)
            if (hasNote) {
                return prev
                    .replace(cutleryNote, '')
                    .replace(/\n{3,}/g, '\n\n')
                    .trim()
            }
            return prev.trim().length ? `${prev.trim()}\n${cutleryNote}` : cutleryNote
        })
    }

    const getAddressTypeIcon = (type?: string | null) => {
        if (type === 'home') return House
        if (type === 'work') return Briefcase
        return MapPin
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
        if (isRestaurantOffline) {
            toast.error('Restaurant is not accepting orders currently')
            return
        }

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
                theme: { color: '#6fdc4a' },
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

        if (isRestaurantOffline) {
            toast.error('Restaurant is not accepting orders currently')
            return
        }

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
            <div className="sticky top-0 z-20 -mx-4 mb-3 border-b border-border/70 bg-background/95 px-4 backdrop-blur">
                <div className="flex items-center gap-3 py-4">
                    <Link href={`/r/${restaurant.slug}`}>
                        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-full text-foreground hover:bg-muted">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="min-w-0 flex items-center gap-3">
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
                            <h1 className="truncate text-lg font-bold text-foreground">{restaurant.name}</h1>
                            <p className="text-xs text-muted-foreground">
                                {orderType === 'delivery' ? 'Delivery in 30-35 mins' : 'Pickup order'}
                                {orderType === 'delivery' && selectedAddress?.address_type ? ` • ${selectedAddress.address_type}` : ''}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 pb-32 lg:pb-8">
                {isRestaurantOffline && (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                        Restaurant is not accepting orders currently.
                    </div>
                )}

                {/* Order Type */}
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/70 bg-card/70 p-1">
                    <button
                        type="button"
                        onClick={() => setOrderType('delivery')}
                        className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${orderType === 'delivery'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Truck className="h-4 w-4" />
                        Delivery
                    </button>
                    <button
                        type="button"
                        onClick={() => setOrderType('pickup')}
                        className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition ${orderType === 'pickup'
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        <Store className="h-4 w-4" />
                        Pickup
                    </button>
                </div>

                {/* Cart Items */}
                <div className="overflow-hidden rounded-xl border border-border/70 bg-card/70 shadow-sm">
                    <div className="px-4 py-4">
                        <h3 className="font-semibold text-foreground">Your items ({items.length})</h3>
                    </div>
                    <div className="divide-y divide-border/70">
                        {items.map((item) => (
                            <div key={item.id} className="p-4">
                                <div className="flex items-start gap-3">
                                    <div className="mt-1 h-4 w-4 rounded-sm border-2 border-emerald-500 p-[2px]">
                                        <div className="h-full w-full rounded-[2px] bg-emerald-500" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="line-clamp-1 text-[15px] font-medium text-foreground">{item.name}</p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">₹{item.price} each</p>
                                        <button
                                            type="button"
                                            className="mt-1 text-xs font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
                                            onClick={() => removeItem(item.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    <div className="text-right">
                                        <div className="inline-flex items-center overflow-hidden rounded-lg border border-border bg-muted/50">
                                            <button
                                                type="button"
                                                className="h-8 w-8 text-foreground/90 transition-colors hover:bg-muted hover:text-primary"
                                                onClick={() => item.quantity > 1 ? updateQuantity(item.id, item.quantity - 1) : removeItem(item.id)}
                                            >
                                                {item.quantity === 1 ? <Trash2 className="mx-auto h-3.5 w-3.5" /> : <Minus className="mx-auto h-3.5 w-3.5" />}
                                            </button>
                                            <span className="w-8 text-center text-base font-semibold text-foreground">{item.quantity}</span>
                                            <button
                                                type="button"
                                                className="h-8 w-8 text-foreground/90 transition-colors hover:bg-muted hover:text-primary"
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            >
                                                <Plus className="mx-auto h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                        <p className="mt-1.5 text-lg font-semibold text-foreground">₹{(item.price * item.quantity).toFixed(0)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-border/70 px-4 py-3">
                        <Link href={`/r/${restaurant.slug}/menu`} className="text-sm font-semibold text-primary underline-offset-4 hover:underline">
                            + Add more items
                        </Link>
                    </div>
                    <div className="flex flex-wrap gap-2 border-t border-border/70 p-3">
                        <button
                            type="button"
                            className={`rounded-full border px-3 py-2 text-left text-sm transition ${
                                notes.trim().length
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border text-foreground/80 hover:bg-muted'
                            }`}
                            onClick={() => setIsNotesDialogOpen(true)}
                        >
                            {notes.trim().length ? 'Edit note' : 'Add note'}
                        </button>
                        <button
                            type="button"
                            className={`rounded-full border px-3 py-2 text-left text-sm transition ${
                                notes.includes('Please send cutlery.')
                                    ? 'border-primary bg-primary text-primary-foreground'
                                    : 'border-border text-foreground/80 hover:bg-muted'
                            }`}
                            onClick={toggleCutleryNote}
                        >
                            Send cutlery
                        </button>
                    </div>
                    {notes.trim().length > 0 && (
                        <div className="border-t border-border/70 bg-muted/40 px-3 py-2 text-sm text-foreground/80">
                            {notes}
                        </div>
                    )}
                </div>

                {availableSuggestions.length > 0 && (
                    <div className="rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm">
                        <div className="mb-3 flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">✣</span>
                            <h3 className="font-semibold text-foreground">Complete your meal with</h3>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-1">
                            {availableSuggestions.map((item) => (
                                <div key={item.id} className="w-36 shrink-0">
                                    <div className="relative mb-2 h-24 w-full overflow-hidden rounded-lg bg-muted">
                                        {item.image_url ? (
                                            <Image src={item.image_url} alt={item.name} fill className="object-cover" />
                                        ) : null}
                                        <button
                                            type="button"
                                            className="absolute bottom-1 right-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm hover:bg-primary hover:text-primary-foreground"
                                            onClick={() =>
                                                addItem({
                                                    id: item.id,
                                                    name: item.name,
                                                    price: item.price,
                                                    compare_at_price: item.compare_at_price,
                                                    image_url: item.image_url,
                                                    is_veg: item.is_veg ?? true,
                                                })
                                            }
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <p className="line-clamp-2 text-sm font-medium text-foreground">{item.name}</p>
                                    <div className="mt-1 flex items-center gap-1.5">
                                        <p className="text-sm font-semibold text-primary">₹{item.price}</p>
                                        {item.compare_at_price && item.compare_at_price > item.price ? (
                                            <p className="text-xs text-muted-foreground line-through">₹{item.compare_at_price}</p>
                                        ) : null}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="overflow-hidden rounded-xl border border-border/70 bg-card/70 shadow-sm">
                    <div className="flex items-center justify-between bg-primary/15 px-4 py-3">
                        <p className="font-semibold text-primary">
                            {freeDeliveryThreshold > 0
                                ? isFreeDelivery
                                    ? 'Free delivery unlocked'
                                    : `Add ₹${amountToUnlockFreeDelivery.toFixed(0)} to unlock free delivery`
                                : 'Order summary savings'}
                        </p>
                        <span className="text-xl">{isFreeDelivery ? '🎉' : '🚚'}</span>
                    </div>
                    <div className="space-y-2 px-4 py-3">
                        {freeDeliveryThreshold > 0 ? (
                            <>
                                <p className="text-sm text-muted-foreground">
                                    {isFreeDelivery
                                        ? `Congrats! Free delivery unlocked at ₹${freeDeliveryThreshold.toFixed(0)}.`
                                        : `Current cart: ₹${subtotal.toFixed(0)} / ₹${freeDeliveryThreshold.toFixed(0)} for free delivery.`}
                                </p>
                                {!isFreeDelivery ? (
                                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-primary transition-all"
                                            style={{ width: `${Math.min(100, (subtotal / freeDeliveryThreshold) * 100)}%` }}
                                        />
                                    </div>
                                ) : null}
                            </>
                        ) : null}
                        {totalSavedOverall > 0 ? (
                            <p className="text-sm font-medium text-primary">
                                Total savings so far: ₹{totalSavedOverall.toFixed(0)}
                            </p>
                        ) : (
                            <p className="text-sm text-muted-foreground">No discount unlocked yet.</p>
                        )}
                    </div>
                </div>

                {/* Payment Method */}
                <div className="rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm">
                    <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
                        <CreditCard className="h-4 w-4" />
                        Payment Method
                    </h3>
                    <div className="divide-y divide-border/70 rounded-lg bg-muted/20 px-2">
                        {codEnabled && (
                            <button
                                type="button"
                                onClick={() => setPaymentMethod('cod')}
                                className={`flex w-full items-center gap-3 px-2 py-3 text-left transition ${paymentMethod === 'cod'
                                    ? 'text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full border-2 ${paymentMethod === 'cod' ? 'border-primary' : 'border-muted-foreground/40'}`}>
                                    {paymentMethod === 'cod' ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                                </span>
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
                                    <Banknote className="h-5 w-5 text-primary" />
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
                                className={`flex w-full items-center gap-3 px-2 py-3 text-left transition ${paymentMethod === 'online'
                                    ? 'text-foreground'
                                    : 'text-muted-foreground hover:text-foreground'
                                    }`}
                            >
                                <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full border-2 ${paymentMethod === 'online' ? 'border-primary' : 'border-muted-foreground/40'}`}>
                                    {paymentMethod === 'online' ? <span className="h-2 w-2 rounded-full bg-primary" /> : null}
                                </span>
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15">
                                    <CreditCard className="h-5 w-5 text-primary" />
                                </div>
                                <div className="text-left">
                                    <p className="font-medium">Online</p>
                                    <p className="text-xs text-muted-foreground">UPI, Cards</p>
                                </div>
                            </button>
                        )}
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-border/70 bg-card/70 shadow-sm">
                    {orderType === 'delivery' ? (
                        <>
                            <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                <p className="font-medium text-foreground">Delivery in 30-35 mins</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowAddressModal(true)}
                                className="flex w-full items-start gap-3 border-b border-border/70 px-4 py-3 text-left hover:bg-muted/40"
                            >
                                {(() => {
                                    const Icon = getAddressTypeIcon(selectedAddress?.address_type)
                                    return <Icon className="mt-0.5 h-5 w-5 text-muted-foreground" />
                                })()}
                                <div className="min-w-0">
                                    <p className="font-medium text-foreground">Delivery at {selectedAddress?.address_type || 'saved address'}</p>
                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                        {selectedAddress
                                            ? `${selectedAddress.flat_building}, ${selectedAddress.locality}${selectedAddress.city ? `, ${selectedAddress.city}` : ''}`
                                            : 'Select address'}
                                    </p>
                                </div>
                                <ChevronRight className="ml-auto mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                            </button>
                            <div className="flex items-center gap-3 px-4 py-3">
                                <Phone className="h-5 w-5 text-muted-foreground" />
                                <p className="font-medium text-foreground">{selectedAddress?.person_name || 'Customer'}{selectedAddress?.mobile ? `, ${selectedAddress.mobile}` : ''}</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3">
                                <Store className="h-5 w-5 text-muted-foreground" />
                                <p className="font-medium text-foreground">Pickup from restaurant</p>
                            </div>
                            <div className="border-b border-border/70 px-4 py-3">
                                <p className="font-medium text-foreground">{restaurant.name}</p>
                                <p className="mt-0.5 text-sm text-muted-foreground">{restaurantAddress || 'Address not available'}</p>
                                {restaurant.latitude && restaurant.longitude ? (
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${restaurant.latitude},${restaurant.longitude}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary underline underline-offset-2"
                                    >
                                        <Navigation className="h-4 w-4" />
                                        Get directions
                                    </a>
                                ) : null}
                            </div>
                            <div className="flex items-center gap-3 px-4 py-3">
                                <Phone className="h-5 w-5 text-muted-foreground" />
                                <p className="font-medium text-foreground">{selectedAddress?.person_name || 'Customer'}{selectedAddress?.mobile ? `, ${selectedAddress.mobile}` : ''}</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Bill Summary */}
                <div className="space-y-3 rounded-xl border border-border/70 bg-card/70 p-4 shadow-sm">
                    <h3 className="flex items-center gap-2 border-b border-border/70 pb-3 font-semibold text-foreground">
                        <Tag className="h-4 w-4" />
                        Bill Summary
                    </h3>
                    <div className="flex justify-between text-sm text-foreground">
                        <span className="text-muted-foreground">Item Total</span>
                        <span>₹{subtotal.toFixed(0)}</span>
                    </div>
                    {orderType === 'delivery' && (
                        <div className="flex justify-between text-sm text-foreground">
                            <span className="text-muted-foreground">Delivery Fee</span>
                            {isFreeDelivery ? (
                                <span className="font-medium text-primary">FREE</span>
                            ) : (
                                <span>₹{deliveryFee.toFixed(0)}</span>
                            )}
                        </div>
                    )}
                    {taxAmount > 0 && (
                        <div className="flex justify-between text-sm text-foreground">
                            <span className="text-muted-foreground">GST ({taxRate}%)</span>
                            <span>₹{taxAmount.toFixed(0)}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between border-t border-border/70 pt-3">
                        <div className="flex items-center gap-2 text-lg font-bold text-foreground">
                            <span>Total Bill</span>
                            {totalSavedOverall > 0 ? (
                                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
                                    You saved ₹{totalSavedOverall.toFixed(0)}
                                </span>
                            ) : null}
                        </div>
                        <div className="text-right">
                            {totalSavedOverall > 0 ? (
                                <p className="text-sm text-muted-foreground line-through">₹{originalBillTotal.toFixed(0)}</p>
                            ) : null}
                            <p className="text-lg font-bold text-primary">₹{total.toFixed(0)}</p>
                        </div>
                    </div>
                    {settings?.free_delivery_above && !isFreeDelivery && orderType === 'delivery' && (
                        <p className="rounded-lg bg-primary/10 p-2 text-center text-xs text-primary">
                            Add ₹{(settings.free_delivery_above - subtotal).toFixed(0)} more for free delivery
                        </p>
                    )}
                </div>

                {/* Submit Button - Fixed on mobile */}
                <div className="fixed bottom-0 left-0 right-0 border-t border-border/70 bg-background/95 p-4 backdrop-blur lg:static lg:border-0 lg:bg-transparent lg:p-0">
                    <Button
                        type="submit"
                        className="h-12 w-full bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
                        size="lg"
                        disabled={isRestaurantOffline || isLoading || (orderType === 'delivery' && !selectedAddress)}
                    >
                        {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                        {isLoading
                            ? isProcessingPayment ? 'Processing...' : 'Placing Order...'
                            : isRestaurantOffline
                                ? 'Restaurant Offline'
                                : `${paymentMethod === 'online' ? 'Pay' : 'Place Order'} · ₹${total.toFixed(0)}`
                        }
                    </Button>
                    {isRestaurantOffline && (
                        <p className="mt-2 text-center text-xs text-amber-200">
                            Orders are temporarily disabled for both COD and online payment.
                        </p>
                    )}
                </div>
            </form>

            <AddressSelector
                open={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                userId={userId}
                onAddressSelected={handleAddressSelected}
            />

            <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add order note</DialogTitle>
                    </DialogHeader>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Example: less spicy, call on arrival, leave at door..."
                        rows={5}
                        className="resize-none"
                    />
                    <div className="flex justify-end">
                        <Button type="button" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setIsNotesDialogOpen(false)}>
                            Save note
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
