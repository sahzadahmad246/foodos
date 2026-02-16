import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/encryption'
import Razorpay from 'razorpay'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        const { restaurantId, amount, currency = 'INR' } = body

        if (!restaurantId || !amount) {
            return NextResponse.json(
                { error: 'Restaurant ID and amount are required' },
                { status: 400 }
            )
        }

        const { data: restaurant } = await supabase
            .from('restaurants')
            .select('is_online')
            .eq('id', restaurantId)
            .single()

        if (!restaurant || restaurant.is_online === false) {
            return NextResponse.json(
                { error: 'Restaurant is not accepting orders currently' },
                { status: 400 }
            )
        }

        // Get restaurant's Razorpay keys
        const { data: settings, error: settingsError } = await supabase
            .from('restaurant_settings')
            .select('razorpay_key_id, razorpay_key_secret_encrypted')
            .eq('restaurant_id', restaurantId)
            .single()

        if (settingsError || !settings?.razorpay_key_id || !settings?.razorpay_key_secret_encrypted) {
            console.error('Settings error:', settingsError)
            return NextResponse.json(
                { error: 'Razorpay not configured for this restaurant' },
                { status: 400 }
            )
        }

        // Decrypt the secret key before using
        let decryptedSecret: string
        try {
            decryptedSecret = decrypt(settings.razorpay_key_secret_encrypted)
        } catch (decryptError) {
            console.error('Decryption failed:', decryptError)
            return NextResponse.json(
                { error: 'Failed to decrypt payment keys' },
                { status: 500 }
            )
        }

        // Initialize Razorpay with restaurant's keys
        const razorpay = new Razorpay({
            key_id: settings.razorpay_key_id,
            key_secret: decryptedSecret,
        })

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // Razorpay expects amount in paise
            currency,
            receipt: `order_${Date.now()}`,
        })

        return NextResponse.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: settings.razorpay_key_id,
        })
    } catch (error: any) {
        console.error('Create Razorpay order error:', error)
        return NextResponse.json(
            { error: error?.error?.description || 'Failed to create payment order' },
            { status: 500 }
        )
    }
}
