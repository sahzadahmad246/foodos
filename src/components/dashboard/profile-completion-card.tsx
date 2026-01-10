'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, ArrowRight, X } from 'lucide-react'
import { useState } from 'react'

interface ProfileCompletionCardProps {
    percentage: number
    missing: string[]
}

export function ProfileCompletionCard({ percentage, missing }: ProfileCompletionCardProps) {
    const [dismissed, setDismissed] = useState(false)

    if (dismissed || percentage === 100) return null

    return (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-900/20">
            <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <div className="flex-1">
                            <p className="font-medium text-amber-800 dark:text-amber-200">
                                Complete your restaurant profile
                            </p>
                            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
                                Your profile is {percentage}% complete. Add the missing info to go online.
                            </p>
                            <div className="mt-3">
                                <Progress value={percentage} className="h-2" />
                            </div>
                            {missing.length > 0 && missing.length <= 5 && (
                                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                                    Missing: {missing.slice(0, 3).join(', ')}{missing.length > 3 ? ` +${missing.length - 3} more` : ''}
                                </p>
                            )}
                            <Button asChild size="sm" className="mt-3" variant="outline">
                                <Link href="/dashboard/outlet">
                                    Complete Profile <ArrowRight className="ml-2 h-3 w-3" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        className="shrink-0 rounded-md p-1 text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </CardContent>
        </Card>
    )
}
