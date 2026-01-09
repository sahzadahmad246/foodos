import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AuthForm } from '@/components/auth/auth-form'

export default async function LoginPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Redirect logged-in users to profile
    if (user) {
        redirect('/profile')
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <AuthForm view="login" />
        </div>
    )
}
