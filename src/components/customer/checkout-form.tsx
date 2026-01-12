'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useCart } from '@/hooks/use-cart'
import { createOrder } from '@/app/r/[slug]/actions'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface Restaurant {
    id: string
    name: string
    slug: string
    restaurant_settings: Array<{
        gst_percentage: number | null
        delivery_fee: number | null
        cod_enabled: boolean
        online_payment_enabled: boolean
    }>
}

interface CheckoutFormProps {
    restaurant: Restaurant
}

export function CheckoutForm({ restaurant }: CheckoutFormProps) {
    const router = useRouter()
    const { items, getTotal, clearCart } = useCart()
    const [isPending, startTransition] = useTransition()

    const [formData, setFormData] = useState({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        orderType: 'delivery',
        paymentMethod: 'cod',
        notes: '',
    })

    const settings = restaurant.restaurant_settings?.[0]
    const subtotal = getTotal()
    const deliveryFee = formData.orderType === 'delivery' ? (settings?.delivery_fee || 0) : 0
    const taxRate = settings?.gst_percentage || 0
    const taxAmount = (subtotal * taxRate) / 100
    const total = subtotal + deliveryFee + taxAmount

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.customerName || !formData.customerPhone) {
            toast.error('Please fill in all required fields')
            return
        }

        if (formData.orderType === 'delivery' && !formData.customerAddress) {
            toast.error('Please enter delivery address')
            return
        }

        if (items.length === 0) {
            toast.error('Your cart is empty')
            return
        }

        startTransition(async () => {
            const result = await createOrder({
                restaurantId: restaurant.id,
                customerName: formData.customerName,
                customerPhone: formData.customerPhone,
                customerAddress: formData.orderType === 'delivery' ? formData.customerAddress : null,
                itemsTotal: subtotal,
                deliveryFee,
                taxAmount,
                totalAmount: total,
                paymentMethod: formData.paymentMethod,
                notes: formData.notes || null,
                items: items.map

                    (item => ({
                        menuItemId: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity,
                    })),
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Order placed successfully!')
                clearCart()
                router.push(`/orders/${result.data.id}`)
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Details */}
            <div className="bg-card border rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold">Customer Details</h2>

                <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                        id="name"
                        value={formData.customerName}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="Enter your name"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                        id="phone"
                        type="tel"
                        value={formData.customerPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                        placeholder="Enter your phone number"
                        required
                    />
                </div>
            </div>

            {/* Order Type */}
            <div className="bg-card border rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold">Order Type</h2>
                <RadioGroup
                    value={formData.orderType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, orderType: value }))}
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="delivery" id="delivery" />
                        <Label htmlFor="delivery">Delivery</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pickup" id="pickup" />
                        <Label htmlFor="pickup">Pickup</Label>
                    </div>
                </RadioGroup>

                {formData.orderType === 'delivery' && (
                    <div className="space-y-2">
                        <Label htmlFor="address">Delivery Address *</Label>
                        <Textarea
                            id="address"
                            value={formData.customerAddress}
                            onChange={(e) => setFormData(prev => ({ ...prev, customerAddress: e.target.value }))}
                            placeholder="Enter delivery address"
                            rows={3}
                            required
                        />
                    </div>
                )}
            </div>

            {/* Payment Method */}
            <div className="bg-card border rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold">Payment Method</h2>
                <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                >
                    {settings?.cod_enabled && (
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="cod" id="cod" />
                            <Label htmlFor="cod">Cash on Delivery</Label>
                        </div>
                    )}
                    {settings?.online_payment_enabled && (
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="online" id="online" />
                            <Label htmlFor="online">Online Payment</Label>
                        </div>
                    )}
                </RadioGroup>
            </div>

            {/* Special Instructions */}
            <div className="bg-card border rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold">Special Instructions (Optional)</h2>
                <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special requests?"
                    rows={3}
                />
            </div>

            {/* Order Summary */}
            <div className="bg-card border rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold">Order Summary</h2>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span>Subtotal ({items.length} items)</span>
                        <span>₹{subtotal.toFixed(2)}</span>
                    </div>
                    {formData.orderType === 'delivery' && (
                        <div className="flex justify-between text-sm">
                            <span>Delivery Fee</span>
                            <span>₹{deliveryFee.toFixed(2)}</span>
                        </div>
                    )}
                    {taxAmount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span>Tax ({taxRate}%)</span>
                            <span>₹{taxAmount.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span>₹{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isPending || items.length === 0}
            >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Placing Order...' : `Place Order (₹${total.toFixed(2)})`}
            </Button>
        </form>
    )
}
