import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') // Where user was before login

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            const forwardedHost = request.headers.get('x-forwarded-host')
            const isLocalEnv = process.env.NODE_ENV === 'development'
            const baseUrl = isLocalEnv ? origin : (forwardedHost ? `https://${forwardedHost}` : origin)

            // Get user info
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // Check if user is a restaurant owner
                const { data: restaurant } = await supabase
                    .from('restaurants')
                    .select('id')
                    .eq('owner_id', user.id)
                    .single()

                if (restaurant) {
                    // Owner - go to dashboard
                    return NextResponse.redirect(`${baseUrl}/dashboard`)
                }

                // Check if user is a rider (by email match)
                const { data: rider } = await supabase
                    .from('riders')
                    .select('id')
                    .eq('email', user.email)
                    .eq('is_active', true)
                    .single()

                if (rider) {
                    // Rider - go to rider dashboard
                    return NextResponse.redirect(`${baseUrl}/rider`)
                }
            }

            // Regular user - go to where they came from, or home
            const redirectTo = next || '/'
            return NextResponse.redirect(`${baseUrl}${redirectTo}`)
        }
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
