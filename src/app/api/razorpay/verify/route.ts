import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { decrypt } from '@/lib/encryption'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            restaurantId
        } = body

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !restaurantId) {
            return NextResponse.json(
                { error: 'Missing required payment details' },
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

        // Get restaurant's Razorpay secret to verify signature
        const { data: settings, error: settingsError } = await supabase
            .from('restaurant_settings')
            .select('razorpay_key_secret_encrypted')
            .eq('restaurant_id', restaurantId)
            .single()

        if (settingsError || !settings?.razorpay_key_secret_encrypted) {
            return NextResponse.json(
                { error: 'Restaurant payment settings not found' },
                { status: 400 }
            )
        }

        // Decrypt the secret key
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

        // Verify signature
        const body_data = razorpay_order_id + '|' + razorpay_payment_id
        const expected_signature = crypto
            .createHmac('sha256', decryptedSecret)
            .update(body_data)
            .digest('hex')

        if (expected_signature !== razorpay_signature) {
            return NextResponse.json(
                { error: 'Invalid payment signature' },
                { status: 400 }
            )
        }

        // Payment verified successfully
        return NextResponse.json({
            verified: true,
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
        })
    } catch (error) {
        console.error('Verify payment error:', error)
        return NextResponse.json(
            { error: 'Payment verification failed' },
            { status: 500 }
        )
    }
}
