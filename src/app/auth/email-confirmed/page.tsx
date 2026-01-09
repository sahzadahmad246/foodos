import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle } from 'lucide-react'

export default function EmailConfirmedPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-[380px] shadow-lg border-neutral-200/60 dark:border-neutral-800">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold">Email Updated!</CardTitle>
                    <CardDescription>
                        Your email address has been successfully changed.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center text-sm text-muted-foreground">
                    You can now use your new email to log in to your account.
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button asChild>
                        <Link href="/profile">Go to Profile</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
