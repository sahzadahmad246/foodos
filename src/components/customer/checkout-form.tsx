'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { useCart } from '@/hooks/use-cart'
import { createOrder } from '@/app/r/[slug]/actions'
import { AddressSelector } from './address-selector'
import { toast } from 'sonner'
import { Loader2, MapPin, User, Phone, ChevronRight, CreditCard, Banknote, ShoppingBag, Truck, Store } from 'lucide-react'
import { useLocation } from '@/hooks/use-location'

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

interface Restaurant {
    id: string
    name: string
    slug: string
    latitude?: number | null
    longitude?: number | null
    restaurant_settings: Array<{
        gst_percentage: number | null
        delivery_fee: number | null
        free_delivery_above: number | null
        min_order_amount: number | null
        cod_enabled: boolean
        online_payment_enabled: boolean
    }>
}

interface CheckoutFormProps {
    restaurant: Restaurant
    userId?: string
    savedAddresses: Address[]
}

// Calculate distance between two coordinates (in km)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in km
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
    const { items, getTotal, clearCart } = useCart()
    const [isPending, startTransition] = useTransition()
    const [showAddressModal, setShowAddressModal] = useState(false)
    const { currentLocation } = useLocation()

    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
    const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery')
    const [paymentMethod, setPaymentMethod] = useState<'cod' | 'online'>('cod')
    const [notes, setNotes] = useState('')

    const settings = restaurant.restaurant_settings?.[0]

    // Default to COD if not explicitly set
    const codEnabled = settings?.cod_enabled !== false
    const onlineEnabled = settings?.online_payment_enabled === true

    // Auto-select best matching address on load
    useEffect(() => {
        if (savedAddresses.length > 0 && !selectedAddress) {
            // Try to find address matching current location (within 200m)
            if (currentLocation?.latitude && currentLocation?.longitude) {
                const matchingAddress = savedAddresses.find(addr => {
                    const distance = calculateDistance(
                        currentLocation.latitude,
                        currentLocation.longitude,
                        addr.latitude,
                        addr.longitude
                    )
                    return distance < 0.2 // 200 meters
                })
                if (matchingAddress) {
                    setSelectedAddress(matchingAddress)
                    return
                }
            }

            // Fall back to default address or first address
            const defaultAddress = savedAddresses.find(a => a.is_default) || savedAddresses[0]
            setSelectedAddress(defaultAddress)
        }
    }, [savedAddresses, currentLocation])

    // Set default payment method based on settings
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

    const handleAddressSelected = (address: Address) => {
        setSelectedAddress(address)
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

        startTransition(async () => {
            const orderData = {
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
            }

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

    const formatAddress = (address: Address) => {
        const parts = [address.flat_building]
        if (address.locality) parts.push(address.locality)
        if (address.city) parts.push(address.city)
        return parts.join(', ')
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-5">
                {/* Cart Summary Header */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold text-lg">{restaurant.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {items.length} {items.length === 1 ? 'item' : 'items'} · ₹{subtotal.toFixed(0)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Order Type */}
                <div className="bg-card border rounded-xl p-5 space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Truck className="h-5 w-5 text-primary" />
                        Order Type
                    </h2>
                    <RadioGroup
                        value={orderType}
                        onValueChange={(value) => setOrderType(value as 'delivery' | 'pickup')}
                        className="grid grid-cols-2 gap-3"
                    >
                        <Label
                            htmlFor="delivery"
                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${orderType === 'delivery'
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-muted hover:border-muted-foreground/30'
                                }`}
                        >
                            <RadioGroupItem value="delivery" id="delivery" className="sr-only" />
                            <Truck className={`h-6 w-6 ${orderType === 'delivery' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="font-medium">Delivery</span>
                        </Label>
                        <Label
                            htmlFor="pickup"
                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${orderType === 'pickup'
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-muted hover:border-muted-foreground/30'
                                }`}
                        >
                            <RadioGroupItem value="pickup" id="pickup" className="sr-only" />
                            <Store className={`h-6 w-6 ${orderType === 'pickup' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <span className="font-medium">Pickup</span>
                        </Label>
                    </RadioGroup>
                </div>

                {/* Delivery Details */}
                {orderType === 'delivery' && (
                    <div className="bg-card border rounded-xl p-5 space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-primary" />
                            Delivery Address
                        </h2>

                        <button
                            type="button"
                            className="w-full flex items-start gap-4 p-4 rounded-xl border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all text-left"
                            onClick={() => setShowAddressModal(true)}
                        >
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <MapPin className="h-6 w-6 text-primary" />
                            </div>
                            {selectedAddress ? (
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-semibold capitalize">{selectedAddress.address_type}</p>
                                        {selectedAddress.is_default && (
                                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Default</span>
                                        )}
                                    </div>
                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-1">
                                        <span className="flex items-center gap-1">
                                            <User className="h-3.5 w-3.5" />
                                            {selectedAddress.person_name}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Phone className="h-3.5 w-3.5" />
                                            {selectedAddress.mobile}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2">
                                        {formatAddress(selectedAddress)}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex-1">
                                    <p className="font-semibold">Select Delivery Address</p>
                                    <p className="text-sm text-muted-foreground">
                                        {savedAddresses.length > 0
                                            ? 'Choose from saved addresses or add new'
                                            : 'Add your delivery address'}
                                    </p>
                                </div>
                            )}
                            <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 self-center" />
                        </button>
                    </div>
                )}

                {/* Payment Method */}
                <div className="bg-card border rounded-xl p-5 space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        Payment Method
                    </h2>
                    <RadioGroup
                        value={paymentMethod}
                        onValueChange={(value) => setPaymentMethod(value as 'cod' | 'online')}
                        className="space-y-3"
                    >
                        {codEnabled && (
                            <Label
                                htmlFor="cod"
                                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'cod'
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-muted hover:border-muted-foreground/30'
                                    }`}
                            >
                                <RadioGroupItem value="cod" id="cod" className="sr-only" />
                                <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                    <Banknote className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-semibold">Cash on Delivery</p>
                                    <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                                </div>
                            </Label>
                        )}
                        {onlineEnabled && (
                            <Label
                                htmlFor="online"
                                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'online'
                                        ? 'border-primary bg-primary/5 shadow-sm'
                                        : 'border-muted hover:border-muted-foreground/30'
                                    }`}
                            >
                                <RadioGroupItem value="online" id="online" className="sr-only" />
                                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                    <CreditCard className="h-6 w-6 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-semibold">Pay Online</p>
                                    <p className="text-sm text-muted-foreground">Cards, UPI, Net Banking & more</p>
                                </div>
                            </Label>
                        )}
                    </RadioGroup>
                </div>

                {/* Special Instructions */}
                <div className="bg-card border rounded-xl p-5 space-y-4">
                    <h2 className="text-lg font-semibold">Special Instructions</h2>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any special requests for your order? (optional)"
                        rows={3}
                        className="resize-none"
                    />
                </div>

                {/* Order Summary */}
                <div className="bg-card border rounded-xl p-5 space-y-4">
                    <h2 className="text-lg font-semibold">Order Summary</h2>

                    {/* Items */}
                    <div className="space-y-2 pb-3 border-b">
                        {items.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span>{item.quantity}x {item.name}</span>
                                <span>₹{(item.price * item.quantity).toFixed(0)}</span>
                            </div>
                        ))}
                    </div>

                    {/* Totals */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
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

                        <div className="flex justify-between font-bold text-lg pt-3 border-t">
                            <span>Total</span>
                            <span className="text-primary">₹{total.toFixed(2)}</span>
                        </div>

                        {settings?.free_delivery_above && !isFreeDelivery && orderType === 'delivery' && (
                            <p className="text-xs text-center text-muted-foreground bg-muted/50 rounded-lg py-2 mt-2">
                                🎉 Add ₹{(settings.free_delivery_above - subtotal).toFixed(0)} more for <span className="font-medium text-green-600">free delivery</span>
                            </p>
                        )}
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-14 text-lg font-semibold rounded-xl shadow-lg"
                    size="lg"
                    disabled={isPending || items.length === 0 || (orderType === 'delivery' && !selectedAddress)}
                >
                    {isPending && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    {isPending ? 'Placing Order...' : `Place Order · ₹${total.toFixed(0)}`}
                </Button>
            </form>

            {/* Address Selector Modal - Outside form to prevent form submission */}
            <AddressSelector
                open={showAddressModal}
                onClose={() => setShowAddressModal(false)}
                userId={userId}
                onAddressSelected={handleAddressSelected}
            />
        </>
    )
}
