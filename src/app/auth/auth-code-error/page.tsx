import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export default function AuthCodeErrorPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-[380px] shadow-lg border-neutral-200/60 dark:border-neutral-800">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                        <AlertCircle className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Link Expired</CardTitle>
                    <CardDescription>
                        This link has expired or is invalid. Please request a new one.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                    Password reset and email confirmation links expire after a short time for security reasons.
                </CardContent>
                <CardFooter className="flex justify-center gap-4">
                    <Button asChild variant="outline">
                        <Link href="/login">Back to Login</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/forgot-password">Try Again</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
