import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { KeyRound, CheckCircle } from 'lucide-react'

export default function PasswordRecoveryPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-[420px] shadow-lg border-neutral-200/60 dark:border-neutral-800">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                        <KeyRound className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold">You&apos;re Logged In!</CardTitle>
                    <CardDescription>
                        You clicked a password recovery link
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-900/20">
                        <CheckCircle className="mt-0.5 h-5 w-5 text-green-600 dark:text-green-400" />
                        <div className="text-sm">
                            <p className="font-medium text-green-800 dark:text-green-200">Successfully authenticated</p>
                            <p className="text-green-700 dark:text-green-300">You&apos;ve been logged in via the recovery link.</p>
                        </div>
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                        You can now reset your password or continue to your account.
                    </p>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                    <Button asChild className="w-full">
                        <Link href="/reset-password">Reset Password</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/profile">Go to Profile</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
