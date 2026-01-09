import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// This route handles all email-based auth flows:
// - Password reset
// - Email confirmation
// - Email change confirmation (both steps)
export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)

    // Supabase may send either token_hash or code depending on email template version
    const token_hash = searchParams.get('token_hash')
    const code = searchParams.get('code')
    const type = searchParams.get('type')
    const next = searchParams.get('next') ?? '/'

    const supabase = await createClient()

    // Get current user email before verification
    const { data: { user: userBefore } } = await supabase.auth.getUser()
    const emailBefore = userBefore?.email

    // Handle token_hash flow (PKCE)
    if (token_hash && type) {
        const { error } = await supabase.auth.verifyOtp({
            type: type as 'recovery' | 'email' | 'signup' | 'invite' | 'magiclink' | 'email_change',
            token_hash,
        })

        if (!error) {
            if (type === 'recovery') {
                return NextResponse.redirect(`${origin}/auth/password-recovery`)
            }
            if (type === 'email_change') {
                // Check if email actually changed
                const { data: { user: userAfter } } = await supabase.auth.getUser()
                if (userAfter?.email !== emailBefore) {
                    // Email changed - this was the final confirmation
                    return NextResponse.redirect(`${origin}/auth/email-confirmed`)
                } else {
                    // Email same - this was first confirmation, need to verify other email
                    return NextResponse.redirect(`${origin}/auth/email-verify-next`)
                }
            }
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Handle code flow (for some email templates)
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            if (type === 'recovery') {
                return NextResponse.redirect(`${origin}/auth/password-recovery`)
            }
            if (type === 'email_change') {
                // Check if email actually changed
                const { data: { user: userAfter } } = await supabase.auth.getUser()
                if (userAfter?.email !== emailBefore) {
                    // Email changed - final confirmation
                    return NextResponse.redirect(`${origin}/auth/email-confirmed`)
                } else {
                    // First confirmation
                    return NextResponse.redirect(`${origin}/auth/email-verify-next`)
                }
            }
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
