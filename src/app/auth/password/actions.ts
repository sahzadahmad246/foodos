'use server'

import { createClient } from '@/lib/supabase/server'
import { getSiteUrl } from '@/lib/site-url'

export async function forgotPassword(formData: FormData): Promise<{ error?: string; success?: string }> {
    const supabase = await createClient()
    const email = formData.get('email') as string

    // Check if user exists by attempting to get user data
    // We use signInWithPassword with wrong password - if user doesn't exist, 
    // Supabase returns "Invalid login credentials" for both cases
    // A better approach: query the auth.users table (requires service role)
    // For now, we'll attempt password reset and it will silently fail for non-existent emails
    // but Supabase's default behavior already doesn't send to non-existent emails

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${await getSiteUrl()}/auth/confirm`,
    })

    if (error) {
        return { error: error.message }
    }

    // Note: Supabase won't actually send email if user doesn't exist,
    // but it returns success for security (prevents email enumeration)
    return { success: 'If an account exists with this email, you will receive a reset link' }
}

export async function resetPassword(formData: FormData): Promise<{ error?: string; success?: string }> {
    const supabase = await createClient()
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
        return { error: 'Passwords do not match' }
    }

    if (password.length < 6) {
        return { error: 'Password must be at least 6 characters' }
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        return { error: error.message }
    }

    return { success: 'Password updated successfully' }
}

export async function changeEmail(formData: FormData): Promise<{ error?: string; success?: string }> {
    const supabase = await createClient()
    const email = formData.get('email') as string

    const { error } = await supabase.auth.updateUser({ email })

    if (error) {
        return { error: error.message }
    }

    return { success: 'Check your new email for a confirmation link' }
}
