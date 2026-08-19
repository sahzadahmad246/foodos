'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/site-url'

async function getPostAuthRedirectPath() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return '/'

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

    if (profile?.role === 'restaurant_owner') return '/dashboard'
    if (profile?.role === 'rider') return '/rider'
    return '/'
}

export async function login(formData: FormData): Promise<{ error?: string; success?: string }> {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    const redirectPath = await getPostAuthRedirectPath()
    revalidatePath('/', 'layout')
    redirect(redirectPath)
}

export async function signup(formData: FormData): Promise<{ error?: string; success?: string }> {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    // 1. Sign up the user
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    // 2. Ideally, we should check if email confirmation is enabled.
    // For now, we assume it is required or handled by Supabase settings.

    if (data.session) {
        // User is signed in (email confirmation disabled or auto-confirmed)
        const redirectPath = await getPostAuthRedirectPath()
        redirect(redirectPath)
    }

    return { success: 'Check your email to continue sign in process' }
}

export async function signInWithGoogle(): Promise<{ error?: string; success?: string }> {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${await getSiteUrl()}/auth/callback`,
        },
    })

    if (error) {
        return { error: error.message }
    }

    if (data.url) {
        redirect(data.url)
    }

    return { error: 'Failed to initiate Google sign-in' }
}
