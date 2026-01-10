import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function OnboardingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Only logged-in users can access onboarding
    if (!user) {
        redirect('/login')
    }

    // If user already has a restaurant, redirect to dashboard
    const { data: restaurant } = await supabase
        .from('restaurants')
        .select('id')
        .eq('owner_id', user.id)
        .single()

    if (restaurant) {
        redirect('/dashboard')
    }

    return <>{children}</>
}
