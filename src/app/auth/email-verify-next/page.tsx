import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail, ArrowRight } from 'lucide-react'

export default function EmailVerifyNextPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
            <Card className="w-[420px] shadow-lg border-neutral-200/60 dark:border-neutral-800">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/20">
                        <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-2xl font-bold">One More Step!</CardTitle>
                    <CardDescription>
                        This email has been verified
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-900/20">
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Action Required
                        </p>
                        <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                            Please check your <strong>other email address</strong> and click the confirmation link there to complete the email change.
                        </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <ArrowRight className="h-4 w-4" />
                        <span>Check inbox → Click link → Email updated!</span>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/">Go to Home</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
