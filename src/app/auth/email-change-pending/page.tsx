import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function EmailChangePendingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-[420px] shadow-lg border-neutral-200/60 dark:border-neutral-800">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                        <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold">New Email Confirmed!</CardTitle>
                    <CardDescription>
                        One more step to complete the change
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/20">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Action Required
                        </p>
                        <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                            A confirmation email has been sent to your <strong>old email address</strong>:
                        </p>
                        {user?.email && (
                            <p className="mt-2 font-mono text-sm text-amber-900 dark:text-amber-100">
                                {user.email}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <ArrowRight className="h-4 w-4" />
                        <span>Click the link in that email to complete the change</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full">
                        <Link href="/profile">Go to Profile</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
