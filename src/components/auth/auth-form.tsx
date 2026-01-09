'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { login, signup, signInWithGoogle } from '@/app/auth/actions'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export function AuthForm({ view }: { view: 'login' | 'signup' }) {
    const [isPending, startTransition] = useTransition()
    const [isGoogleLoading, setIsGoogleLoading] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        startTransition(async () => {
            const action = view === 'login' ? login : signup
            const result = await action(formData)

            if (result?.error) {
                toast.error(result.error)
            } else if (result?.success) {
                toast.success(result.success)
            }
        })
    }

    const handleGoogleLogin = async () => {
        setIsGoogleLoading(true)
        const result = await signInWithGoogle()
        if (result?.error) {
            toast.error(result.error)
            setIsGoogleLoading(false)
        }
        // redirect happens on server
    }

    const isLoading = isPending || isGoogleLoading

    return (
        <Card className="w-[380px] shadow-lg border-neutral-200/60 dark:border-neutral-800">
            <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                    {view === 'login' ? 'Welcome Back' : 'Get Started'}
                </CardTitle>
                <CardDescription className="text-center">
                    {view === 'login'
                        ? 'Enter your credentials to access your account'
                        : 'Create your account to start managing your restaurant'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4">
                    <Button variant="outline" type="button" onClick={handleGoogleLogin} disabled={isLoading}>
                        {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Continue with Google
                    </Button>
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                        </div>
                    </div>
                    <form action={handleSubmit}>
                        <div className="grid gap-4">
                            {view === 'signup' && (
                                <div className="grid gap-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input id="fullName" name="fullName" placeholder="John Doe" required disabled={isLoading} />
                                </div>
                            )}
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" placeholder="m@example.com" required disabled={isLoading} />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Password</Label>
                                    {view === 'login' && (
                                        <a href="/forgot-password" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-primary">
                                            Forgot password?
                                        </a>
                                    )}
                                </div>
                                <Input id="password" name="password" type="password" required minLength={6} disabled={isLoading} />
                            </div>
                            <Button className="w-full" type="submit" disabled={isLoading}>
                                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {view === 'login' ? 'Sign In' : 'Create Account'}
                            </Button>
                        </div>
                    </form>
                </div>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-sm text-muted-foreground">
                    {view === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <a
                        href={view === 'login' ? '/signup' : '/login'}
                        className="underline underline-offset-4 hover:text-primary"
                    >
                        {view === 'login' ? 'Sign up' : 'Sign in'}
                    </a>
                </p>
            </CardFooter>
        </Card>
    )
}
